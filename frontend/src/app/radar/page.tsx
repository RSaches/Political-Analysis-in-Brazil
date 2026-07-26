'use client';

import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, FileSignature, X, Users, Loader2, Brain } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function RadarVotacoesPage() {
  const [votacoes, setVotacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedVotacao, setSelectedVotacao] = useState<string | null>(null);
  const [votacaoDetails, setVotacaoDetails] = useState<any>(null);
  const [dossierIA, setDossierIA] = useState<string | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingDossier, setLoadingDossier] = useState(false);

  const openDetails = (id: string) => {
    setSelectedVotacao(id);
    setLoadingDetails(true);
    setLoadingDossier(true);
    setDossierIA(null);

    // Fetch Detalhes da Câmara
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/votacoes/${id}/analise`)
      .then(res => res.json())
      .then(data => {
        setVotacaoDetails(data);
        setLoadingDetails(false);
      })
      .catch(e => {
        console.error(e);
        setLoadingDetails(false);
      });

    // Fetch Dossiê Inteligente
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/votacoes/${id}/dossie_ia`)
      .then(res => res.json())
      .then(data => {
        setDossierIA(data.dossie);
        setLoadingDossier(false);
      })
      .catch(e => {
        console.error(e);
        setDossierIA("Erro ao gerar dossiê executivo via inteligência artificial.");
        setLoadingDossier(false);
      });
  };

  const closeModal = () => {
    setSelectedVotacao(null);
    setVotacaoDetails(null);
    setDossierIA(null);
  };

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/votacoes`)
      .then(res => res.json())
      .then(data => {
        setVotacoes(data.dados || []);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
  };

  return (
    <div className="flex-1 p-6 md:p-10 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Activity className="w-8 h-8 text-primary" /> Radar de Votações
          </h1>
          <p className="text-muted-foreground mt-2">Acompanhe as últimas votações em plenário e veja como os projetos estão avançando.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {votacoes.map((v) => (
              <div 
                key={v.id} 
                onClick={() => openDetails(v.id)}
                className="bg-card hover:bg-accent border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group cursor-pointer"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-primary/10 text-primary border border-primary/20 rounded font-bold text-[10px] uppercase tracking-wider">
                        {v.siglaOrgao}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">
                        {formatDate(v.dataHoraRegistro)}
                      </span>
                    </div>
                    
                    <h3 className="font-bold text-lg text-foreground leading-tight group-hover:text-primary transition-colors">
                      {v.descricao}
                    </h3>
                    
                    {v.proposicaoObjeto && (
                      <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-2">
                        <FileSignature className="w-4 h-4" />
                        Objeto: {v.proposicaoObjeto}
                      </div>
                    )}
                  </div>
                  
                  {v.aprovacao !== undefined && (
                    <div className={`flex-shrink-0 px-4 py-2 rounded-xl font-bold border ${v.aprovacao === 1 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>
                      {v.aprovacao === 1 ? 'APROVADO' : 'REJEITADO'}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {votacoes.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                Nenhuma votação recente encontrada.
              </div>
            )}
          </div>
        )}

        {/* Modal de Detalhes */}
        {selectedVotacao && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="bg-card border border-border shadow-2xl rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
              <div className="p-6 border-b border-border flex justify-between items-center sticky top-0 bg-card z-10">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" /> Detalhes da Votação
                </h2>
                <button onClick={closeModal} className="p-2 hover:bg-accent rounded-full transition-colors">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative">
                {loadingDetails && !votacaoDetails ? (
                   <div className="flex flex-col items-center justify-center py-20 opacity-50">
                     <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                     <p className="text-sm font-bold tracking-widest uppercase">Decodificando Votação...</p>
                   </div>
                ) : votacaoDetails && votacaoDetails.votacao ? (
                   (() => {
                     const hasRightColumn = votacaoDetails.votacao.proposicaoObjeto || (votacaoDetails.orientacoes && votacaoDetails.orientacoes.length > 0) || (votacaoDetails.votos && votacaoDetails.votos.length > 0);
                     
                     return (
                       <div className="space-y-8 flex flex-col md:flex-row md:space-y-0 gap-8">
                         
                         {/* Coluna Esquerda: Contexto IA */}
                         <div className={`flex-1 space-y-6 ${hasRightColumn ? '' : 'max-w-3xl mx-auto'}`}>
                           <div>
                             <span className="inline-block px-3 py-1 bg-secondary text-secondary-foreground text-xs font-bold uppercase rounded-full mb-3">
                               {votacaoDetails.votacao.siglaOrgao} • {formatDate(votacaoDetails.votacao.dataHoraRegistro)}
                             </span>
                             <h3 className="font-black text-2xl md:text-3xl text-foreground leading-tight">{votacaoDetails.votacao.descricao}</h3>
                           </div>

                           <div className="bg-card border border-border shadow-sm rounded-2xl p-6 md:p-8 relative overflow-hidden">
                              <h4 className="font-bold flex items-center gap-2 mb-6 text-foreground text-lg border-b border-border pb-4">
                                <Brain className="w-5 h-5 text-primary"/> Dossiê Executivo (IA)
                              </h4>
                              
                              {loadingDossier ? (
                                 <div className="flex items-center gap-3 text-muted-foreground animate-pulse py-4">
                                   <Loader2 className="w-5 h-5 animate-spin" />
                                   <span className="text-sm font-medium">Vasculhando a internet e analisando o contexto político...</span>
                                 </div>
                              ) : (
                                 <div className="w-full">
                                   <ReactMarkdown
                                     components={{
                                       h3: ({node, ...props}) => <h3 className="text-lg font-black text-foreground mt-8 mb-3" {...props} />,
                                       h4: ({node, ...props}) => <h4 className="text-md font-bold text-foreground mt-6 mb-2" {...props} />,
                                       p: ({node, ...props}) => <p className="text-[15px] leading-relaxed text-muted-foreground mb-4" {...props} />,
                                       strong: ({node, ...props}) => <strong className="font-bold text-foreground" {...props} />,
                                       ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 text-[15px] text-muted-foreground space-y-2" {...props} />,
                                       li: ({node, ...props}) => <li className="" {...props} />
                                     }}
                                   >
                                     {dossierIA || ''}
                                   </ReactMarkdown>
                                 </div>
                              )}
                           </div>
                         </div>

                         {/* Coluna Direita: Dados Oficiais */}
                         {hasRightColumn && (
                           <div className="w-full md:w-80 space-y-6 flex-shrink-0">
                             
                             {votacaoDetails.votacao.proposicaoObjeto && (
                               <div className="p-4 bg-muted/50 border border-border rounded-xl">
                                 <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                                   Objeto Oficial da Câmara
                                 </p>
                                 <p className="text-sm text-foreground font-medium leading-relaxed">{votacaoDetails.votacao.proposicaoObjeto}</p>
                               </div>
                             )}
                           
                             {/* Orientacoes */}
                             {votacaoDetails.orientacoes && votacaoDetails.orientacoes.length > 0 && (
                               <div>
                                 <h4 className="font-bold mb-4 flex items-center gap-2 border-b border-border pb-2 text-sm text-muted-foreground uppercase tracking-wider">
                                   <Users className="w-4 h-4"/> Orientação dos Partidos
                                 </h4>
                                 <div className="grid grid-cols-2 gap-2">
                                   {votacaoDetails.orientacoes.map((ori: any, idx: number) => {
                                     const orientacao = ori.orientacaoVoto.toLowerCase().trim();
                                     const isSim = orientacao === 'sim';
                                     const isNao = orientacao === 'não' || orientacao === 'nao';
                                     const isLiberado = orientacao === 'liberado';
                                     
                                     return (
                                       <div key={idx} className="bg-background border border-border p-2 rounded-lg flex items-center justify-between gap-2 hover:border-primary/50 transition-colors">
                                         <span className="font-bold text-foreground text-sm">{ori.siglaPartidoBloco}</span>
                                         <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                           isSim ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 
                                           isNao ? 'bg-destructive/10 text-destructive' : 
                                           isLiberado ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                                           'bg-secondary text-secondary-foreground'
                                         }`}>
                                           {ori.orientacaoVoto}
                                         </span>
                                       </div>
                                     );
                                   })}
                                 </div>
                               </div>
                             )}

                             {/* Total de Votos Resumo */}
                             {votacaoDetails.votos && votacaoDetails.votos.length > 0 && (
                                <div className="bg-muted/50 rounded-xl p-4 border border-border">
                                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Veredito Oficial</p>
                                  <div className="flex items-center justify-between">
                                    <span className="text-2xl font-black text-foreground">{votacaoDetails.votos.length} <span className="text-sm font-medium text-muted-foreground">votos</span></span>
                                    <span className={`font-black ${votacaoDetails.votacao.aprovacao === 1 ? 'text-emerald-500' : 'text-destructive'}`}>
                                      {votacaoDetails.votacao.aprovacao === 1 ? 'APROVADO' : 'REJEITADO'}
                                    </span>
                                  </div>
                                </div>
                             )}
                           </div>
                         )}
                       </div>
                     );
                   })()
                ) : (
                   <div className="text-center text-muted-foreground py-10">Erro ao carregar detalhes. A API da Câmara pode estar indisponível.</div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
