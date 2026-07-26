'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Landmark, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { fetchSenadores, Senador } from '@/lib/senadoApi';

const UFS = ['','AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];

export default function SenadoPage() {
  const [senadores, setSenadores] = useState<Senador[]>([]);
  const [filteredSenadores, setFilteredSenadores] = useState<Senador[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [nome, setNome] = useState('');
  const [ufFiltro, setUfFiltro] = useState('');
  const [partidoFiltro, setPartidoFiltro] = useState('');
  
  // Paginação (client-side pois a API retorna todos de uma vez)
  const [pagina, setPagina] = useState(1);
  const itensPorPagina = 20;
  
  // Buscar todos os senadores uma vez
  useEffect(() => {
    fetchSenadores().then(data => {
      setSenadores(data);
      setLoading(false);
    });
  }, []);

  // Filtrar localmente
  useEffect(() => {
    let result = senadores;
    
    if (nome) {
      const lower = nome.toLowerCase();
      result = result.filter(s => s.nome.toLowerCase().includes(lower) || s.nomeCompleto.toLowerCase().includes(lower));
    }
    if (ufFiltro) {
      result = result.filter(s => s.uf === ufFiltro);
    }
    if (partidoFiltro) {
      result = result.filter(s => s.partido === partidoFiltro);
    }
    
    setFilteredSenadores(result);
    setPagina(1);
  }, [nome, ufFiltro, partidoFiltro, senadores]);

  // Partidos únicos para o filtro
  const partidos = [...new Set(senadores.map(s => s.partido))].sort();

  // Paginação client-side
  const totalPaginas = Math.ceil(filteredSenadores.length / itensPorPagina);
  const senadoresPaginados = filteredSenadores.slice((pagina - 1) * itensPorPagina, pagina * itensPorPagina);

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar bg-background">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
              <Landmark className="w-8 h-8 text-primary" /> Senado Federal
            </h1>
            <p className="text-muted-foreground mt-2">Explore os 81 senadores da República. Busque, filtre e clique para ver detalhes.</p>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Buscar senador por nome..." 
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground shadow-sm transition-all"
              />
            </div>
            <select 
              value={ufFiltro} 
              onChange={(e) => setUfFiltro(e.target.value)}
              className="px-4 py-3 bg-card border border-border rounded-xl text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Todas as UFs</option>
              {UFS.filter(u => u).map(uf => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
            <select 
              value={partidoFiltro} 
              onChange={(e) => setPartidoFiltro(e.target.value)}
              className="px-4 py-3 bg-card border border-border rounded-xl text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Todos os Partidos</option>
              {partidos.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 min-h-[400px]">
          {loading ? (
            Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col items-center text-center gap-4 relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-muted/30 to-transparent animate-[shimmer_1.5s_infinite]"></div>
                <div className="w-24 h-24 rounded-full bg-muted animate-pulse border-2 border-primary/10"></div>
                <div className="w-full space-y-2 flex flex-col items-center">
                  <div className="w-24 h-5 bg-muted rounded animate-pulse"></div>
                  <div className="w-16 h-4 bg-muted rounded animate-pulse"></div>
                </div>
              </div>
            ))
          ) : senadoresPaginados.length > 0 ? (
            senadoresPaginados.map((sen) => (
              <Link
                href={`/senado/${sen.codigo}`}
                key={sen.codigo}
                className="bg-card hover:bg-accent border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group flex flex-col items-center text-center gap-4 h-full relative overflow-hidden cursor-pointer"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-primary/0 group-hover:bg-primary transition-colors"></div>
                
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-primary/20 group-hover:border-primary transition-colors bg-muted flex items-center justify-center">
                  {sen.foto ? (
                    <img src={sen.foto} alt={sen.nome} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors leading-tight">{sen.nome}</h3>
                  <p className="text-sm font-medium text-muted-foreground mt-2 bg-background px-3 py-1 rounded-full border border-border/50 inline-block shadow-sm">
                    {sen.partido} - {sen.uf}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-dashed border-border">
              <Landmark className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-lg font-medium">Nenhum senador encontrado.</p>
              <p className="text-sm text-muted-foreground mt-1">Verifique os filtros e tente novamente.</p>
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {!loading && filteredSenadores.length > itensPorPagina && (
          <div className="flex items-center justify-between pt-6 border-t border-border/50 mt-8">
            <button 
              onClick={() => setPagina(p => Math.max(1, p - 1))}
              disabled={pagina === 1}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border text-foreground hover:bg-accent disabled:opacity-50 disabled:pointer-events-none transition-colors font-medium text-sm shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>
            
            <div className="flex flex-col items-center">
              <span className="text-sm font-bold text-foreground">
                Página {pagina} de {totalPaginas}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mt-1">
                {filteredSenadores.length} Senadores
              </span>
            </div>
            
            <button 
              onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
              disabled={pagina >= totalPaginas}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border text-foreground hover:bg-accent disabled:opacity-50 disabled:pointer-events-none transition-colors font-medium text-sm shadow-sm"
            >
              Próxima <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
