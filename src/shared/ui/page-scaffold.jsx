import { Button as UiButton } from '@/components/ui/button';
import { Card as UiCard, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import Icon from './icon';

export const PageHeader = ({ title, description, actions }) => (
  <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
    <div className="min-w-0">
      <h2 className="text-2xl font-semibold tracking-tight text-strong">{title}</h2>
      {description ? (
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
    {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
  </div>
);

export const Card = ({ children, className = '' }) => (
  <UiCard className={cn('gap-0 py-0', className)}>
    <CardContent className="px-6 py-6">{children}</CardContent>
  </UiCard>
);

export const StatCard = ({ label, value, hint, tone = 'default' }) => {
  const tones = {
    default: 'text-strong',
    brand: 'text-brand',
    warn: 'text-warn',
    danger: 'text-danger',
    info: 'text-info',
  };

  return (
    <UiCard className="gap-0 py-0">
      <CardContent className="px-4 py-4">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
        <p className={cn('mt-2 text-2xl font-semibold tabular-nums', tones[tone])}>{value}</p>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </UiCard>
  );
};

const VARIANT_MAP = {
  primary: 'default',
  outline: 'outline',
  ghost: 'ghost',
  danger: 'destructive',
  secondary: 'secondary',
};

export const Button = ({
  variant = 'primary',
  size = 'lg',
  icon,
  children,
  className = '',
  ...props
}) => (
  <UiButton variant={VARIANT_MAP[variant] ?? variant} size={size} className={className} {...props}>
    {icon && !props.asChild ? (
      <>
        <Icon name={icon} className="size-4" />
        {children}
      </>
    ) : (
      children
    )}
  </UiButton>
);

export const MoreMenu = ({ children }) => {
  const items = (Array.isArray(children) ? children : [children]).filter(Boolean);
  if (!items.length) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <UiButton variant="outline" size="icon-lg" aria-label="Menu lainnya">
          <Icon name="dots" className="size-4" />
        </UiButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {items}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const MoreMenuItem = ({ children, onClick, ...props }) => (
  <DropdownMenuItem onSelect={onClick} {...props}>
    {children}
  </DropdownMenuItem>
);

export const NotBuiltYet = ({ note }) => (
  <div className="rounded-xl border border-dashed border-border bg-muted/40 px-6 py-14 text-center">
    <span className="mx-auto grid size-11 place-items-center rounded-xl bg-card text-muted-foreground">
      <Icon name="box" className="size-5" />
    </span>
    <p className="mt-3 text-sm font-semibold text-strong">Halaman ini belum dibangun</p>
    <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
      {note ?? 'Fondasi, hak akses, dan datanya sudah siap. Tabel serta formnya menyusul.'}
    </p>
  </div>
);
