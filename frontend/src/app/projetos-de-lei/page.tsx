'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchUltimasProposicoes, Proposicao } from '@/lib/camaraApi';
import { FileSignature, Search, Calendar, FileText, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

export default function ProjetosDeLeiPage() {
  const [proposicoes, setProposicoes] = useState<Proposicao[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [keywords, setKeywords] = useState('');
  const [ano, setAno] = useState<string>('');
  const [siglaTipo, setSiglaTipo] = useState<string>('');
  
  // Paginação
  const [pagina, setPagina] = useState(1);
  const itensPorPagina = 20;

  useEffect(() => {
    // Usando setTimeout como um debounce simples para a busca
    const delayDebounceFn = setTimeout(() => {
      setLoading(true);
      fetchUltimasProposicoes({
        pagina,
        itens: itensPorPagina,
        ano: ano ? parseInt(ano) : undefined,
        siglaTipo: siglaTipo || undefined,
        keywords: keywords || undefined
      }).then(data => {
        setProposicoes(data);
        setLoading(false);
      });
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [pagina, ano, siglaTipo, keywords]);

  // Handler para resetar página quando alterar filtro
  const handleFilterChange = () => setPagina(1);

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar bg-background">
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
            <FileSignature className="w-8 h-8 text-primary" />
            Projetos de Lei
          </h1>
          <p className="text-muted-foreground mt-2">Acompanhe e filtre as proposições legislativas na Câmara dos Deputados.</p>
        </div>
        
        {/* Filtros */}
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar palavras-chave (ex: Inteligência Artificial)..." 
              value={keywords}
              onChange={(e) => { setKeywords(e.target.value); handleFilterChange(); }}
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          
          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative w-1/2 md:w-32">
              <select 
                value={ano} 
                onChange={(e) => { setAno(e.target.value); handleFilterChange(); }}
                className="w-full appearance-none bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground cursor-pointer"
              >
                <option value="">Ano (Todos)</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
                <option value="2021">2021</option>
              </select>
              <Filter className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>

            <div className="relative w-1/2 md:w-40">
              <select 
                value={siglaTipo} 
                onChange={(e) => { setSiglaTipo(e.target.value); handleFilterChange(); }}
                className="w-full appearance-none bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground cursor-pointer"
              >
                <option value="">Tipo (Todos)</option>
                <option value="PL">PL (Projeto de Lei)</option>
                <option value="PEC">PEC (Emenda à Const.)</option>
                <option value="MPV">MPV (Medida Prov.)</option>
                <option value="PLP">PLP (Lei Comp.)</option>
              </select>
              <Filter className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        {/* List */}
        <div className="grid grid-cols-1 gap-4 min-h-[500px]">
          {loading ? (
            // Skeleton Loader Premium
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden">
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-muted/30 to-transparent animate-[shimmer_1.5s_infinite]"></div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-muted animate-pulse flex-shrink-0"></div>
                    <div className="space-y-2">
                      <div className="w-32 md:w-48 h-6 bg-muted rounded-md animate-pulse"></div>
                      <div className="w-20 h-4 bg-muted rounded-md animate-pulse"></div>
                    </div>
                  </div>
                  <div className="w-16 h-8 bg-muted rounded-lg animate-pulse flex-shrink-0"></div>
                </div>
                
                <div className="space-y-3 mt-2">
                  <div className="w-full h-4 bg-muted rounded-md animate-pulse"></div>
                  <div className="w-5/6 h-4 bg-muted rounded-md animate-pulse"></div>
                  <div className="w-4/6 h-4 bg-muted rounded-md animate-pulse"></div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-border/50 flex justify-end">
                  <div className="w-40 h-4 bg-muted rounded animate-pulse"></div>
                </div>
              </div>
            ))
          ) : proposicoes.length > 0 ? (
            proposicoes.map((prop) => (
              <div key={prop.id} className="bg-card hover:bg-accent/50 border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/0 group-hover:bg-emerald-500 transition-colors"></div>
                
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold shadow-inner flex-shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                        {prop.siglaTipo} {prop.numero}/{prop.ano}
                      </h3>
                      <span className="text-[10px] font-bold bg-secondary text-secondary-foreground px-2 py-1 rounded uppercase tracking-wider">Câmara dos Deputados</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground font-medium bg-background px-3 py-1.5 rounded-lg border border-border/50 shadow-sm flex-shrink-0">
                    <Calendar className="w-4 h-4" />
                    {prop.ano}
                  </div>
                </div>
                
                <p className="text-foreground/80 leading-relaxed text-sm md:text-base">
                  {prop.ementa}
                </p>
                
                <div className="mt-4 pt-4 border-t border-border/50 flex justify-end">
                  <Link 
                    href={`/projetos-de-lei/${prop.id}`} 
                    className="text-sm font-bold text-primary hover:text-emerald-500 transition-colors flex items-center gap-1"
                  >
                    Ver Detalhes e Tramitação &rarr;
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border flex flex-col items-center justify-center">
              <Search className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-lg">Nenhuma proposição encontrada.</p>
              <p className="text-sm text-muted-foreground mt-1">Tente ajustar seus filtros ou termos de busca.</p>
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {!loading && proposicoes.length > 0 && (
          <div className="flex items-center justify-between pt-6 border-t border-border/50">
            <button 
              onClick={() => setPagina(p => Math.max(1, p - 1))}
              disabled={pagina === 1}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-foreground hover:bg-accent disabled:opacity-50 disabled:pointer-events-none transition-colors font-medium text-sm shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>
            
            <span className="text-sm font-bold text-foreground">
              Página {pagina}
            </span>
            
            <button 
              onClick={() => setPagina(p => p + 1)}
              // Desabilita Próxima se retornou menos itens que o limite (fim da lista)
              disabled={proposicoes.length < itensPorPagina}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-foreground hover:bg-accent disabled:opacity-50 disabled:pointer-events-none transition-colors font-medium text-sm shadow-sm"
            >
              Próxima <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
