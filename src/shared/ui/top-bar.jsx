'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PANEL_ROUTE, resolvePageTitle } from '@/packages/access/domain/navigation';
import { usePermission } from '@/packages/access/presentation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Icon from './icon';
import { useTheme } from './theme-provider';

const initialsOf = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon-lg"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'}
      title={theme === 'dark' ? 'Tema terang' : 'Tema gelap'}
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} className="size-4" />
    </Button>
  );
};

const UserMenu = () => {
  const { profile, permissions } = usePermission();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label="Menu pengguna" className="rounded-full outline-none">
          <Avatar className="size-9">
            <AvatarFallback className="bg-brand-soft text-xs font-semibold text-brand">
              {initialsOf(profile?.name)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-semibold text-strong">{profile?.name}</p>
          <p className="truncate text-xs text-muted-foreground">{profile?.email}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{profile?.jobTitle}</p>
          {profile?.outlet ? (
            <p className="mt-1 truncate text-xs text-muted-foreground">{profile.outlet}</p>
          ) : null}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          {permissions.length} izin aktif
        </DropdownMenuLabel>

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={PANEL_ROUTE}>
            <Icon name="logout" className="size-4" />
            Keluar
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export function DeskTopBar({ backHref, title }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-card/85 px-5 backdrop-blur">
      {backHref ? (
        <Button asChild variant="ghost" size="icon-lg" aria-label="Kembali">
          <Link href={backHref}>
            <Icon name="chevronLeft" className="size-4.5" />
          </Link>
        </Button>
      ) : (
        <Button asChild size="icon-lg" className="lg:hidden" aria-label="Panel Admin">
          <Link href={PANEL_ROUTE}>
            <Icon name="layers" className="size-4.5" strokeWidth={2} />
          </Link>
        </Button>
      )}

      <h1 className="min-w-0 flex-1 truncate text-base font-semibold tracking-tight text-strong">
        {title ?? resolvePageTitle(pathname)}
      </h1>

      <ThemeToggle />
      <UserMenu />
    </header>
  );
}

export function MobileTopBar({ backHref, onBack, title, trailing, subtitle }) {
  const pathname = usePathname();
  const router = useRouter();

  const showBack = Boolean(backHref || onBack);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-card px-3">
      {showBack ? (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Kembali"
          onClick={() => (onBack ? onBack() : router.push(backHref))}
        >
          <Icon name="chevronLeft" className="size-5" />
        </Button>
      ) : (
        <span className="ml-1 grid size-8 place-items-center rounded-lg bg-brand text-primary-foreground">
          <Icon name="layers" className="size-4" strokeWidth={2} />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-sm font-semibold text-strong">
          {title ?? resolvePageTitle(pathname)}
        </h1>
        {subtitle ? (
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>

      {trailing}
    </header>
  );
}

export default DeskTopBar;
