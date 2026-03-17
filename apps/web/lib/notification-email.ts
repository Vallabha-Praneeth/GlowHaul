import 'server-only';

import { env, isNotificationEmailConfigured } from './env';
import { getAppOrigin } from './site-url';
import { createAdminSupabaseClient } from './supabase/admin';

type EmailRecipient = {
  email: string;
  name?: string | null;
  profileId: string;
};

type NotificationEmailInput = {
  bodyText: string;
  href: string;
  idempotencyKey: string;
  recipients: EmailRecipient[];
  subject: string;
};

type NotificationEmailLog = {
  eventKey: string;
  href: string;
  recipientProfileId: string;
  subject: string;
  error: string;
  attempts: number;
};

async function logEmailFailure(details: NotificationEmailLog) {
  const admin = createAdminSupabaseClient();
  if (!admin) {
    return;
  }

  const { error: dbError } = await admin.from('notification_email_logs').insert({
    recipient_profile_id: details.recipientProfileId,
    event_key: details.eventKey,
    href: details.href,
    subject: details.subject,
    error: details.error,
    attempts: details.attempts,
  });

  if (dbError) {
    console.error('Failed to log notification email failure.', {
      dbError: dbError.message,
      ...details,
    });
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildEmailHtml(subject: string, bodyText: string, absoluteHref: string) {
  return [
    '<div style="font-family:Inter,Segoe UI,Arial,sans-serif;max-width:560px;color:#111827">',
    `<h2 style="margin:0 0 16px;font-size:20px">${escapeHtml(subject)}</h2>`,
    `<p style="margin:0 0 16px;line-height:1.6">${escapeHtml(bodyText)}</p>`,
    `<p style="margin:24px 0"><a href="${escapeHtml(absoluteHref)}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 16px;border-radius:10px">Open GlowHaul</a></p>`,
    '<p style="margin:0;color:#6b7280;font-size:13px">This is a workflow event from GlowHaul.</p>',
    '</div>',
  ].join('');
}

export async function sendNotificationEmails(input: NotificationEmailInput) {
  if (!isNotificationEmailConfigured() || input.recipients.length === 0) {
    return;
  }

  const absoluteHref = new URL(input.href, getAppOrigin()).toString();
  const deliveries = input.recipients.map(async (recipient) => {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5_000);

      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': `${input.idempotencyKey}/${recipient.profileId}`,
          },
          body: JSON.stringify({
            from: env.NOTIFICATION_EMAIL_FROM!,
            to: [recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email],
            subject: input.subject,
            html: buildEmailHtml(input.subject, input.bodyText, absoluteHref),
            text: `${input.subject}\n\n${input.bodyText}\n\nOpen GlowHaul: ${absoluteHref}`,
            reply_to: env.NOTIFICATION_EMAIL_REPLY_TO || undefined,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Resend email failed (${response.status}): ${await response.text()}`);
        }

        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (attempt === 3) {
          await logEmailFailure({
            eventKey: input.idempotencyKey,
            href: input.href,
            recipientProfileId: recipient.profileId,
            subject: input.subject,
            error: message,
            attempts: attempt,
          });
        } else {
          await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
        }
      } finally {
        clearTimeout(timer);
      }
    }
  });

  void Promise.allSettled(deliveries).then((results) => {
    const failures = results.filter((result) => result.status === 'rejected');

    if (failures.length > 0) {
      console.error('Notification email delivery failed.', {
        failures: failures.map((result) =>
          (result as PromiseRejectedResult).reason instanceof Error
            ? (result as PromiseRejectedResult).reason.message
            : String((result as PromiseRejectedResult).reason)
        ),
        idempotencyKey: input.idempotencyKey,
        recipientCount: input.recipients.length,
      });
    }
  });
}
