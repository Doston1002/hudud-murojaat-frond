'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Nav } from '@/components/Nav';
import { api, getToken } from '@/lib/api';

type Curator = {
  _id: string;
  telegramId: number;
  fio: string;
  regions: string[];
  isActive: boolean;
};

type Region = { id: string; name: string };

export default function CuratorsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Curator[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [telegramId, setTelegramId] = useState('');
  const [fio, setFio] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRegions, setEditRegions] = useState<string[]>([]);

  async function load() {
    const data = await api<Curator[]>('/curators');
    setItems(data);
  }

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    void api<Region[]>('/catalog/regions').then(setRegions);
    void load();
  }, [router]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api('/curators', {
        method: 'POST',
        body: JSON.stringify({
          telegramId: Number(telegramId),
          fio,
          regions: selected,
        }),
      });
      setTelegramId('');
      setFio('');
      setSelected([]);
      await load();
    } catch {
      setError('Qo‘shib bo‘lmadi. ID takrorlanmasin, kamida 1 hudud tanlang.');
    }
  }

  async function toggleActive(c: Curator) {
    await api(`/curators/${c._id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: !c.isActive }),
    });
    await load();
  }

  async function remove(c: Curator) {
    await api(`/curators/${c._id}`, { method: 'DELETE' });
    await load();
  }

  async function saveRegions(c: Curator) {
    await api(`/curators/${c._id}`, {
      method: 'PATCH',
      body: JSON.stringify({ regions: editRegions }),
    });
    setEditingId(null);
    await load();
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <Nav />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold">Kuratorlar</h1>
        <p className="text-sm text-zinc-600">
          Qo‘shish/o‘chirish botni to‘xtatmaydi — yangi xabar darhol yangi
          biriktirish bo‘yicha ketadi.
        </p>
        <form
          onSubmit={onCreate}
          className="mt-6 grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-2"
        >
          <input
            className="rounded-lg border px-3 py-2"
            placeholder="Telegram ID"
            value={telegramId}
            onChange={(e) => setTelegramId(e.target.value)}
            required
          />
          <input
            className="rounded-lg border px-3 py-2"
            placeholder="F.I.O."
            value={fio}
            onChange={(e) => setFio(e.target.value)}
            required
          />
          <div className="md:col-span-2 grid gap-2 sm:grid-cols-2">
            {regions.map((r) => (
              <label key={r.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected.includes(r.name)}
                  onChange={() =>
                    setSelected((prev) =>
                      prev.includes(r.name)
                        ? prev.filter((x) => x !== r.name)
                        : [...prev, r.name],
                    )
                  }
                />
                {r.name}
              </label>
            ))}
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            className="rounded-lg bg-emerald-800 px-4 py-2 text-white md:col-span-2"
          >
            Yangi xodim qo‘shish
          </button>
        </form>
        <div className="mt-8 overflow-x-auto rounded-xl border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-100">
              <tr>
                <th className="px-3 py-2">F.I.O.</th>
                <th className="px-3 py-2">Telegram ID</th>
                <th className="px-3 py-2">Hududlar</th>
                <th className="px-3 py-2">Holat</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c._id} className="border-t">
                  <td className="px-3 py-2">{c.fio}</td>
                  <td className="px-3 py-2">{c.telegramId}</td>
                  <td className="px-3 py-2">
                    {editingId === c._id ? (
                      <div className="grid max-w-md gap-1">
                        {regions.map((r) => (
                          <label
                            key={r.id}
                            className="flex items-center gap-2 text-xs"
                          >
                            <input
                              type="checkbox"
                              checked={editRegions.includes(r.name)}
                              onChange={() =>
                                setEditRegions((prev) =>
                                  prev.includes(r.name)
                                    ? prev.filter((x) => x !== r.name)
                                    : [...prev, r.name],
                                )
                              }
                            />
                            {r.name}
                          </label>
                        ))}
                        <button
                          type="button"
                          className="mt-1 text-left text-emerald-800"
                          onClick={() => void saveRegions(c)}
                        >
                          Saqlash
                        </button>
                      </div>
                    ) : (
                      c.regions.join(', ')
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {c.isActive ? 'Faol' : 'Nofaol'}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      className="mr-2 text-emerald-800"
                      onClick={() => {
                        setEditingId(c._id);
                        setEditRegions(c.regions);
                      }}
                    >
                      Hudud
                    </button>
                    <button
                      type="button"
                      className="mr-2 text-emerald-800"
                      onClick={() => void toggleActive(c)}
                    >
                      Holat
                    </button>
                    <button
                      type="button"
                      className="text-red-700"
                      onClick={() => void remove(c)}
                    >
                      O‘chirish
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
