'use client';

import { useMemo, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import Icon from './icon';

export const SearchBox = ({ value, onChange, placeholder = 'Cari', className = '' }) => (
  <div className={cn('relative flex items-center', className)}>
    <Icon
      name="search"
      className="pointer-events-none absolute left-3 size-4 text-muted-foreground"
    />
    <Input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="pl-9"
    />
  </div>
);

export const CheckboxList = ({
  options,
  selected,
  onToggle,
  searchable = false,
  emptyLabel = 'Tidak ada pilihan',
  height = 'h-48',
}) => {
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return options;
    return options.filter((option) => option.label.toLowerCase().includes(keyword));
  }, [options, query]);

  return (
    <div className="space-y-2">
      {searchable ? <SearchBox value={query} onChange={setQuery} /> : null}

      <ScrollArea className={cn('rounded-lg border', height)}>
        {visible.length ? (
          <ul className="divide-y divide-border/60">
            {visible.map((option) => (
              <li key={option.value}>
                <Label className="flex cursor-pointer items-start gap-2.5 px-3 py-2 font-normal transition-colors hover:bg-muted">
                  <Checkbox
                    checked={selected.includes(option.value)}
                    onCheckedChange={() => onToggle(option.value)}
                    className="mt-0.5"
                  />
                  <span className="min-w-0 text-sm text-body">{option.label}</span>
                </Label>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">{emptyLabel}</p>
        )}
      </ScrollArea>
    </div>
  );
};

export const MAX_RANGE_DAYS = 90;

export const DateRangeField = ({ from, to, onChange }) => {
  const maxTo = useMemo(() => {
    if (!from) return undefined;
    const limit = new Date(from);
    limit.setDate(limit.getDate() + MAX_RANGE_DAYS - 1);
    return limit.toISOString().slice(0, 10);
  }, [from]);

  const minFrom = useMemo(() => {
    if (!to) return undefined;
    const limit = new Date(to);
    limit.setDate(limit.getDate() - MAX_RANGE_DAYS + 1);
    return limit.toISOString().slice(0, 10);
  }, [to]);

  return (
    <div className="space-y-2">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Dari</Label>
        <Input
          type="date"
          value={from ?? ''}
          min={minFrom}
          max={to ?? undefined}
          onChange={(event) => onChange({ from: event.target.value || null, to })}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Sampai</Label>
        <Input
          type="date"
          value={to ?? ''}
          min={from ?? undefined}
          max={maxTo}
          onChange={(event) => onChange({ from, to: event.target.value || null })}
        />
      </div>

      <p className="text-xs text-muted-foreground">Rentang maksimal {MAX_RANGE_DAYS} hari.</p>
    </div>
  );
};

export const SelectField = ({ label, value, onChange, options, disabled = false, placeholder }) => (
  <div className="space-y-1.5">
    {label ? (
      <Label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </Label>
    ) : null}

    <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder ?? 'Pilih'} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

export const TextField = ({ label, error, hint, className = '', ...props }) => (
  <div className="space-y-1.5">
    {label ? (
      <Label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </Label>
    ) : null}
    <Input aria-invalid={Boolean(error)} className={className} {...props} />
    {error ? <p className="text-xs text-destructive">{error}</p> : null}
    {!error && hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
  </div>
);
