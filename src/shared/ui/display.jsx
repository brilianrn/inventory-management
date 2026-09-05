'use client';

import { Badge } from '@/components/ui/badge';
import { Tabs as UiTabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import Icon from './icon';

const BADGE_TONE = {
  validated: 'bg-brand-soft text-brand',
  processed: 'bg-info-soft text-info',
  notified: 'bg-warn-soft text-warn',
  unvalidated: 'bg-danger-soft text-danger',
  active: 'bg-brand-soft text-brand',
  inactive: 'bg-muted text-muted-foreground',
  neutral: 'bg-muted text-muted-foreground',
};

export const StatusBadge = ({ tone = 'neutral', children }) => (
  <Badge variant="secondary" className={cn('font-semibold', BADGE_TONE[tone] ?? BADGE_TONE.neutral)}>
    {children}
  </Badge>
);

export const Fieldset = ({ items }) => (
  <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
    {items.map((item) => (
      <div key={item.label} className={item.wide ? 'sm:col-span-2' : undefined}>
        <dt className="text-xs text-muted-foreground">{item.label}</dt>
        <dd className="mt-0.5 text-sm break-words text-strong">{item.value ?? '-'}</dd>
      </div>
    ))}
  </dl>
);

export const Tabs = ({ tabs, activeId, onChange }) => (
  <UiTabs value={activeId} onValueChange={onChange} className="mb-4">
    <TabsList className="w-full">
      {tabs.map((tab) => (
        <TabsTrigger key={tab.id} value={tab.id} className="flex-1">
          {tab.label}
        </TabsTrigger>
      ))}
    </TabsList>
  </UiTabs>
);

export const InfoHint = ({ text }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button type="button" className="ml-1 inline-flex align-middle" aria-label="Penjelasan kolom">
        <Icon name="info" className="size-3.5 cursor-help text-muted-foreground" />
      </button>
    </TooltipTrigger>
    <TooltipContent className="max-w-64 text-xs leading-relaxed font-normal normal-case">
      {text}
    </TooltipContent>
  </Tooltip>
);

export const NotificationBanner = ({ message, onDismiss }) => (
  <div className="mb-4 flex items-center gap-2 rounded-xl border border-brand/30 bg-brand-soft px-4 py-3 text-sm text-brand">
    <Icon name="check" className="size-4 shrink-0" strokeWidth={2} />
    <span className="flex-1">{message}</span>
    <button
      type="button"
      onClick={onDismiss}
      className="grid size-6 shrink-0 place-items-center rounded transition-opacity hover:opacity-70"
      aria-label="Tutup notifikasi"
    >
      <Icon name="close" className="size-3.5" />
    </button>
  </div>
);

export const BackLink = ({ href, children }) => (
  <a
    href={href}
    className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-strong"
  >
    <Icon name="chevronLeft" className="size-4" />
    {children}
  </a>
);
