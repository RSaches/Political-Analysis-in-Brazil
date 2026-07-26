import React from 'react';
import Link from 'next/link';
import { fetchProposicaoById, fetchTramitacoes } from '@/lib/camaraApi';
import { FileSignature, ArrowLeft, Calendar, FileText, User, ExternalLink, Clock, AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DetalhesProposicaoPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = parseInt(params.id, 10);
  
  if (isNaN(id)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 h-full">
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold">URL Inválida</h2>
        <p className="text-muted-foreground mt-2">O código do projeto informado não é válido.</p>
        <Link href="/projetos-de-lei" className="mt-6 bg-primary text-primary-foreground px-6 py-2 rounded-xl font-bold">
          Voltar para Projetos
        </Link>
      </div>
    );
  }

  const proposicao = await fetchProposicaoById(id);
  const tramitacoes = await fetchTramitacoes(id);

  if (!proposicao) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 h-full">
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold">Proposição não encontrada</h2>
        <p className="text-muted-foreground mt-2">Não foi possível carregar os dados deste projeto.</p>
        <Link href="/projetos-de-lei" className="mt-6 bg-primary text-primary-foreground px-6 py-2 rounded-xl font-bold">
          Voltar para Projetos
        </Link>
      </div>
    );
  }

  // Pegar autores (formatação basica)
  const autoresNames = proposicao.autores && proposicao.autores.length > 0 
    ? proposicao.autores.map(a => a.nome).join(', ') 
    : 'Autor desconhecido ou Múltiplos';

  // Format data
  const dataApresentacao = new Date(proposicao.dataApresentacao).toLocaleDateString('pt-BR');

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar bg-background">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Back Button & Header */}
        <div>
          <Link href="/projetos-de-lei" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Voltar para Projetos
          </Link>
          
          <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold shadow-inner flex-shrink-0">
                  <FileSignature className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-foreground">
                    {proposicao.siglaTipo} {proposicao.numero}/{proposicao.ano}
                  </h1>
                  <span className="inline-block mt-1 text-xs font-bold bg-secondary text-secondary-foreground px-2 py-1 rounded uppercase tracking-wider">
                    Câmara dos Deputados
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium bg-background px-4 py-2 rounded-xl border border-border shadow-sm flex-shrink-0">
                <Calendar className="w-4 h-4" />
                {dataApresentacao}
              </div>
            </div>

            <h2 className="text-xl md:text-2xl font-semibold leading-snug text-foreground/90">
              {proposicao.ementa}
            </h2>

            <div className="mt-8 pt-6 border-t border-border/50 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-foreground">Autoria</p>
                  <p className="text-sm text-muted-foreground">{autoresNames}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-foreground">Documento Original</p>
                  {proposicao.urlInteiroTeor ? (
                    <a href={proposicao.urlInteiroTeor} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                      Visualizar Inteiro Teor <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">Não disponível</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Tramitacoes */}
        <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <Clock className="w-6 h-6 text-primary" />
            <h3 className="text-2xl font-bold text-foreground">Histórico de Tramitação</h3>
          </div>

          <div className="relative border-l-2 border-border/60 ml-3 md:ml-4 space-y-8 pb-4">
            {tramitacoes.length > 0 ? (
              tramitacoes.map((tramitacao, idx) => {
                const date = new Date(tramitacao.dataHora).toLocaleDateString('pt-BR');
                const isLatest = idx === 0;

                return (
                  <div key={`${tramitacao.sequencia}-${idx}`} className="relative pl-8 md:pl-10">
                    {/* Timeline Dot */}
                    <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 ${isLatest ? 'bg-primary border-primary/20 scale-125' : 'bg-muted-foreground border-background'}`}></div>
                    
                    <div className={`flex flex-col gap-1 ${isLatest ? 'opacity-100' : 'opacity-70 hover:opacity-100 transition-opacity'}`}>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold ${isLatest ? 'text-primary' : 'text-foreground'}`}>{date}</span>
                        <span className="text-xs font-semibold bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
                          {tramitacao.siglaOrgao}
                        </span>
                      </div>
                      
                      <p className={`text-sm md:text-base leading-relaxed mt-1 ${isLatest ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        {tramitacao.despacho}
                      </p>
                      
                      {tramitacao.apreciacao && (
                        <p className="text-xs text-muted-foreground mt-2 italic bg-background inline-block px-3 py-1.5 rounded-lg border border-border/50">
                          {tramitacao.apreciacao}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="pl-8 text-muted-foreground">Nenhuma tramitação registrada.</p>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
