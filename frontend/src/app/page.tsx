import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BarChart3, Globe, ShieldCheck, Cpu, MessageSquare, Users, Landmark, Activity, FileText } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Olho de Águia | Inteligência Política e Análise de Dados Eleitorais',
  description: 'Plataforma de inteligência política para campanhas, análises de cenário e monitoramento legislativo. Acompanhe a Câmara, Senado, Projetos de Lei e IA para decisões baseadas em dados.',
  keywords: ['inteligência política', 'dados eleitorais', 'radar de votações', 'projetos de lei', 'câmara dos deputados', 'senado federal', 'campanha política', 'Olho de Águia', 'análise política brasil'],
  openGraph: {
    title: 'Olho de Águia | Inteligência Política de Alta Performance',
    description: 'Transforme dados em votos. Monitore o cenário político do Brasil em tempo real com Inteligência Artificial e saia na frente nas eleições.',
    type: 'website',
    locale: 'pt_BR',
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-emerald-500 selection:text-white font-sans overflow-x-hidden">
      
      {/* Background Image with Overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Image 
          src="/congress_bg.png" 
          alt="Congresso Nacional Brasília" 
          fill 
          className="object-cover opacity-30 mix-blend-luminosity"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/90 via-[#050505]/70 to-[#050505] backdrop-blur-[2px]"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 w-full px-6 py-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/10 shadow-2xl group-hover:border-emerald-500/50 transition-colors">
            <Image src="/logo.jpg" alt="Olho de Águia Logo" fill className="object-cover" />
          </div>
          <div>
            <h1 className="font-black text-xl uppercase tracking-widest text-white leading-none">Olho de Águia</h1>
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-[0.2em] mt-1">Inteligência Política</p>
          </div>
        </div>
        <nav className="hidden md:flex gap-8 items-center bg-white/5 backdrop-blur-md px-8 py-3 rounded-full border border-white/10">
          <Link href="#recursos" className="text-sm font-semibold text-white/70 hover:text-white transition-colors uppercase tracking-wider">Arsenal Político</Link>
          <Link href="#dados" className="text-sm font-semibold text-white/70 hover:text-white transition-colors uppercase tracking-wider">A Vantagem</Link>
          <Link href="/login" className="text-sm font-semibold text-white/70 hover:text-white transition-colors uppercase tracking-wider">Entrar</Link>
          <Link href="/register" className="text-sm font-bold bg-white text-black px-5 py-2 rounded-full hover:bg-emerald-500 hover:text-white transition-colors uppercase tracking-wider shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]">
            Acesso Exclusivo
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[85vh] px-6 text-center max-w-5xl mx-auto mt-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Plataforma de Monitoramento em Tempo Real
        </div>
        
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.95] mb-8 text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/60">
          O Poder Político <br /> <span className="text-emerald-500 text-6xl md:text-8xl lg:text-[110px]">Mora nos Dados.</span>
        </h1>
        
        <p className="text-xl md:text-2xl font-medium max-w-4xl mb-12 text-white/80 leading-relaxed">
          Na política moderna, intuição não ganha eleição. O **Olho de Águia** é o seu centro de comando: antecipe cenários, investigue projetos de lei com Inteligência Artificial e monitore os passos de deputados e senadores antes da concorrência.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center items-center">
          <Link href="/register" className="flex items-center justify-center gap-3 bg-emerald-500 text-black text-lg font-black uppercase px-10 py-5 rounded-2xl hover:bg-emerald-400 hover:scale-105 transition-all group shadow-[0_10px_40px_rgba(16,185,129,0.3)] w-full sm:w-auto">
            Garantir Vantagem Competitiva <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <span className="text-sm font-semibold text-white/50 uppercase tracking-widest px-4">Ou</span>
          <Link href="/login" className="text-sm font-bold text-white hover:text-emerald-400 uppercase tracking-widest border-b border-transparent hover:border-emerald-400 transition-colors">
            Fazer Login
          </Link>
        </div>
      </main>

      {/* Visual Break / Image Section */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-6 py-16" id="recursos">
        <div className="relative w-full aspect-[21/9] md:aspect-[24/8] rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.8)]">
           <Image src="/war_room.png" alt="War Room Político - Painel de Controle" fill className="object-cover" />
           <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/30 to-transparent"></div>
           <div className="absolute bottom-8 left-8 right-8 md:bottom-12 md:left-12">
             <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-3">Seu War Room Pessoal</h2>
             <p className="text-white/90 font-medium text-lg max-w-3xl leading-relaxed">
               Ao fazer login, você acessa um painel completo (Dashboard) projetado para profissionais, campanhas e analistas políticos. Tudo em uma interface limpa, rápida e livre de distrações.
             </p>
           </div>
        </div>
      </section>

      {/* Features Arsenal Grid */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4 text-emerald-500">O Que Você Pode Fazer?</h2>
          <p className="text-xl text-white/60 font-medium max-w-2xl mx-auto">Um verdadeiro arsenal de ferramentas investigativas para orientar o seu mandato ou sua estratégia eleitoral.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: <MessageSquare className="w-8 h-8" />, title: "Chat de IA Político", desc: "Pergunte à nossa IA sobre leis complexas. 'Resuma a nova reforma tributária' e obtenha respostas instantâneas cruzando dados reais." },
            { icon: <Activity className="w-8 h-8" />, title: "Radar de Votações", desc: "Monitore como parlamentares estão votando em tempo real. Identifique alianças, traições e tendências antes que saiam no jornal." },
            { icon: <FileText className="w-8 h-8" />, title: "Projetos de Lei (PL/PEC)", desc: "Varredura automática e diária da Câmara. Saiba exatamente quais projetos afetam o seu eleitorado ou sua base de apoio." },
            { icon: <Users className="w-8 h-8" />, title: "Dossiê de Deputados", desc: "Perfil completo dos deputados federais. Gastos de gabinete, presenças, relatorias e histórico de votos de cada um." },
            { icon: <Landmark className="w-8 h-8" />, title: "Monitor do Senado", desc: "Acompanhe a casa revisora. Relatórios detalhados da movimentação no senado para antecipar o cenário macroeconômico e político." },
            { icon: <BarChart3 className="w-8 h-8" />, title: "Estatísticas & Agendas", desc: "Métricas consolidadas, giro de notícias integradas e a agenda oficial. Uma bússola exata para saber onde a política está acontecendo hoje." },
          ].map((feature, idx) => (
            <div key={idx} className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:bg-white/10 hover:border-emerald-500/50 transition-all backdrop-blur-sm group shadow-lg">
              <div className="bg-[#050505] border border-emerald-500/30 text-emerald-500 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-black transition-all">
                {feature.icon}
              </div>
              <h3 className="text-xl font-black uppercase mb-3 tracking-tight">{feature.title}</h3>
              <p className="text-white/60 font-medium leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Final */}
      <section className="relative z-10 w-full max-w-5xl mx-auto px-6 pb-32 text-center" id="dados">
        <div className="bg-gradient-to-br from-emerald-900/40 to-[#050505] border border-emerald-500/30 rounded-[3rem] p-12 md:p-20 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
          <ShieldCheck className="w-16 h-16 text-emerald-500 mx-auto mb-8 opacity-80" />
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6 text-white">
            Informação é Poder. <br/> <span className="text-emerald-500">Tome o Controle.</span>
          </h2>
          <p className="text-xl font-medium text-white/70 mb-10 max-w-2xl mx-auto">
            Não deixe que a complexidade do sistema político atrase sua estratégia. Cadastre-se agora e tenha acesso imediato a todas as ferramentas do Olho de Águia.
          </p>
          <Link href="/register" className="inline-flex items-center justify-center gap-3 bg-white text-black text-xl font-black uppercase px-12 py-6 rounded-2xl hover:bg-emerald-500 hover:text-white hover:scale-105 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.1)]">
            Criar Minha Conta <ArrowRight />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-[#050505] p-12 text-center flex flex-col items-center">
        <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/10 mb-6 opacity-60 grayscale hover:grayscale-0 transition-all">
          <Image src="/logo.jpg" alt="Olho de Águia Logo" fill className="object-cover" />
        </div>
        <p className="font-bold uppercase text-xs text-white/40 tracking-[0.2em] mb-2">
          © {new Date().getFullYear()} Olho de Águia. Excelência em Inteligência Política.
        </p>
        <p className="text-[10px] text-white/20 uppercase tracking-widest">Tecnologia, Dados e Transparência</p>
      </footer>
    </div>
  );
}
