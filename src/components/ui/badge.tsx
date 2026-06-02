import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
  onClick?: () => void;
}

export function Badge({ children, color, className, onClick }: BadgeProps) {
  return (
    <span
      onClick={onClick}
      className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', onClick && 'cursor-pointer hover:opacity-80', className)}
      style={color ? { backgroundColor: color + '22', color, border: `1px solid ${color}44` } : undefined}
    >
      {children}
    </span>
  );
}
