import { LogOut, User } from 'lucide-react';
import { useUserStore } from '@entities/user/model';
import { useLogout } from '@features/auth/login';
import { Button } from '@shared/ui';

export function Header() {
  const { user } = useUserStore();
  const logout = useLogout();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <span className="text-lg font-bold text-[var(--color-text)]">
          Task<span className="text-indigo-500">Flow</span>
        </span>

        {/* User */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400">
              <User size={14} />
            </div>
            <span className="hidden sm:block">{user?.name}</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => logout.mutate()}
            loading={logout.isPending}
            className="gap-1.5"
          >
            <LogOut size={14} />
            <span className="hidden sm:block">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}