'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  Building2,
  CalendarClock,
  FileText,
  Landmark,
  RefreshCw,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type Estatisticas = {
  atualizadoEm: string;
  resumo: {
    partidosComBancada: number;
    cadeirasMapeadas: number;
    proposicoesRecentes: number;
    votacoesRecentes: number;
  };
  bancadas: { sigla: string; membros: number; situacao: string }[];
  proposicoesPorTipo: { tipo: string; quantidade: number }[];
  atividadePorOrgao: { orgao: string; quantidade: number }[];
  ultimasVotacoes: { id: string; descricao: string; siglaOrgao?: string; dataHoraRegistro?: string; aprovacao?: number }[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const CHART_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

function formatDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

export default function Estatisticas() {
  const [data, setData] = useState<Estatisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/estatisticas`);
      if (!response.ok) throw new Error('Não foi possível carregar os dados legislativos.');
      setData(await response.json());
    } catch {
      setError('Os dados oficiais estão temporariamente indisponíveis. Tente atualizar em alguns instantes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const response = await fetch(`${API_URL}/api/estatisticas`);
        if (!response.ok) throw new Error('Não foi possível carregar os dados legislativos.');
        setData(await response.json());
      } catch {
        setError('Os dados oficiais estão temporariamente indisponíveis. Tente atualizar em alguns instantes.');
      } finally {
        setLoading(false);
      }
    };

    void loadInitialData();
  }, []);

  const totalProposicoes = useMemo(
    () => data?.proposicoesPorTipo.reduce((total, item) => total + item.quantidade, 0) ?? 0,
    [data],
  );

  const cards = data
    ? [
        { label: 'Partidos com bancada', value: data.resumo.partidosComBancada, detail: 'representação ativa', icon: Building2, color: 'text-emerald-600 bg-emerald-500/10' },
        { label: 'Cadeiras mapeadas', value: data.resumo.cadeirasMapeadas, detail: 'membros nas bancadas', icon: Users, color: 'text-blue-600 bg-blue-500/10' },
        { label: 'Proposições analisadas', value: data.resumo.proposicoesRecentes, detail: 'últimos registros oficiais', icon: FileText, color: 'text-violet-600 bg-violet-500/10' },
        { label: 'Votações acompanhadas', value: data.resumo.votacoesRecentes, detail: 'atividade recente', icon: Activity, color: 'text-amber-600 bg-amber-500/10' },
      ]
    : [];

  return (
    <div className="flex-1 overflow-y-auto p-5 md:p-10 custom-scrollbar">
      <div className="mx-auto max-w-7xl space-y-6 md:space-y-8">
        <header className="flex flex-col gap-5 border-b border-border/60 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 shadow-sm">
              <BarChart3 className="size-7" />
            </div>
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">Dados oficiais da Câmara</p>
              <h1 className="text-3xl font-black tracking-tight text-foreground">Panorama Legislativo</h1>
              <p className="mt-1 text-sm text-muted-foreground">Bancadas, proposições e votações recentes em uma única leitura.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar dados
          </button>
        </header>

        {error ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-800 dark:text-amber-300">
            {error}
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {loading && !data
                ? Array.from({ length: 4 }, (_, index) => <div key={index} className="h-36 animate-pulse rounded-2xl border border-border bg-muted/50" />)
                : cards.map((card) => {
                    const Icon = card.icon;
                    return (
                      <article key={card.label} className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{card.label}</p>
                            <p className="mt-3 text-4xl font-black tracking-tight text-foreground">{card.value.toLocaleString('pt-BR')}</p>
                          </div>
                          <div className={`rounded-xl p-3 ${card.color}`}><Icon className="size-5" /></div>
                        </div>
                        <p className="mt-4 text-xs font-medium text-muted-foreground">{card.detail}</p>
                      </article>
                    );
                  })}
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-5">
              <article className="min-h-[430px] rounded-3xl border border-border/70 bg-card p-5 shadow-sm xl:col-span-3 md:p-6">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="flex items-center gap-2 text-lg font-bold text-foreground"><Landmark className="size-5 text-emerald-600" /> Maiores bancadas</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Número de membros por partido na Câmara.</p>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">Top 10</span>
                </div>
                <div className="h-[330px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.bancadas ?? []} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} stroke="var(--muted-foreground)" />
                      <YAxis dataKey="sigla" type="category" width={62} tickLine={false} axisLine={false} stroke="var(--foreground)" className="text-xs font-bold" />
                      <Tooltip cursor={{ fill: 'var(--muted)' }} formatter={(value) => [`${Number(value)} membros`, 'Bancada']} contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)' }} />
                      <Bar dataKey="membros" radius={[0, 8, 8, 0]} barSize={22} fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <article className="min-h-[430px] rounded-3xl border border-border/70 bg-card p-5 shadow-sm xl:col-span-2 md:p-6">
                <h2 className="flex items-center gap-2 text-lg font-bold text-foreground"><FileText className="size-5 text-violet-600" /> Proposições por tipo</h2>
                <p className="mt-1 text-sm text-muted-foreground">Distribuição dos {totalProposicoes} registros mais recentes.</p>
                <div className="h-[250px] w-full pt-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data?.proposicoesPorTipo ?? []} dataKey="quantidade" nameKey="tipo" innerRadius={62} outerRadius={92} paddingAngle={3}>
                        {(data?.proposicoesPorTipo ?? []).map((item, index) => <Cell key={item.tipo} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value) => [`${Number(value)} proposições`, 'Quantidade']} contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border pt-4 text-xs">
                  {(data?.proposicoesPorTipo ?? []).map((item, index) => (
                    <div key={item.tipo} className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-2 text-muted-foreground"><span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />{item.tipo}</span>
                      <span className="font-bold text-foreground">{item.quantidade}</span>
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-5">
              <article className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm xl:col-span-3 md:p-6">
                <h2 className="flex items-center gap-2 text-lg font-bold text-foreground"><CalendarClock className="size-5 text-blue-600" /> Atividade por órgão</h2>
                <p className="mt-1 text-sm text-muted-foreground">Onde se concentraram as votações monitoradas.</p>
                <div className="mt-5 h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.atividadePorOrgao ?? []} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="orgao" tickLine={false} axisLine={false} stroke="var(--muted-foreground)" />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} stroke="var(--muted-foreground)" />
                      <Tooltip cursor={{ fill: 'var(--muted)' }} formatter={(value) => [`${Number(value)} votações`, 'Atividade']} contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)' }} />
                      <Bar dataKey="quantidade" radius={[8, 8, 0, 0]} fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <article className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm xl:col-span-2 md:p-6">
                <h2 className="text-lg font-bold text-foreground">Últimas votações</h2>
                <p className="mt-1 text-sm text-muted-foreground">Registros oficiais mais recentes.</p>
                <div className="mt-4 space-y-3">
                  {(data?.ultimasVotacoes ?? []).map((votacao) => (
                    <div key={votacao.id} className="rounded-xl border border-border/70 bg-muted/30 p-3">
                      <div className="mb-1 flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                        <span>{votacao.siglaOrgao || 'Câmara'}</span>
                        {votacao.aprovacao !== undefined && <span className={votacao.aprovacao === 1 ? 'text-emerald-600' : 'text-rose-600'}>{votacao.aprovacao === 1 ? 'Aprovada' : 'Rejeitada'}</span>}
                      </div>
                      <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">{votacao.descricao || 'Votação sem descrição disponível.'}</p>
                      {votacao.dataHoraRegistro && <p className="mt-2 text-xs text-muted-foreground">{formatDate(votacao.dataHoraRegistro)}</p>}
                    </div>
                  ))}
                </div>
              </article>
            </section>

            {data?.atualizadoEm && <p className="pb-2 text-center text-xs text-muted-foreground">Atualizado em {formatDate(data.atualizadoEm)} · Fonte: Dados Abertos da Câmara dos Deputados.</p>}
          </>
        )}
      </div>
    </div>
  );
}
