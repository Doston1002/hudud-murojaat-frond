'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, setToken } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const data = await api<{ accessToken: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ login, password }),
      });
      setToken(data.accessToken);
      router.push('/dashboard');
    } catch {
      setError('Login yoki parol noto‘g‘ri. Backend ishlayotganini tekshiring.');
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-emerald-950 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-8 text-zinc-900 shadow-xl"
      >
        <p className="text-sm text-emerald-800">SuperAdmin paneli</p>
        <h1 className="mt-1 text-2xl font-semibold">Hududiy ta’lim nazorati</h1>
        <label className="mt-6 block text-sm font-medium">Login</label>
        <input
          className="mt-1 w-full rounded-lg border px-3 py-2"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
        />
        <label className="mt-4 block text-sm font-medium">Parol</label>
        <input
          type="password"
          className="mt-1 w-full rounded-lg border px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          className="mt-6 w-full rounded-lg bg-emerald-800 py-2.5 font-medium text-white hover:bg-emerald-900"
        >
          Kirish
        </button>
      </form>
    </main>
  );
}
