'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearToken } from '@/lib/api';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/tickets', label: 'Murojaatlar' },
  { href: '/curators', label: 'Kuratorlar' },
];

export function Nav() {
  const path = usePathname();
  const router = useRouter();
  return (
    <header className="border-b border-emerald-900/20 bg-emerald-950 text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-emerald-200">
            Ta’lim va ilm-fan vazirligi
          </p>
          <p className="font-semibold">Hududiy ta’lim nazorati</p>
        </div>
        <nav className="flex flex-wrap items-center gap-2 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-md px-3 py-1.5 ${
                path === l.href
                  ? 'bg-white text-emerald-950'
                  : 'text-emerald-100 hover:bg-emerald-900'
              }`}
            >
              {l.label}
            </Link>
          ))}
          <button
            type="button"
            className="rounded-md px-3 py-1.5 text-emerald-200 hover:bg-emerald-900"
            onClick={() => {
              clearToken();
              router.push('/login');
            }}
          >
            Chiqish
          </button>
        </nav>
      </div>
    </header>
  );
}
