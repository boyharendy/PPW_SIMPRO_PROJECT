import { getStatusColor, getStatusLabel } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const color = getStatusColor(status);
  const label = getStatusLabel(status);

  return (
    <span
      className={`inline-flex items-center font-medium rounded-lg border whitespace-nowrap ${color} ${
        size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
      }`}
    >
      {label}
    </span>
  );
}
