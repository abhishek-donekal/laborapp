import { Job, PayType } from './types';

export function payLabel(rate: number, type: PayType): string {
  const money = `$${rate}`;
  switch (type) {
    case 'hourly':
      return `${money}/hr`;
    case 'daily':
      return `${money}/day`;
    case 'fixed':
      return `${money} flat`;
  }
}

export function formatDate(iso: string): string {
  // iso is YYYY-MM-DD
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function jobPay(job: Job): string {
  return payLabel(job.payRate, job.payType);
}
