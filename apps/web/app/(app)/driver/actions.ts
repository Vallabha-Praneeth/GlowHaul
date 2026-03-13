'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { recordIdSchema } from '@glowhaul/core';
import type { Database } from '../../../../../packages/supabase/types/database';
import { requireAuthenticatedProfile } from '../../../lib/auth';
import { rethrowRedirectError } from '../../../lib/redirect-errors';
import { createServerSupabaseClient } from '../../../lib/supabase/server';

type ProofAssetInsert = Database['public']['Tables']['proof_assets']['Insert'];
type DriverRunStatusRow = Pick<Database['public']['Tables']['runs']['Row'], 'id' | 'proof_required' | 'status'>;
type RunStatus = Database['public']['Enums']['run_status'];
type InsertResult = Promise<{ error: { message: string } | null }>;
const runStatusSchema = z.enum(['assigned', 'en_route', 'live', 'completed', 'issue'] as const);

function encodeMessage(message: string) {
  return encodeURIComponent(message);
}

function sanitizeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase();
}

function sleep(timeoutMs: number) {
  return new Promise((resolve) => setTimeout(resolve, timeoutMs));
}

function isRetryableStorageError(message: string) {
  const normalized = message.toLowerCase();

  return normalized.includes('invalid response was received from the upstream server')
    || normalized.includes('error status 502')
    || normalized.includes('error status 503')
    || normalized.includes('error sending request');
}

export async function uploadDriverProof(formData: FormData) {
  const runId = formData.get('runId');
  const fileValue = formData.get('proofFile');

  if (typeof runId !== 'string' || !recordIdSchema.safeParse(runId).success) {
    redirect('/driver?error=' + encodeMessage('Choose a valid assigned run before uploading proof.'));
  }

  if (!(fileValue instanceof File) || fileValue.size === 0) {
    redirect('/driver?error=' + encodeMessage('Attach a proof file before uploading.'));
  }

  if (fileValue.size > 10 * 1024 * 1024) {
    redirect('/driver?error=' + encodeMessage('Proof files must be 10 MB or smaller for the local workflow.'));
  }

  try {
    const profile = await requireAuthenticatedProfile('driver');
    const supabase = await createServerSupabaseClient();
    const { data: run } = await supabase
      .from('runs')
      .select('id, driver_id')
      .eq('id', runId)
      .eq('driver_id', profile.id)
      .maybeSingle();

    if (!run) {
      redirect('/driver?error=' + encodeMessage('That run is not assigned to your driver profile.'));
    }

    const extension = sanitizeFileName(fileValue.name || 'proof-upload');
    const mimeType = fileValue.type || 'application/octet-stream';
    const fileBytes = new Uint8Array(await fileValue.arrayBuffer());
    let uploadErrorMessage: string | null = null;
    let uploadedStoragePath: string | null = null;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const storagePath = `${profile.id}/${runId}/${Date.now()}-${attempt}-${extension}`;
      const { error: uploadError } = await supabase.storage.from('proof-uploads').upload(storagePath, fileBytes, {
        contentType: mimeType,
        upsert: false,
      });

      if (!uploadError) {
        uploadedStoragePath = storagePath;
        break;
      }

      uploadErrorMessage = uploadError.message;
      if (!isRetryableStorageError(uploadError.message) || attempt === 3) {
        break;
      }

      await sleep(attempt * 500);
    }

    if (!uploadedStoragePath) {
      redirect('/driver?error=' + encodeMessage(uploadErrorMessage ?? 'Unable to upload proof.'));
    }

    const proofPayload: ProofAssetInsert = {
      captured_at: new Date().toISOString(),
      driver_id: profile.id,
      mime_type: mimeType,
      run_id: runId,
      status: 'uploaded',
      storage_path: uploadedStoragePath,
    };
    const proofAssetTable = supabase.from('proof_assets') as unknown as {
      insert: (values: ProofAssetInsert) => InsertResult;
    };
    const { error: insertError } = await proofAssetTable.insert(proofPayload);

    if (insertError) {
      const { error: cleanupError } = await supabase.storage
        .from('proof-uploads')
        .remove([uploadedStoragePath]);

      if (cleanupError) {
        console.error('Failed to clean up orphaned proof upload', cleanupError);
      }

      redirect('/driver?error=' + encodeMessage(insertError.message));
    }
  } catch (error) {
    rethrowRedirectError(error);
    redirect('/driver?error=' + encodeMessage(error instanceof Error ? error.message : 'Unable to upload proof.'));
  }

  revalidatePath('/driver');
  redirect('/driver?notice=' + encodeMessage('Proof uploaded to Supabase storage.'));
}

