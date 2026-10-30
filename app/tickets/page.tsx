'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Nav } from '@/components/Nav';
import { api, exportUrl, getToken } from '@/lib/api';

type Ticket = {
  ticketId: string;
  region: string;
  district: string;
  institutionName: string;
  categoryLabel: string;
  status: string;
  isAnonymous: boolean;
  contentText: string;
  createdAt?: string;
  phoneNumber?: string | null;
  reporterName?: string | null;
};

type Region = { id: string; name: string };

export default function TicketsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Ticket[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [status, setStatus] = useState('');
  const [region, setRegion] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  async function load() {
    const q = new URLSearchParams();
    if (status) q.set('status', status);
    if (region) q.set('region', region);
    if (from) q.set('from', from);
    if (to) q.set('to', to);
    const data = await api<Ticket[]>(`/tickets?${q.toString()}`);
    setItems(data);
  }

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    void api<Region[]>('/catalog/regions').then(setRegions);
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function downloadExcel() {
    const token = getToken();
    const url = exportUrl({
      ...(status ? { status } : {}),
      ...(region ? { region } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
    });
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'murojaatlar.xlsx';
    a.click();
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <Nav />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">xabar</h1>
            <p className="text-sm text-zinc-600">
              Anonim xabarlarida ism va username ko‘rinmaydi
            </p>
          </div>
          <button
            type="button"
            onClick={() => void downloadExcel()}
            className="rounded-lg bg-emerald-800 px-4 py-2 text-sm text-white"
          >
            Excel yuklab olish
          </button>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <select
            className="rounded-lg border bg-white px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Barcha status</option>
            <option value="NEW">Yangi</option>
            <option value="IN_PROGRESS">Jarayonda</option>
            <option value="RESOLVED">Hal etildi</option>
          </select>
          <select
            className="rounded-lg border bg-white px-3 py-2 text-sm"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          >
            <option value="">Barcha hudud</option>
            {regions.map((r) => (
              <option key={r.id} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="rounded-lg border bg-white px-3 py-2 text-sm"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <input
            type="date"
            className="rounded-lg border bg-white px-3 py-2 text-sm"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg border bg-white px-3 py-2 text-sm"
          >
            Filtrlash
          </button>
        </div>
        <div className="mt-6 overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-100">
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Hudud</th>
                <th className="px-3 py-2">Toifa</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Murojaatchi</th>
                <th className="px-3 py-2">Matn</th>
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <tr key={t.ticketId} className="border-t align-top">
                  <td className="px-3 py-2 font-mono text-xs">{t.ticketId}</td>
                  <td className="px-3 py-2">
                    {t.region}
                    <div className="text-zinc-500">{t.district}</div>
                    <div className="text-zinc-500">
                      {t.institutionName || '—'}
                    </div>
                  </td>
                  <td className="px-3 py-2">{t.categoryLabel}</td>
                  <td className="px-3 py-2">{t.status}</td>
                  <td className="px-3 py-2">
                    {t.isAnonymous
                      ? 'Anonim'
                      : t.reporterName || t.phoneNumber || '—'}
                  </td>
                  <td className="max-w-xs px-3 py-2">{t.contentText}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
