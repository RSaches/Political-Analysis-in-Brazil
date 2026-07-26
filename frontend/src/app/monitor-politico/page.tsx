'use client';

import React, { useState, useEffect } from 'react';
import { Compass, TrendingUp, AlertTriangle, Globe, Activity, Users, Loader2, Map as MapIcon, Clock } from 'lucide-react';
import Image from 'next/image';
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

const geoUrl = "https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson";

interface HeatmapData {
  id: string; // UF, e.g. "SP"
  value: number;
  sentiment: string;
  mentions: number;
}

interface Alert {
  title: string;
  summary?: string;
  url: string;
  source: string;
  time: string;
  type: string;
}

interface Trending {
  rank: number;
  topic: string;
  mentions: string;
  sentiment: string;
}

interface MonitorData {
  alerts: Alert[];
  trending: Trending[];
  sentiment: {
    rejection: number;
    approval: number;
    neutral: number;
  };
  heatmap: HeatmapData[];
}

export default function MonitorPolitico() {
  const glassCard = "bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm";
  const [data, setData] = useState<MonitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<{uf: string, name: string, mentions: number, sentiment: string} | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/monitor`);
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Erro ao buscar dados reais do monitor:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Atualiza a cada 30 segundos para manter super em tempo real
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar relative z-10">
      
      {/* Watermark Logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        <div 
          className="relative w-[500px] h-[500px] opacity-[0.10] dark:opacity-[0.15] mix-blend-luminosity"
          style={{
            WebkitMaskImage: 'radial-gradient(circle, black 55%, transparent 75%)',
            maskImage: 'radial-gradient(circle, black 55%, transparent 75%)'
          }}
        >
          <Image src="/logo.jpg" alt="Watermark" fill sizes="(max-width: 500px) 100vw, 500px" className="object-cover" />
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border/50 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold shadow-inner flex-shrink-0">
              <Compass className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-foreground tracking-tight">Monitor Político</h1>
              <p className="text-muted-foreground mt-1 flex items-center gap-2">
                Radar tático de temperatura social e trending topics. 
                {loading && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main Feed */}
          <div className="md:col-span-2 space-y-6">
            <div className={glassCard}>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <Activity className="w-6 h-6 text-primary" /> Alertas em Tempo Real
              </h2>
              
              <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                {loading && !data ? (
                  <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" /></div>
                ) : (data?.alerts || []).map((alert, i) => (
                  <a key={i} href={alert.url} target="_blank" rel="noopener noreferrer" className="group relative flex gap-4 p-5 rounded-2xl bg-background border border-border/60 hover:border-border hover:shadow-md transition-all cursor-pointer overflow-hidden">
                    <div className={`absolute top-0 left-0 w-1 h-full transition-colors ${alert.type === 'URGENTE' ? 'bg-amber-500' : 'bg-blue-500/0 group-hover:bg-blue-500'}`}></div>
                    
                    <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${alert.type === 'URGENTE' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                      {alert.type === 'URGENTE' ? <AlertTriangle className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${alert.type === 'URGENTE' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'}`}>{alert.type}</span>
                        <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3"/> {alert.time}</span>
                        <span className="text-[10px] font-bold bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{alert.source}</span>
                      </div>
                      <h3 className="font-semibold text-foreground/90 leading-snug group-hover:text-primary transition-colors">
                        {alert.title}
                      </h3>
                      {alert.summary && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                          {alert.summary}
                        </p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </div>

            <div className={`${glassCard} min-h-[450px] flex flex-col`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <MapIcon className="w-6 h-6 text-primary" /> Mapa de Calor Nacional
                </h2>
                
                {/* Legenda */}
                <div className="flex flex-wrap items-center gap-4 text-xs font-medium bg-background px-4 py-2.5 rounded-xl border border-border shadow-sm">
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" /> Crise</div>
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" /> Positivo</div>
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" /> Neutro</div>
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" /> Sem Dados</div>
                </div>
              </div>

              <div className="flex-1 relative w-full h-full min-h-[350px] flex items-center justify-center">
                {/* HUD Tooltip overlay */}
                {tooltip && (
                  <div className="absolute bottom-4 left-4 z-20 bg-background/90 backdrop-blur-md border border-primary/30 p-4 rounded-2xl shadow-xl w-48 pointer-events-none transform transition-all duration-200">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{tooltip.uf}</p>
                    <p className="text-lg font-black text-foreground leading-tight mb-2">{tooltip.name}</p>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Menções:</span>
                        <span className="text-xs font-bold">{tooltip.mentions || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Status:</span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          tooltip.sentiment === 'positive' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                          tooltip.sentiment === 'negative' ? 'bg-red-500/20 text-red-600 dark:text-red-400' :
                          'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                        }`}>
                          {tooltip.sentiment === 'positive' ? 'Avanço' : tooltip.sentiment === 'negative' ? 'Atenção' : 'Neutro'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {loading && !data ? (
                  <Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" />
                ) : (
                  <ComposableMap
                    projection="geoMercator"
                    projectionConfig={{
                      scale: 600,
                      center: [-54, -15] // Center over Brazil
                    }}
                    style={{ width: "100%", height: "100%" }}
                  >
                    <Geographies geography={geoUrl}>
                      {({ geographies }) =>
                        geographies.map((geo) => {
                          const stateSigla = geo.properties.sigla;
                          const stateName = geo.properties.name;
                          // Find this state in our backend data
                          const stateData = data?.heatmap?.find((s) => s.id === stateSigla);
                          
                          // Base color for states with no data
                          let fill = "rgba(148, 163, 184, 0.15)"; 
                          
                          if (stateData) {
                            if (stateData.mentions === 0) {
                                fill = "rgba(148, 163, 184, 0.25)";
                            }
                            else if (stateData.sentiment === 'positive') fill = `rgba(16, 185, 129, ${0.4 + (stateData.value / 100)})`; // Emerald
                            else if (stateData.sentiment === 'negative') fill = `rgba(239, 68, 68, ${0.4 + (stateData.value / 100)})`; // Red
                            else fill = `rgba(245, 158, 11, ${0.4 + (stateData.value / 100)})`; // Amber
                          }
                          
                          return (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              fill={fill}
                              stroke="rgba(255,255,255,0.1)"
                              strokeWidth={0.5}
                              onMouseEnter={() => {
                                setTooltip({
                                  uf: stateSigla,
                                  name: stateName,
                                  mentions: stateData?.mentions || 0,
                                  sentiment: stateData?.sentiment || 'neutral'
                                });
                              }}
                              onMouseLeave={() => {
                                setTooltip(null);
                              }}
                              style={{
                                default: { outline: "none", transition: "all 250ms" },
                                hover: { fill: "rgba(var(--primary), 0.7)", outline: "none", cursor: "pointer", transition: "all 250ms" },
                                pressed: { outline: "none" },
                              }}
                            />
                          );
                        })
                      }
                    </Geographies>
                  </ComposableMap>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className={glassCard}>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-primary" /> Trending Topics
              </h2>
              
              <div className="space-y-3">
                {loading && !data ? (
                  <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary opacity-50" /></div>
                ) : (data?.trending || []).map((topic) => (
                  <div key={topic.rank} className="flex items-center justify-between p-4 rounded-xl bg-background border border-border/50 hover:bg-accent/50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center text-sm font-black text-muted-foreground group-hover:text-primary transition-colors">
                        {topic.rank}
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-sm">{topic.topic}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider font-semibold">{topic.mentions} menções/h</p>
                      </div>
                    </div>
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      topic.sentiment === 'positive' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' :
                      topic.sentiment === 'negative' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' :
                      'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                    }`} />
                  </div>
                ))}
              </div>
            </div>

            <div className={`${glassCard} bg-gradient-to-br from-card to-card/50`}>
              <h2 className="text-xl font-bold mb-2 flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" /> Análise de Sentimento
              </h2>
              <p className="text-xs text-muted-foreground mb-8 font-medium">Humor eleitoral lido nas últimas horas (Real-Time).</p>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-bold text-red-500 dark:text-red-400">Rejeição</span>
                    <span className="text-lg font-black text-foreground">{data?.sentiment?.rejection || 0}%</span>
                  </div>
                  <div className="w-full bg-background rounded-full h-3 border border-border/50 overflow-hidden">
                    <div className="bg-red-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${data?.sentiment?.rejection || 0}%` }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-bold text-emerald-500 dark:text-emerald-400">Aprovação</span>
                    <span className="text-lg font-black text-foreground">{data?.sentiment?.approval || 0}%</span>
                  </div>
                  <div className="w-full bg-background rounded-full h-3 border border-border/50 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${data?.sentiment?.approval || 0}%` }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-bold text-amber-500 dark:text-amber-400">Neutro</span>
                    <span className="text-lg font-black text-foreground">{data?.sentiment?.neutral || 0}%</span>
                  </div>
                  <div className="w-full bg-background rounded-full h-3 border border-border/50 overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${data?.sentiment?.neutral || 0}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