function isAllowedDriverTransition(currentStatus: RunStatus, nextStatus: RunStatus) {
  if (currentStatus === nextStatus) {
    return true;
  }

  switch (currentStatus) {
    case 'assigned':
      return nextStatus === 'en_route' || nextStatus === 'issue';
    case 'en_route':
      return nextStatus === 'live' || nextStatus === 'issue';
    case 'live':
      return nextStatus === 'completed' || nextStatus === 'issue';
    case 'issue':
      return nextStatus === 'en_route' || nextStatus === 'live';
    case 'completed':
      return false;
    default:
      return false;
  }
}

export async function updateDriverRunStatus(formData: FormData) {
  const parsed = z.object({
    issueNote: z.string().trim().max(280).optional(),
    nextStatus: runStatusSchema,
    runId: recordIdSchema,
  }).safeParse({
    issueNote: formData.get('issueNote'),
    nextStatus: formData.get('nextStatus'),
    runId: formData.get('runId'),
  });

  if (!parsed.success) {
    redirect('/driver?error=' + encodeMessage('Choose a valid run status update before saving.'));
  }

  try {
    const profile = await requireAuthenticatedProfile('driver');
    const supabase = await createServerSupabaseClient();
    const { data: run } = await supabase
      .from('runs')
      .select('id, status, proof_required')
      .eq('id', parsed.data.runId)
      .eq('driver_id', profile.id)
      .maybeSingle();
    const assignedRun = run as DriverRunStatusRow | null;

    if (!assignedRun) {
      throw new Error('That run is not assigned to your driver profile.');
    }

    if (!isAllowedDriverTransition(assignedRun.status, parsed.data.nextStatus)) {
      throw new Error(`You cannot move a ${assignedRun.status.replace('_', ' ')} run to ${parsed.data.nextStatus.replace('_', ' ')}.`);
    }

    const issueNote = parsed.data.issueNote?.trim() ? parsed.data.issueNote.trim() : undefined;

    if (parsed.data.nextStatus === 'issue' && !issueNote) {
      throw new Error('Add a short issue note before reporting a blocked run.');
    }

    if (parsed.data.nextStatus === 'completed' && assignedRun.proof_required) {
      const { count, error: proofCountError } = await supabase
        .from('proof_assets')
        .select('id', { count: 'exact', head: true })
        .eq('run_id', assignedRun.id)
        .eq('driver_id', profile.id);

      if (proofCountError) {
        throw new Error(proofCountError.message);
      }

      if (!count) {
        throw new Error('Upload at least one proof file before completing a proof-required run.');
      }
    }

    const { error } = await (supabase as any).rpc('update_driver_run_status', {
      target_issue_note: issueNote,
      target_run_id: parsed.data.runId,
      target_status: parsed.data.nextStatus,
    });

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    rethrowRedirectError(error);
    redirect('/driver?error=' + encodeMessage(error instanceof Error ? error.message : 'Unable to update run status.'));
  }

  revalidatePath('/driver');
  revalidatePath('/operator');
  revalidatePath('/planner/search');
  redirect('/driver?notice=' + encodeMessage('Run status updated.'));
}
