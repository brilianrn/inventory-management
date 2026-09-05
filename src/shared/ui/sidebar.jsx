'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';
import { usePermission } from '@/packages/access/presentation';
import {
  MENU_BY_MODULE,
  MODULES,
  PANEL_ROUTE,
  resolveModuleId,
} from '@/packages/access/domain/navigation';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import Icon from './icon';
import Logo from './logo';

const isActivePath = (pathname, path) => pathname === path || pathname.startsWith(`${path}/`);

const MenuLink = ({ item, pathname, depth = 0 }) => {
  const active = item.path ? isActivePath(pathname, item.path) : false;

  return (
    <Link
      href={item.path}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-[15px] transition-colors',
        depth > 0 && 'ml-3 border-l pl-4',
        active
          ? 'bg-brand-soft font-semibold text-brand'
          : 'text-body hover:bg-muted hover:text-strong',
      )}
    >
      {item.icon ? <Icon name={item.icon} className="size-[18px] shrink-0" /> : null}
      <span className="truncate">{item.label}</span>
    </Link>
  );
};

const MenuGroup = ({ item, pathname }) => {
  const [open, setOpen] = useState(true);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="space-y-1">
      <CollapsibleTrigger className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase transition-colors hover:text-strong">
        {item.icon ? <Icon name={item.icon} className="size-4 shrink-0" /> : null}
        <span className="flex-1 truncate">{item.label}</span>
        <Icon
          name="chevronDown"
          className={cn('size-3.5 transition-transform', !open && '-rotate-90')}
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-1">
        {item.children.map((child) => (
          <MenuLink key={child.id} item={child} pathname={pathname} depth={1} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default function Sidebar() {
  const pathname = usePathname();
  const { filterMenu } = usePermission();

  const moduleId = resolveModuleId(pathname);
  const moduleMeta = MODULES.find((module) => module.id === moduleId);
  const menu = useMemo(() => filterMenu(MENU_BY_MODULE[moduleId] ?? []), [filterMenu, moduleId]);

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r bg-card lg:flex lg:flex-col">
      <Link
        href={PANEL_ROUTE}
        className="flex items-center gap-3 border-b px-5 py-4 transition-colors hover:bg-muted"
      >
        <Logo className="h-8 w-auto shrink-0" />
        <span className="min-w-0 border-l border-line pl-3">
          <span className="block truncate text-[13px] font-medium text-muted-foreground">
            {moduleMeta?.name ?? 'Modul'}
          </span>
        </span>
      </Link>

      <ScrollArea className="flex-1">
        <nav className="space-y-1 px-3 py-4">
          {menu.length ? (
            menu.map((item) =>
              item.children ? (
                <MenuGroup key={item.id} item={item} pathname={pathname} />
              ) : (
                <MenuLink key={item.id} item={item} pathname={pathname} />
              ),
            )
          ) : (
            <p className="px-3 py-6 text-sm text-muted-foreground">
              Tidak ada menu yang bisa diakses dengan kombinasi izin saat ini.
            </p>
          )}
        </nav>
      </ScrollArea>

      <Separator />
      <p className="px-5 py-3 text-xs leading-relaxed text-muted-foreground">
        Menu disaring menurut izin lihat. Ubah izin lewat panel demo di pojok kanan bawah.
      </p>
    </aside>
  );
}
