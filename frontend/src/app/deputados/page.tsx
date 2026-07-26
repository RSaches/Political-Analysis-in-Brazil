'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Users, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { fetchDeputados, DeputadoBasico } from '@/lib/camaraApi';

export default function DeputadosPage() {
  const [deputados, setDeputados] = useState<DeputadoBasico[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [nome, setNome] = useState('');
  
  // Paginação
  const [pagina, setPagina] = useState(1);
  const itensPorPagina = 20;

  useEffect(() => {
    // Usando setTimeout como debounce para a busca
    const delayDebounceFn = setTimeout(() => {
      setLoading(true);
      fetchDeputados({
        pagina,
        itens: itensPorPagina,
        nome: nome || undefined
      }).then(data => {
        setDeputados(data);
        setLoading(false);
      });
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [pagina, nome]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNome(e.target.value);
    setPagina(1); // Reseta para página 1 ao buscar
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar bg-background">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" /> Raio-X Parlamentar
            </h1>
            <p className="text-muted-foreground mt-2">Busque e analise o perfil, gastos e histórico dos 513 deputados federais.</p>
          </div>
          
          <div className="relative w-full md:w-96">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar por nome (ex: Adriana Ventura)..." 
              value={nome}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground shadow-sm transition-all"
            />
          </div>
        </div>

        {/* List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 min-h-[400px]">
          {loading ? (
            // Skeleton Loader
            Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col items-center text-center gap-4 animate-pulse">
                <div className="w-24 h-24 rounded-full bg-muted border-2 border-primary/10"></div>
                <div className="w-full space-y-2 flex flex-col items-center">
                  <div className="w-24 h-5 bg-muted rounded"></div>
                  <div className="w-16 h-4 bg-muted rounded"></div>
                </div>
              </div>
            ))
          ) : deputados.length > 0 ? (
            deputados.map((dep) => (
              <Link href={`/deputados/${dep.id}`} key={dep.id}>
                <div className="bg-card hover:bg-accent border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group flex flex-col items-center text-center gap-4 h-full relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-primary/0 group-hover:bg-primary transition-colors"></div>
                  
                  <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-primary/20 group-hover:border-primary transition-colors bg-muted flex items-center justify-center">
                    {dep.urlFoto ? (
                      <img src={dep.urlFoto} alt={dep.nome} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors leading-tight">{dep.nome}</h3>
                    <p className="text-sm font-medium text-muted-foreground mt-2 bg-background px-3 py-1 rounded-full border border-border/50 inline-block shadow-sm">
                      {dep.siglaPartido} - {dep.siglaUf}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-dashed border-border">
              <Users className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-lg font-medium">Nenhum deputado encontrado.</p>
              <p className="text-sm text-muted-foreground mt-1">Verifique o nome digitado e tente novamente.</p>
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {!loading && deputados.length > 0 && (
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
                Página {pagina}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mt-1">
                {(pagina - 1) * itensPorPagina + 1} - {(pagina - 1) * itensPorPagina + deputados.length} Parlamentares
              </span>
            </div>
            
            <button 
              onClick={() => setPagina(p => p + 1)}
              // Desabilita Próxima se retornou menos itens que o limite (fim da lista)
              disabled={deputados.length < itensPorPagina}
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
