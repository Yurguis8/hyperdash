'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  LineChart,
  TrendingUp,
  LogOut,
  Unlink,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useDashboard } from './DashboardProvider';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/graficos', label: 'Gráficos', icon: LineChart, exact: false },
  { href: '/dashboard/projecoes', label: 'Projeções', icon: TrendingUp, exact: false },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isConnected, dashboard, disconnectMeta } = useDashboard();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-neutral-900 flex">
      <aside className="dashboard-no-print hidden md:flex w-56 lg:w-60 flex-col border-r border-neutral-200 bg-white shrink-0 h-screen sticky top-0 justify-between">
        <div className="h-14 px-5 flex items-center border-b border-neutral-100">
          <Link href="/dashboard" className="font-semibold text-sm tracking-tight">
            Hyperpanel
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0 opacity-90" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-neutral-100 space-y-3">
          {isConnected ? (
            <div className="space-y-2">
              <p className="text-xs text-neutral-500 flex items-center gap-2 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">{dashboard?.accountName || 'Meta Ads conectado'}</span>
              </p>
              <button
                type="button"
                onClick={disconnectMeta}
                className="w-full inline-flex items-center justify-center gap-2 text-xs font-medium py-2 rounded-md border border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
              >
                <Unlink className="w-3.5 h-3.5" />
                Desconectar da Meta
              </button>
            </div>
          ) : (
            <a
              href="/api/auth/meta/login"
              className="block text-center text-xs font-medium py-2 rounded-md bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
            >
              Conectar Meta
            </a>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-xs text-neutral-500 hover:text-neutral-900 py-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="dashboard-no-print md:hidden h-14 border-b border-neutral-200 bg-white px-4 flex items-center justify-between">
          <span className="font-semibold text-sm">Hyperpanel</span>
          <div className="flex gap-2">
            {NAV.map(({ href, label, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`text-xs px-2 py-1 rounded-md ${active ? 'bg-neutral-900 text-white' : 'text-neutral-600'}`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </header>

        <div className="dashboard-no-print md:hidden px-4 py-2.5 border-b border-neutral-200 bg-white">
          {isConnected ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-neutral-500 flex items-center gap-2 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">{dashboard?.accountName || 'Meta Ads conectado'}</span>
              </p>
              <button
                type="button"
                onClick={disconnectMeta}
                className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                <Unlink className="w-3.5 h-3.5" />
                Desconectar da Meta
              </button>
            </div>
          ) : (
            <a
              href="/api/auth/meta/login"
              className="block w-full text-center text-xs font-medium py-2 rounded-md bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
            >
              Conectar Meta
            </a>
          )}
          </div>

        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
