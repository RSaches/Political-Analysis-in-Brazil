'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Send, PlayCircle, FileText, BarChart2, Tv, RefreshCw, PlusCircle, Brain, Settings, Compass, MessageSquare, Menu, X, Newspaper, PanelLeftClose, PanelLeftOpen, FileSignature } from 'lucide-react';
import { fetchUltimasProposicoes, Proposicao } from '@/lib/camaraApi';
import { useVideo } from '@/context/VideoContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Home() {
  const { globalVideo, setGlobalVideo } = useVideo();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Olá! Sou o "Olho de Águia". Como posso ajudar você a investigar o cenário político hoje?' }
  ]);
  const [loading, setLoading] = useState(false);
  
  const [news, setNews] = useState<any[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  
  const [proposicoes, setProposicoes] = useState<Proposicao[]>([]);
  const [loadingProposicoes, setLoadingProposicoes] = useState(true);
  
  const [videos, setVideos] = useState<any[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [videoOffset, setVideoOffset] = useState(0);

  // Alias para manter compatibilidade com o template
  const selectedVideo = globalVideo;
  const setSelectedVideo = setGlobalVideo;
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const fetchNews = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/news`, { cache: 'no-store' });
      if (!res.ok) throw new Error("Backend offline");
      const data = await res.json();
      setNews(data.news || []);
    } catch (error) {
      setNews([
        { 
          title: "Senado aprova novo pacote de medidas econômicas (Demonstração)", 
          url: "#", 
          source: "G1 Política", 
          summary: "O texto-base foi aprovado em votação simbólica. Agora, os senadores analisam destaques que podem alterar trechos da proposta.",
          image: "https://s2-g1.glbimg.com/zzfv-bnFVrFfLApA1W8aGNcAJTw=/i.s3.glbimg.com/v1/AUTH_59edd422c0c84a879bd37670ae4f538a/internal_photos/bs/2026/I/u/ZPtoF7T0CW7PoABMudlg/copia-de-presidenciaveis.jpg"
        },
        { 
          title: "Candidatos debatem propostas para educação no Sudeste (Demonstração)", 
          url: "#", 
          source: "UOL",
          summary: "Especialistas apontam que as propostas para a educação pública dominaram o debate desta noite.",
          image: "https://s2-g1.glbimg.com/t7mJXysvjktcvAZqO8x15rea3rY=/i.s3.glbimg.com/v1/AUTH_59edd422c0c84a879bd37670ae4f538a/internal_photos/bs/2026/R/j/vRqa17QymTYDGA0puLuA/marina-e-simone.jpg"
        }
      ]);
    } finally {
      setLoadingNews(false);
    }
  };

  const fetchVideos = async (offset = 0) => {
    setLoadingVideos(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/videos?limit=15&offset=${offset}`, { cache: 'no-store' });
      if (!res.ok) throw new Error("Backend offline");
      const data = await res.json();
      const fetchedVideos = data.videos || [];
      
      if (offset === 0) {
        setVideos(fetchedVideos);
        if (fetchedVideos.length > 0) setSelectedVideo(fetchedVideos[0]);
      } else {
        setVideos(prev => [...prev, ...fetchedVideos]);
      }
    } catch (error) {
      const mockVideos = [
        { title: "PCC e CV: Governo Lula fala em ação bolsonarista | CNN", content: "https://www.youtube.com/watch?v=a5-qnBUGShA", images: { medium: "https://tse3.mm.bing.net/th/id/OVP.b6p7ZyOwmN6rbHKRcbx2GAHgFo?pid=Api" } },
        { title: "Análise: Flávio Bolsonaro atrai Lula para armadilha | WW", content: "https://www.youtube.com/watch?v=q0vHiJo9uhI", images: { medium: "https://tse1.mm.bing.net/th/id/OVP.IIKPAjaDTS_Fkru3rf3crwHgFo?pid=Api" } },
        { title: "Caminhada de Nikolas chega ao DF | CNN PRIME TIME", content: "https://www.youtube.com/watch?v=o3xtq8hSVMg", images: { medium: "https://tse2.mm.bing.net/th/id/OVP.Wkj79ye-1KSLaSD92z3m4gEsDh?pid=Api" } },
      ];
      if (offset === 0) {
        setVideos(mockVideos);
        setSelectedVideo(mockVideos[0]);
      } else {
        setVideos(prev => [...prev, ...mockVideos.map(v => ({ ...v, title: v.title + " (Página 2)" }))]);
      }
    } finally {
      setLoadingVideos(false);
    }
  };

  useEffect(() => {
    fetchNews();
    fetchVideos(0);
    fetchUltimasProposicoes(3).then(data => {
      setProposicoes(data);
      setLoadingProposicoes(false);
    });
  }, []);

  const handleLoadMoreVideos = () => {
    const newOffset = videoOffset + 15;
    setVideoOffset(newOffset);
    fetchVideos(newOffset);
  };

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

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;

    const userQuery = query;
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', text: userQuery }]);
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userQuery })
      });
      const data = await res.json();
      
      const fullText = data.response;
      const paragraphs = fullText.split('\n\n');
      let currentBubble = '';
      const newBubbles: string[] = [];
      
      for (const p of paragraphs) {
        if ((currentBubble.length + p.length) > 1200) {
          if (currentBubble) newBubbles.push(currentBubble);
          currentBubble = p;
        } else {
          currentBubble = currentBubble ? currentBubble + '\n\n' + p : p;
        }
      }
      if (currentBubble) newBubbles.push(currentBubble);
      
      setMessages(prev => [
        ...prev, 
        ...newBubbles.map(text => ({ role: 'ai', text }))
      ]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: "Desculpe, ocorreu um erro ao processar a requisição." }]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const glassCard = "bg-card/40 backdrop-blur-2xl border border-border/50 shadow-xl rounded-3xl overflow-hidden";

  if (authLoading || !user) {
    return <div className="flex h-full items-center justify-center"><RefreshCw className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <>
      <div className="flex-1 flex overflow-hidden">
          
          {/* Chat Section */}
          <section className="flex-1 flex flex-col h-full mx-auto w-full border-r border-border/50 lg:max-w-4xl relative">
            
            {/* Watermark Logo */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
              <div 
                className="relative w-[500px] h-[500px] opacity-[0.15] dark:opacity-[0.25] mix-blend-luminosity"
                style={{
                  WebkitMaskImage: 'radial-gradient(circle, black 55%, transparent 75%)',
                  maskImage: 'radial-gradient(circle, black 55%, transparent 75%)'
                }}
              >
                <Image src="/logo.jpg" alt="Watermark" fill sizes="(max-width: 500px) 100vw, 500px" className="object-cover" />
              </div>
            </div>

            {/* Chat Header */}
            <div className="p-6 pb-4 border-b border-border/30 bg-background/50 backdrop-blur-sm z-10 flex justify-between items-center relative">
               <div>
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                     <Brain className="w-6 h-6 text-primary" /> Pesquisa Assistida
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">Inteligência artificial analisando dados em tempo real.</p>
               </div>
               <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-full border border-border text-xs font-bold uppercase tracking-wider shadow-inner">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                  </span>
                  Online
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative z-10">
              <AnimatePresence>
                {messages.map((msg, idx) => (
                  <motion.div 
                    key={idx} 
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className={`flex ${msg.role === 'ai' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`p-5 max-w-[85%] text-sm md:text-base shadow-lg ${
                      msg.role === 'ai' 
                        ? 'bg-card text-card-foreground rounded-2xl rounded-tl-sm border border-border/50' 
                        : 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm shadow-primary/20'
                    }`}>
                      {msg.role === 'ai' ? renderFormattedText(msg.text) : <p>{msg.text}</p>}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {messages.length === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8">
                  {[
                    "Resuma o Artigo 5º da Constituição",
                    "Quais as promessas de campanha mais recentes?",
                    "Como está a votação da nova reforma?",
                    "Compare propostas de segurança pública"
                  ].map((prompt, i) => (
                    <button 
                      key={i}
                      onClick={() => setQuery(prompt)}
                      className="p-4 bg-card/40 hover:bg-primary/10 border border-border hover:border-primary/40 rounded-2xl text-left text-sm text-muted-foreground hover:text-foreground transition-all duration-300 group shadow-sm hover:shadow-md"
                    >
                      <span className="font-semibold text-primary mb-1 block">Sugestão</span>
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              {loading && (
                <div className="flex justify-start animate-in fade-in">
                  <div className="bg-card text-muted-foreground rounded-2xl rounded-tl-sm p-5 shadow-sm border border-border/50 flex items-center gap-3">
                    <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-sm font-medium animate-pulse">Analisando o cenário político...</span>
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-6 bg-background/80 backdrop-blur-xl border-t border-border/50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
               <motion.div 
                 initial={{ y: 20, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 transition={{ delay: 0.2 }}
                 className="relative flex gap-3 max-w-3xl mx-auto"
               >
                 <input 
                   type="text" 
                   value={query}
                   onChange={(e) => setQuery(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                   placeholder="Faça uma pergunta sobre política, leis ou candidatos..." 
                   className="flex-1 pl-6 pr-14 py-4 glass-pill focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground transition-all placeholder:text-muted-foreground rounded-full" 
                 />
                 <motion.button 
                   whileHover={{ scale: 1.05 }}
                   whileTap={{ scale: 0.95 }}
                   onClick={handleSearch}
                   disabled={loading || !query.trim()}
                   className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-primary text-primary-foreground rounded-full disabled:opacity-50 disabled:scale-100 shadow-lg shadow-primary/30"
                 >
                   <Send className="w-5 h-5 ml-0.5" />
                 </motion.button>
               </motion.div>
               <p className="text-center text-xs text-muted-foreground mt-4">A IA pode cometer erros. Verifique informações importantes.</p>
            </div>
          </section>

          {/* Right Panel (Discover) */}
          <aside className="w-[500px] 2xl:w-[600px] hidden xl:flex flex-col h-full bg-card/20 border-l border-border/50 overflow-hidden">
            <div className="p-6 border-b border-border/30 bg-background/30 backdrop-blur-sm">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Compass className="w-5 h-5 text-primary" /> Descobertas
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              
              {/* Live Video Spotlight */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Tv className="w-5 h-5 text-destructive" />
                  <h4 className="font-bold text-foreground">Em Destaque</h4>
                </div>
                
                <div className="relative aspect-video rounded-2xl overflow-hidden shadow-xl border border-border group bg-black">
                  {selectedVideo ? (
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${getYouTubeId(selectedVideo.content) || ''}?autoplay=1&mute=0&enablejsapi=1`}
                      title={selectedVideo.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
                      <RefreshCw className="w-6 h-6 animate-spin" />
                    </div>
                  )}
                </div>
                {selectedVideo && <p className="text-sm font-semibold text-foreground line-clamp-2">{selectedVideo.title}</p>}
                
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                  {videos.slice(0, 5).map((vid, i) => (
                    <button key={i} onClick={() => setSelectedVideo(vid)} className={`flex-shrink-0 w-24 aspect-video rounded-lg overflow-hidden border-2 transition-all ${selectedVideo === vid ? 'border-primary opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                       <img src={vid.images?.medium} className="w-full h-full object-cover" alt="thumbnail" />
                    </button>
                  ))}
                  <button onClick={handleLoadMoreVideos} className="flex-shrink-0 w-24 aspect-video rounded-lg bg-card border border-border hover:border-primary flex items-center justify-center text-primary transition-colors">
                     <PlusCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="w-full h-px bg-border/50"></div>

              {/* API Camara - Ultimas Proposicoes */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSignature className="w-5 h-5 text-emerald-500" />
                    <h4 className="font-bold text-foreground">Últimos Projetos de Lei</h4>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase">Câmara</span>
                </div>

                <div className="space-y-3">
                  {loadingProposicoes ? (
                    [1, 2, 3].map(i => <div key={i} className="h-20 bg-card rounded-xl animate-pulse border border-border"></div>)
                  ) : proposicoes.length > 0 ? (
                    proposicoes.map((prop, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * idx }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        key={prop.id} 
                        className="bg-card hover:bg-accent border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-all group flex flex-col gap-2 cursor-pointer"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{prop.siglaTipo} {prop.numero}/{prop.ano}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-3 leading-snug">{prop.ementa}</p>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic text-center py-4">Nenhuma proposição encontrada.</p>
                  )}
                </div>
              </div>

              <div className="w-full h-px bg-border/50"></div>

              {/* News Feed */}
              <div className="space-y-4 pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Newspaper className="w-5 h-5 text-primary" />
                    <h4 className="font-bold text-foreground">Giro de Notícias</h4>
                  </div>
                  <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-md font-semibold">Hoje</span>
                </div>

                <div className="space-y-3">
                  {loadingNews ? (
                    [1, 2, 3].map(i => <div key={i} className="h-24 bg-card rounded-xl animate-pulse border border-border"></div>)
                  ) : news.length > 0 ? (
                    news.map((item, idx) => (
                      <motion.a 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * idx }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        key={idx} href={item.url} target="_blank" rel="noopener noreferrer" className="block bg-card hover:bg-accent border border-border rounded-xl p-3 shadow-sm hover:shadow-md transition-all group cursor-pointer"
                      >
                        <div className="flex gap-3">
                          {item.image && (
                            <img src={item.image} alt="news" className="w-20 h-20 rounded-lg object-cover flex-shrink-0 border border-border/50" />
                          )}
                          <div className="flex flex-col justify-between">
                            <h5 className="text-sm font-bold text-foreground group-hover:text-primary leading-tight line-clamp-3 mb-1">{item.title}</h5>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{item.source}</span>
                          </div>
                        </div>
                      </motion.a>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhuma notícia encontrada.</p>
                  )}
                </div>
              </div>

            </div>
          </aside>

        </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: var(--border); border-radius: 10px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background-color: var(--primary); }
      `}} />
    </>
  );
}
