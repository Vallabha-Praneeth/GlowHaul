export const dateFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  timeZone: 'America/Chicago',
});

export const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  month: 'short',
  timeZone: 'America/Chicago',
});

export const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'America/Chicago',
});

export function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(cents / 100);
}

export function formatOptionalDateTime(value: string | null | undefined) {
  return value ? dateTimeFormatter.format(new Date(value)) : null;
}

export function formatPlural(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function formatStatus(status: string) {
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function getStatusTone(status: string): 'success' | 'warning' {
  if (['accepted', 'approved', 'booked', 'completed', 'confirmed', 'live', 'running'].includes(status)) {
    return 'success';
  }

  return 'warning';
}

export function formatTimeWindow(startAt: string, endAt: string) {
  const start = new Date(startAt);
  const end = new Date(endAt);
  return `${dateFormatter.format(start)} • ${timeFormatter.format(start)}-${timeFormatter.format(end)}`;
}

export function getFileName(path: string) {
  const parts = path.split('/');
  return parts[parts.length - 1] ?? path;
}

export function getProofAssetHref(id: string) {
  return `/proof/${id}`;
}
