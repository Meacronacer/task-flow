import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@shared/lib';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label ? (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--color-text-muted)]"
          >
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-lg border px-3 py-2 text-sm',
            'bg-[var(--color-surface-2)] border-[var(--color-border)]',
            'text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
            'transition-colors duration-150',
            error && 'border-red-500 focus:ring-red-500',
            className,
          )}
          {...props}
        />
        {error ? (
          <span className="text-xs text-red-400">{error}</span>
        ) : null}
      </div>
    );
  },
);

Input.displayName = 'Input';