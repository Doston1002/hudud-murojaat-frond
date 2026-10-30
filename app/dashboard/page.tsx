'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Nav } from '@/components/Nav';
import { api, getToken } from '@/lib/api';

type StatusCounts = {
  total: number;
  new: number;
  inProgress: number;
  resolved: number;
};

type Overview = StatusCounts;
type RegionRow = StatusCounts & { _id: string };
type CategoryRow = StatusCounts & { _id: string };
type CuratorRow = StatusCounts & { telegramId: number; fio: string };

const numberFormat = new Intl.NumberFormat('uz-UZ');
const statuses = [
  { key: 'new', label: 'Yangi', color: '#3b82f6' },
  { key: 'inProgress', label: 'Jarayonda', color: '#f97316' },
  { key: 'resolved', label: 'Yopilgan', color: '#10b981' },
] as const;

function StatusDonut({ counts }: { counts: StatusCounts }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <svg
      viewBox="0 0 160 160"
      className="h-40 w-40 shrink-0"
      role="img"
      aria-label={`Jami ${counts.total}. Yangi: ${counts.new}, jarayonda: ${counts.inProgress}, yopilgan: ${counts.resolved}`}
    >
      <circle
        cx="80"
        cy="80"
        r={radius}
        fill="none"
        stroke="#e4e4e7"
        strokeWidth="22"
      />
      {statuses.map((status) => {
        const value = counts[status.key];
        const segment = counts.total > 0 ? (value / counts.total) * circumference : 0;
        const segmentOffset = offset;
        offset += segment;
        if (!segment) {
          return null;
        }
        return (
          <circle
            key={status.key}
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={status.color}
            strokeWidth="22"
            strokeDasharray={`${segment} ${circumference - segment}`}
            strokeDashoffset={-segmentOffset}
            transform="rotate(-90 80 80)"
          />
        );
      })}
      <text
        x="80"
        y="77"
        textAnchor="middle"
        className="fill-zinc-900 text-[19px] font-semibold"
      >
        {numberFormat.format(counts.total)}
      </text>
      <text
        x="80"
        y="97"
        textAnchor="middle"
        className="fill-zinc-500 text-[11px]"
      >
        jami
      </text>
    </svg>
  );
}

