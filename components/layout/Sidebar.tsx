'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Sprout, Settings, LogOut } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useConfirm, useToast } from '@/components/ui';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/varieties', label: 'Varieties', icon: Sprout },
  { href: '/setup', label: 'Setup', icon: Settings },
];

export function Sidebar({ displayName }: { displayName: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const confirm = useConfirm();
  const { toast } = useToast();

  async function handleSignOut() {
    const ok = await confirm({
      title: 'Sign out?',
      description: 'You\'ll need to sign back in to access your garden plan.',
      confirmLabel: 'Sign out',
    });
    if (!ok) return;

    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast({
        variant: 'error',
        title: 'Couldn\'t sign out',
        description: error.message,
      });
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <aside
      className="w-60 bg-paper-ivory border-r border-stone-soft flex flex-col flex-shrink-0"
      aria-label="Main navigation"
    >
      <div className="p-6 border-b border-stone-soft">
        <Link
          href="/dashboard"
          className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ivy rounded"
        >
          <h2 className="font-serif text-xl text-forest-deep">Garden Gnome</h2>
          <p className="text-xs text-ink-muted mt-0.5 truncate">
            {displayName || 'Welcome'}
          </p>
        </Link>
      </div>

      <nav className="flex-1 p-3" aria-label="Sections">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ivy ${
                active
                  ? 'bg-forest text-cream'
                  : 'text-ink-soft hover:bg-paper-warm hover:text-ink'
              }`}
            >
              <Icon size={18} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-stone-soft">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-ink-soft hover:bg-paper-warm hover:text-ink w-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ivy"
        >
          <LogOut size={18} aria-hidden="true" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
