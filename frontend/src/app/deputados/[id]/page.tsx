'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Brain, Receipt, Mic, Briefcase, Mail, Phone, MapPin, RefreshCw, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
export default function DeputadoPerfilPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [data, setData] = useState<any>(null);
  const [dossie, setDossie] = useState<string>('');
  const [despesas, setDespesas] = useState<any[]>([]);
  const [discursos, setDiscursos] = useState<any[]>([]);
  const [loadingBase, setLoadingBase] = useState(true);
  const [loadingDossie, setLoadingDossie] = useState(true);

  useEffect(() => {
    // 1. Busca dados rápidos (perfil)
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/deputados/${id}`)
      .then(res => res.json())
      .then(resData => {
        setData(resData.dados || null);
        setLoadingBase(false);
      })
      .catch(e => {
        console.error(e);
        setLoadingBase(false);
      });

    // 2. Busca o Dossiê (Demora mais por causa da IA)
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/deputados/${id}/dossie`)
      .then(res => res.json())
      .then(resData => {
        setDossie(resData.dossie || 'Erro ao gerar dossiê.');
        setDespesas(resData.despesas || []);
        setDiscursos(resData.discursos || []);
        setLoadingDossie(false);
      })
      .catch(e => {
        console.error(e);
        setDossie('Falha ao conectar com o sistema de Inteligência.');
        setLoadingDossie(false);
      });
  }, [id]);

  const renderFormattedText = (text: string) => {
    const parts = text.split('\n');
    return parts.map((line, i) => {
      if (!line.trim()) return <div key={i} className="h-2"></div>;
      
      const lineWithBold = line.split(/(\*\*.*?\*\*)/g).map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j} className="font-bold text-foreground">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      return <p key={i} className="mb-2 leading-relaxed">{lineWithBold}</p>;
    });
  };

  if (loadingBase) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 p-10 flex flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold mb-4">Deputado não encontrado</h2>
        <button onClick={() => router.back()} className="text-primary hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
      </div>
    );
  }

  const status = data.ultimoStatus || {};
  const gabinete = status.gabinete || {};

  // Agrupa as despesas reais pelo tipo
  const groupedDespesas = despesas.reduce((acc, curr) => {
    const tipo = curr.tipoDespesa;
    const valor = curr.valorDocumento || 0;
    if (!acc[tipo]) acc[tipo] = 0;
    acc[tipo] += valor;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.keys(groupedDespesas)
    .map(key => ({ name: key, value: groupedDespesas[key] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8); // Pega apenas o top 8 para o gráfico não ficar poluído

  return (
    <div className="flex-1 p-6 md:p-10 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar para Raio-X
        </button>
        
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="relative w-48 h-48 rounded-2xl overflow-hidden border-4 border-primary/20 flex-shrink-0 shadow-lg">
            <img src={status.urlFoto} alt={data.nomeCivil} className="w-full h-full object-cover" />
          </div>
          
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-4xl font-black text-foreground">{status.nome}</h1>
              <p className="text-xl text-muted-foreground mt-1">{data.nomeCivil}</p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full font-bold text-sm">
                {status.siglaPartido}
              </span>
              <span className="px-3 py-1 bg-secondary text-secondary-foreground border border-border rounded-full font-bold text-sm">
                {status.siglaUf}
              </span>
              <span className={`px-3 py-1 border rounded-full font-bold text-sm ${status.situacao === 'Exercício' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>
                {status.situacao}
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 p-4 bg-card border border-border rounded-xl">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Briefcase className="w-4 h-4 text-primary" /> Profissão: <span className="text-foreground">{data.escolaridade}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 text-primary" /> <span className="text-foreground">{status.email || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Phone className="w-4 h-4 text-primary" /> <span className="text-foreground">{gabinete.telefone || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" /> <span className="text-foreground">Gabinete {gabinete.nome}, Anexo {gabinete.anexo}</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Dossier Section */}
        <section className="mt-12">
          <div className="flex items-center gap-3 mb-6">
            <Brain className="w-8 h-8 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Dossiê de Inteligência</h2>
          </div>
          
          <div className="bg-card/40 backdrop-blur-sm border border-border p-6 md:p-8 rounded-3xl shadow-xl relative overflow-hidden">
             {loadingDossie ? (
               <div className="flex flex-col items-center justify-center py-10 gap-4">
                 <RefreshCw className="w-10 h-10 animate-spin text-primary" />
                 <p className="text-muted-foreground font-medium animate-pulse">O Olho de Águia está analisando discursos e despesas recentes...</p>
               </div>
             ) : (
               <div className="text-sm md:text-base">
                 {renderFormattedText(dossie)}
               </div>
             )}
          </div>
        </section>

        {/* Seção Bruta de Despesas */}
        {!loadingDossie && despesas.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center gap-3 mb-6">
              <Receipt className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Distribuição de Despesas</h2>
            </div>
            
            {/* Gráfico de Despesas (Recharts) */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm mb-8">
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))}
                      contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                    />
                    <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px', color: 'var(--muted-foreground)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <h3 className="text-xl font-bold text-foreground">Extrato Bruto (Últimas 50)</h3>
            </div>
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto overflow-y-auto max-h-[500px]">
                <table className="w-full text-sm text-left relative">
                  <thead className="text-xs uppercase bg-muted text-muted-foreground sticky top-0 shadow-sm z-10">
                    <tr>
                      <th className="px-6 py-4">Data</th>
                      <th className="px-6 py-4">Despesa</th>
                      <th className="px-6 py-4">Fornecedor</th>
                      <th className="px-6 py-4 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {despesas.slice(0, 50).map((d, idx) => {
                      const dataFormatada = d.dataDocumento 
                        ? d.dataDocumento.substring(0,10).split('-').reverse().join('/') 
                        : '-';
                        
                      return (
                        <tr key={idx} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="px-6 py-4 font-medium whitespace-nowrap">{dataFormatada}</td>
                          <td className="px-6 py-4">{d.tipoDespesa}</td>
                          <td className="px-6 py-4">{d.nomeFornecedor}</td>
                          <td className="px-6 py-4 text-right font-bold text-destructive whitespace-nowrap">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.valorDocumento || 0)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Seção Bruta de Discursos */}
        {!loadingDossie && discursos.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center gap-3 mb-6">
              <Mic className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Últimos Discursos (Dados Brutos)</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {discursos.slice(0, 20).map((disc, idx) => {
                const dataFormatada = disc.dataHoraInicio
                  ? disc.dataHoraInicio.substring(0,10).split('-').reverse().join('/') 
                  : '-';
                  
                return (
                  <div key={idx} className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs font-bold px-3 py-1 bg-secondary text-secondary-foreground rounded-full">
                        {dataFormatada}
                      </span>
                      <span className="text-xs text-muted-foreground">{disc.tipoDiscurso}</span>
                    </div>
                    <p className="text-sm text-foreground italic">"{disc.sumario}"</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
