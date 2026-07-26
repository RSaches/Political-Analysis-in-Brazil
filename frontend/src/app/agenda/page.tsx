'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, RefreshCw, Clock, MapPin, Users, X, PlayCircle, FileText, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchAgenda, fetchEventoDetalhes, fetchEventoPauta, EventoAgenda, EventoDetalhes, PautaItem } from '@/lib/camaraApi';

export default function AgendaPage() {
  const [eventos, setEventos] = useState<EventoAgenda[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [eventDetails, setEventDetails] = useState<EventoDetalhes | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Pauta State
  const [pautaItems, setPautaItems] = useState<PautaItem[]>([]);
  const [loadingPauta, setLoadingPauta] = useState(false);
  const [showPauta, setShowPauta] = useState(false);

  useEffect(() => {
    fetchAgenda().then(data => {
      setEventos(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      setLoadingDetails(true);
      setShowPauta(false);
      setPautaItems([]);
      fetchEventoDetalhes(selectedEventId).then(data => {
        setEventDetails(data);
        setLoadingDetails(false);
      });
    } else {
      setEventDetails(null);
      setShowPauta(false);
      setPautaItems([]);
    }
  }, [selectedEventId]);

  const handleLoadPauta = async (id: number) => {
    if (showPauta) {
      setShowPauta(false);
      return;
    }
    setLoadingPauta(true);
    setShowPauta(true);
    const items = await fetchEventoPauta(id);
    setPautaItems(items);
    setLoadingPauta(false);
  };

  const formatDateDay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).format(date).toUpperCase();
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(date);
  };

  // Group events by day
  const groupedEvents = eventos.reduce((acc: any, ev) => {
    const day = formatDateDay(ev.dataHoraInicio);
    if (!acc[day]) acc[day] = [];
    acc[day].push(ev);
    return acc;
  }, {});

  return (
    <div className="flex-1 p-6 md:p-10 overflow-y-auto bg-background relative">
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div>
          <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
            <Calendar className="w-8 h-8 text-primary" /> Agenda de Risco
          </h1>
          <p className="text-muted-foreground mt-2">Acompanhe as reuniões, comissões e sessões deliberativas da Câmara.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(groupedEvents).map(([day, evs]: [string, any]) => (
              <div key={day} className="space-y-4">
                <h2 className="text-xl font-black text-foreground border-b border-border pb-2">{day}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {evs.map((ev: EventoAgenda) => (
                    <div 
                      key={ev.id} 
                      onClick={() => setSelectedEventId(ev.id)}
                      className="bg-card hover:bg-accent border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden cursor-pointer"
                    >
                      <div className="absolute top-0 left-0 w-full h-1 bg-primary/0 group-hover:bg-primary transition-colors"></div>
                      
                      {/* Situacao Tag */}
                      <div className="absolute top-4 right-4">
                        <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider ${
                          ev.situacao === 'Ocorrido' || ev.situacao === 'Encerrada'
                            ? 'bg-muted text-muted-foreground border border-border'
                            : 'bg-primary/10 text-primary border border-primary/20'
                        }`}>
                          {ev.situacao}
                        </span>
                      </div>

                      <div className="pr-20">
                        <h3 className="font-bold text-foreground text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
                          {ev.descricaoTipo}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                          {ev.descricao}
                        </p>
                      </div>
                      
                      <div className="mt-4 flex flex-wrap gap-4 text-xs font-medium text-muted-foreground">
                        <div className="flex items-center gap-1.5 bg-background px-2 py-1 rounded-md border border-border">
                          <Clock className="w-3.5 h-3.5 text-primary" /> {formatTime(ev.dataHoraInicio)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-primary" /> {ev.localCamara?.nome || ev.localExterno || 'Local a definir'}
                        </div>
                        {ev.orgaos && ev.orgaos.length > 0 && (
                          <div className="flex items-center gap-1.5 w-full mt-1">
                            <Users className="w-3.5 h-3.5 text-primary" /> {ev.orgaos[0].nome}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {eventos.length === 0 && (
              <div className="py-12 text-center text-muted-foreground bg-card rounded-2xl border border-dashed border-border">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                Nenhum evento encontrado para esta semana.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      {selectedEventId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden relative animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
              <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                <Calendar className="w-6 h-6 text-primary" /> Detalhes do Evento
              </h2>
              <button 
                onClick={() => setSelectedEventId(null)}
                className="p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar scroll-smooth">
              {loadingDetails ? (
                <div className="space-y-6 animate-pulse">
                  <div className="h-8 bg-muted rounded-lg w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="space-y-2 mt-6">
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-5/6"></div>
                    <div className="h-4 bg-muted rounded w-4/6"></div>
                  </div>
                  <div className="h-20 bg-muted rounded-xl mt-6"></div>
                </div>
              ) : eventDetails ? (
                <div className="space-y-10">
                  
                  {/* Top Info */}
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground font-black uppercase tracking-widest">
                        {eventDetails.descricaoTipo}
                      </span>
                      <span className={`text-xs px-3 py-1.5 rounded-md font-black uppercase tracking-widest border ${
                          eventDetails.situacao === 'Ocorrido' || eventDetails.situacao === 'Encerrada'
                            ? 'bg-muted text-muted-foreground border-border'
                            : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                        }`}>
                        {eventDetails.situacao}
                      </span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black text-foreground leading-tight">
                      {eventDetails.descricao.split('\r\n')[0]}
                    </h3>
                  </div>

                  {/* Context & Description */}
                  <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10 text-base md:text-lg text-foreground whitespace-pre-wrap leading-relaxed">
                    {eventDetails.descricao.includes('\r\n') 
                      ? eventDetails.descricao.substring(eventDetails.descricao.indexOf('\r\n') + 2) 
                      : eventDetails.descricao}
                  </div>

                  {/* Grid Infos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-card border border-border rounded-2xl p-5 flex gap-4 items-center">
                      <Clock className="w-6 h-6 text-primary flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Horário</p>
                        <p className="text-base font-bold text-foreground">
                          {formatDateDay(eventDetails.dataHoraInicio)} às {formatTime(eventDetails.dataHoraInicio)}
                        </p>
                        {eventDetails.dataHoraFim && (
                          <p className="text-sm text-muted-foreground mt-1">Término: {formatTime(eventDetails.dataHoraFim)}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-card border border-border rounded-2xl p-5 flex gap-4 items-center">
                      <MapPin className="w-6 h-6 text-primary flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Localização</p>
                        <p className="text-base font-bold text-foreground">
                          {eventDetails.localCamara?.nome || eventDetails.localExterno || 'Local a definir'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Organizers */}
                  {eventDetails.orgaos && eventDetails.orgaos.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" /> Órgãos Responsáveis
                      </h4>
                      <div className="space-y-2">
                        {eventDetails.orgaos.map((orgao) => (
                          <div key={orgao.id} className="bg-card border border-border rounded-lg p-3 text-sm text-muted-foreground">
                            <strong className="text-foreground">{orgao.sigla}</strong> - {orgao.nome}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pauta & Requerimentos */}
                  {eventDetails.requerimentos && eventDetails.requerimentos.length > 0 && (
                    <div className="border-t border-border pt-6">
                      <h4 className="text-sm font-bold text-foreground mb-4">Requerimentos Relacionados</h4>
                      <div className="grid gap-3">
                        {eventDetails.requerimentos?.map((req, i) => (
                          <div key={i} className="flex items-center gap-3 bg-card border border-border rounded-xl p-4">
                            <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm font-medium text-foreground">{req.titulo}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pauta Interna Fetcher */}
                  <div className="border-t border-border pt-6 mt-6">
                    <button 
                      onClick={() => handleLoadPauta(eventDetails.id)}
                      className="flex items-center justify-between w-full bg-accent/50 hover:bg-accent border border-border rounded-xl p-4 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-primary" />
                        <span className="font-bold text-sm text-foreground">Ler Pauta Completa</span>
                      </div>
                      {loadingPauta ? (
                        <RefreshCw className="w-5 h-5 text-muted-foreground animate-spin" />
                      ) : showPauta ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                      )}
                    </button>

                    {showPauta && (
                      <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
                        {pautaItems.length === 0 ? (
                          <div className="text-center py-6 text-muted-foreground bg-card rounded-xl border border-dashed border-border">
                            Nenhum item detalhado de pauta encontrado para este evento.
                          </div>
                        ) : (
                          pautaItems.map((item, idx) => (
                            <div key={idx} className="bg-card border border-border rounded-xl p-4">
                              <div className="flex justify-between items-start gap-4 mb-2">
                                <h5 className="font-bold text-foreground">
                                  <span className="text-primary mr-2">#{item.ordem}</span>
                                  {item.titulo}
                                </h5>
                                <span className="text-xs px-2 py-1 rounded-md bg-muted text-muted-foreground font-medium whitespace-nowrap">
                                  {item.situacaoItem}
                                </span>
                              </div>
                              <div className="text-sm text-muted-foreground mb-2">
                                <strong>Tópico:</strong> {item.topico}
                              </div>
                              {item.proposicaoRelacionada_?.ementa && (
                                <p className="text-sm text-foreground bg-accent/50 p-3 rounded-lg border border-border/50 mb-3">
                                  {item.proposicaoRelacionada_.ementa}
                                </p>
                              )}
                              {item.textoParecer && (
                                <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg mt-3">
                                  <strong>Parecer:</strong> {item.textoParecer}
                                </div>
                              )}
                              {item.relator && (
                                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                                  <Users className="w-3.5 h-3.5 text-primary" />
                                  Relator: <span className="font-medium text-foreground">{item.relator.nome}</span> 
                                  ({item.relator.siglaPartido}-{item.relator.siglaUf})
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  {eventDetails.urlRegistro && (
                    <div className="pt-4 flex justify-end">
                       <a href={eventDetails.urlRegistro} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-red-600/20">
                          <PlayCircle className="w-5 h-5" /> Assistir Transmissão
                       </a>
                    </div>
                  )}

                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  Erro ao carregar detalhes.
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}
