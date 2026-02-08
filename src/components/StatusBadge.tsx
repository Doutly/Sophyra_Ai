interface StatusBadgeProps {
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  animate?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function StatusBadge({ status, animate = false, size = 'md' }: StatusBadgeProps) {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  };

  const statusConfig = {
    pending: {
      bg: 'bg-swiss-status-pending',
      text: 'text-swiss-status-pending-text',
      label: 'Pending Review',
      icon: '⏳',
    },
    approved: {
      bg: 'bg-swiss-status-approved',
      text: 'text-swiss-status-approved-text',
      label: 'Approved',
      icon: '✓',
    },
    rejected: {
      bg: 'bg-swiss-status-rejected',
      text: 'text-swiss-status-rejected-text',
      label: 'Rejected',
      icon: '✕',
    },
    completed: {
      bg: 'bg-swiss-status-completed',
      text: 'text-swiss-status-completed-text',
      label: 'Completed',
      icon: '★',
    },
  };

  const config = statusConfig[status];
  const animationClass = animate ? 'animate-scale-in' : '';

  return (
    <span
      className={`inline-flex items-center ${sizeStyles[size]} ${config.bg} ${config.text} font-medium rounded-full ${animationClass}`}
    >
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </span>
  );
}
