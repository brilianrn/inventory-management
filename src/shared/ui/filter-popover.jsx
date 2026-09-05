'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import Icon from './icon';

export default function FilterPopover({ isFiltering, onApply, onReset, children }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className={cn(isFiltering && 'border-brand bg-brand-soft text-brand hover:bg-brand-soft')}
        >
          <Icon name="filter" className="size-4" />
          Filter
          {isFiltering ? <span className="size-1.5 rounded-full bg-brand" /> : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[min(46rem,calc(100vw-3rem))] overflow-hidden p-0"
      >
        <div className="max-h-[26rem] overflow-y-auto p-4">{children}</div>

        <div className="flex items-center justify-between gap-2 border-t bg-muted/40 px-4 py-3">
          <Button
            variant="ghost"
            size="lg"
            onClick={() => {
              onReset();
              close();
            }}
          >
            Reset
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="lg" onClick={close}>
              Batal
            </Button>
            <Button
              size="lg"
              onClick={() => {
                onApply();
                close();
              }}
            >
              Terapkan
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export const FilterColumn = ({ title, children }) => (
  <div className="min-w-0 flex-1">
    <h3 className="mb-2.5 text-xs font-semibold tracking-wide text-strong uppercase">{title}</h3>
    {children}
  </div>
);

export const FilterColumns = ({ children }) => (
  <div className="flex flex-col gap-5 sm:flex-row sm:gap-4">{children}</div>
);
