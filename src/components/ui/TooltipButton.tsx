'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';

export interface TooltipButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tooltip: string;
  icon: string;
  iconClassName?: string;
  variant?: 'ghost' | 'destructive' | 'warning' | 'success';
  size?: 'sm' | 'md';
}

const variantStyles = {
  ghost:       'text-muted-foreground hover:text-foreground hover:bg-muted',
  destructive: 'text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-destructive/20',
  warning:     'text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10 border border-amber-500/20',
  success:     'text-muted-foreground hover:text-green-600 hover:bg-green-500/10 border border-green-500/20',
};

const sizeStyles = {
  sm: 'h-7 w-7',
  md: 'h-8 w-8',
};

export function TooltipButton({
  tooltip,
  icon,
  iconClassName,
  variant = 'ghost',
  size = 'sm',
  className,
  ...props
}: TooltipButtonProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        aria-label={tooltip}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        className={cn(
          "relative inline-flex items-center justify-center rounded-lg transition-all duration-150",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        <Icon icon={icon} className={cn("h-3.5 w-3.5", iconClassName)} />
      </button>
      {visible && (
        <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-9998
          bg-popover border border-border rounded-lg px-2.5 py-1.5 shadow-lg whitespace-nowrap">
          <span className="text-[11px] font-semibold text-foreground">{tooltip}</span>
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-popover border-b border-r border-border rotate-45 -mt-1" />
        </div>
      )}
    </div>
  );
}

export default TooltipButton;