function BreakdownCard({
  title,
  counts,
}: {
  title: string;
  counts: StatusCounts;
}) {
  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold leading-5 text-zinc-800">
            {title}
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            {numberFormat.format(counts.total)} murojaat
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-5 sm:gap-8">
        <StatusDonut counts={counts} />
        <div className="min-w-52 flex-1 space-y-3">
          {statuses.map((status) => {
            const value = counts[status.key];
            const percentage =
              counts.total > 0
                ? ((value / counts.total) * 100).toFixed(1)
                : '0.0';
            return (
              <div
                key={status.key}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-4 text-sm"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: status.color }}
                  />
                  <span className="text-zinc-600">{status.label}</span>
                </span>
                <span className="text-right text-zinc-500">
                  {numberFormat.format(value)}
                </span>
                <span className="w-14 text-right font-medium text-zinc-800">
                  {percentage}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [regions, setRegions] = useState<RegionRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [curators, setCurators] = useState<CuratorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError('');
    setCategoryError('');
    const [overviewResult, regionsResult, categoriesResult, curatorsResult] =
      await Promise.allSettled([
        api<Overview>('/stats/overview'),
        api<RegionRow[]>('/stats/by-region'),
        api<CategoryRow[]>('/stats/by-category'),
        api<CuratorRow[]>('/stats/by-curator'),
      ]);

    const failures: string[] = [];
    if (overviewResult.status === 'fulfilled') {
      setOverview(overviewResult.value);
    } else {
      failures.push('Umumiy statistika yuklanmadi.');
    }
    if (regionsResult.status === 'fulfilled') {
      setRegions(regionsResult.value);
    } else {
      failures.push('Viloyatlar statistikasi yuklanmadi.');
    }
    if (curatorsResult.status === 'fulfilled') {
      setCurators(curatorsResult.value);
    } else {
      failures.push('Kuratorlar statistikasi yuklanmadi.');
    }
    if (categoriesResult.status === 'fulfilled') {
      setCategories(categoriesResult.value);
    } else {
      const message =
        categoriesResult.reason instanceof Error
          ? categoriesResult.reason.message
          : String(categoriesResult.reason);
      setCategoryError(
        message.includes('Cannot GET /stats/by-category')
          ? 'Backendda toifa statistikasi endpointi yo‘q. Yangilangan backendni ishga tushiring.'
          : `Toifalar statistikasi yuklanmadi: ${message}`,
      );
    }
    setError(failures.join(' '));
    if (!failures.length) {
      setLastUpdated(new Date().toLocaleString('uz-UZ'));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    void loadStats();
  }, [loadStats, router]);

  const summaryCards = overview
    ? [
        {
          label: 'Jami murojaatlar',
          value: overview.total,
          accent: 'border-l-zinc-500',
        },
        { label: 'Yangi', value: overview.new, accent: 'border-l-sky-500' },
        {
          label: 'Jarayonda',
          value: overview.inProgress,
          accent: 'border-l-amber-500',
        },
        {
          label: 'Yopilgan',
          value: overview.resolved,
          accent: 'border-l-emerald-500',
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <Nav />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Statistika</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Murojaatlar holati, toifalar, hududlar va mas’ullar kesimida
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-zinc-500">
                Yangilandi: {lastUpdated}
              </span>
            )}
            <button
              type="button"
              onClick={() => void loadStats()}
              disabled={loading}
              className="rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-100 disabled:cursor-wait disabled:opacity-60"
            >
              {loading ? 'Yuklanmoqda…' : 'Yangilash'}
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            Statistikani yuklab bo‘lmadi: {error}
          </div>
        )}

        <section aria-label="Umumiy statistika" className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {summaryCards.map((card) => (
              <article
                key={card.label}
                className={`rounded-xl border border-zinc-200 border-l-4 ${card.accent} bg-white p-4 shadow-sm`}
              >
                <p className="text-sm text-zinc-500">{card.label}</p>
                <p className="mt-2 text-3xl font-semibold">
                  {numberFormat.format(card.value)}
                </p>
              </article>
            ))}
          </div>
          {loading && !overview && (
            <p className="mt-3 text-sm text-zinc-500">
              Statistikalar yuklanmoqda…
            </p>
          )}
        </section>

        <section className="mt-9">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Umumiy holat statistikasi</h2>
            <p className="text-sm text-zinc-500">
              Barcha murojaatlarning holatlar bo‘yicha taqsimoti
            </p>
          </div>
          {overview ? (
            <BreakdownCard title="Barcha murojaatlar" counts={overview} />
          ) : (
            !loading && (
              <p className="rounded-xl border bg-white p-4 text-sm text-zinc-500">
                Umumiy statistika mavjud emas.
              </p>
            )
          )}
        </section>

        <section className="mt-9">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Toifalar bo‘yicha statistika</h2>
            <p className="text-sm text-zinc-500">
              Har bir murojaat toifasi va uning holatlari alohida
            </p>
          </div>
          {categoryError ? (
            <p
              role="alert"
              className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
            >
              {categoryError}
            </p>
          ) : categories.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {categories.map((category) => (
                <BreakdownCard
                  key={category._id}
                  title={category._id || 'Toifasiz'}
                  counts={category}
                />
              ))}
            </div>
          ) : (
            !loading && (
              <p className="rounded-xl border bg-white p-4 text-sm text-zinc-500">
                Hozircha toifalar bo‘yicha ma’lumot yo‘q.
              </p>
            )
          )}
        </section>

        <section className="mt-9">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Viloyatlar bo‘yicha statistika</h2>
            <p className="text-sm text-zinc-500">
              Har bir viloyat uchun jami va holatlar kesimi
            </p>
          </div>
          {regions.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {regions.map((region) => (
                <BreakdownCard
                  key={region._id}
                  title={region._id || 'Hudud ko‘rsatilmagan'}
                  counts={region}
                />
              ))}
            </div>
          ) : (
            !loading && (
              <p className="rounded-xl border bg-white p-4 text-sm text-zinc-500">
                Hozircha viloyatlar bo‘yicha ma’lumot yo‘q.
              </p>
            )
          )}
        </section>

        <section className="mt-9">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Kuratorlar bo‘yicha statistika</h2>
            <p className="text-sm text-zinc-500">
              Har bir kuratorga biriktirilgan murojaatlar va ularning holatlari
            </p>
          </div>
          {curators.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {curators.map((curator) => (
                <BreakdownCard
                  key={curator.telegramId}
                  title={curator.fio}
                  counts={curator}
                />
              ))}
            </div>
          ) : (
            !loading && (
              <p className="rounded-xl border bg-white p-4 text-sm text-zinc-500">
                Hozircha kuratorlarga biriktirilgan murojaat yo‘q.
              </p>
            )
          )}
        </section>
      </main>
    </div>
  );
}
