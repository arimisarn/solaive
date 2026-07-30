import Link from 'next/link';
import { cn } from '@/lib/utils';

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
  className,
}: AuthCardProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10 sm:px-6">
      <div
        className={cn(
          'w-full max-w-md rounded-xl border border-border bg-card p-6 sm:p-8',
          className
        )}
      >
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="font-heading text-2xl font-bold text-accent tracking-tight"
          >
            Solaive
          </Link>
          <h1 className="mt-4 font-heading text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm text-foreground/60">{subtitle}</p>
          )}
        </div>

        {children}
      </div>

      {footer && (
        <p className="mt-6 text-center text-sm text-foreground/70">{footer}</p>
      )}
    </div>
  );
}
