'use client';

import { useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import Icon from './icon';

export const PAGE_SIZE = 10;

export default function DataTable({
  columns,
  rows,
  rowKey,
  pageIndex = 0,
  onPageChange,
  emptyTitle = 'Tidak ada data',
  emptyDescription = 'Coba ubah kata kunci pencarian atau kosongkan filter.',
  isLoading = false,
  getRowClassName,
}) {
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);

  useEffect(() => {
    if (pageIndex > pageCount - 1) onPageChange(pageCount - 1);
  }, [pageIndex, pageCount, onPageChange]);

  const pageRows = useMemo(
    () => rows.slice(safePageIndex * PAGE_SIZE, safePageIndex * PAGE_SIZE + PAGE_SIZE),
    [rows, safePageIndex],
  );

  const firstRow = rows.length ? safePageIndex * PAGE_SIZE + 1 : 0;
  const lastRow = Math.min(rows.length, (safePageIndex + 1) * PAGE_SIZE);

  if (isLoading) {
    return (
      <div className="space-y-2 py-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-11 w-full" />
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/40 px-6 py-14 text-center">
        <p className="text-sm font-semibold text-strong">{emptyTitle}</p>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.key}
                style={column.width ? { width: column.width } : undefined}
                className={cn(
                  'h-12 py-0 text-[13px] font-semibold tracking-wide uppercase',
                  column.align === 'right' && 'text-right',
                )}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {pageRows.map((row) => (
            <TableRow key={rowKey(row)} className={getRowClassName?.(row)}>
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  className={cn('py-3.5 text-body', column.align === 'right' && 'text-right tabular-nums')}
                >
                  {column.render ? column.render(row) : row[column.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {rows.length > PAGE_SIZE ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
          <p className="text-[13px] text-muted-foreground">
            Menampilkan {firstRow}–{lastRow} dari {rows.length} baris
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              disabled={safePageIndex === 0}
              onClick={() => onPageChange(safePageIndex - 1)}
              aria-label="Halaman sebelumnya"
            >
              <Icon name="chevronLeft" className="size-4" />
            </Button>
            <span className="px-2 text-[13px] tabular-nums text-body">
              {safePageIndex + 1} / {pageCount}
            </span>
            <Button
              variant="outline"
              size="icon"
              disabled={safePageIndex >= pageCount - 1}
              onClick={() => onPageChange(safePageIndex + 1)}
              aria-label="Halaman berikutnya"
            >
              <Icon name="chevronRight" className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
