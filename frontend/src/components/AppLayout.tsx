'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  MessageSquare, 
  Compass, 
  FileText, 
  BarChart2, 
  Settings, 
  PanelLeftClose, 
  PanelLeftOpen, 
  Menu, 
  X,
  Users,
  Activity,
  Calendar,
  Landmark
} from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { name: 'Chat IA', href: '/', icon: MessageSquare },
    { name: 'Monitor Político', href: '/monitor-politico', icon: Compass },
    { name: 'Projetos de Lei', href: '/projetos-de-lei', icon: FileText },
    { name: 'Deputados', href: '/deputados', icon: Users },
    { name: 'Senado', href: '/senado', icon: Landmark },
    { name: 'Radar Votações', href: '/radar', icon: Activity },
    { name: 'Agenda', href: '/agenda', icon: Calendar },
    { name: 'Estatísticas', href: '/estatisticas', icon: BarChart2 },
  ];

  return (
    <div className="flex h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-background via-background/95 to-background text-foreground overflow-hidden font-sans">
      
      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 bg-sidebar/95 backdrop-blur-xl border-r border-sidebar-border shadow-2xl transform transition-all duration-300 ease-in-out md:translate-x-0 md:relative flex flex-col ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} ${sidebarCollapsed ? 'w-24' : 'w-72'}`}>
        <div className="p-6 flex items-center justify-between border-b border-sidebar-border/50">
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 flex-shrink-0 rounded-xl shadow-lg border border-primary/20 overflow-hidden bg-white/5">
              <Image src="/logo.jpg" alt="Olho de Águia Logo" fill priority sizes="48px" className="object-cover" />
            </div>
            {!sidebarCollapsed && (
              <div className="overflow-hidden">
                <h1 className="text-lg font-black text-sidebar-foreground tracking-tight leading-none whitespace-nowrap">OLHO DE ÁGUIA</h1>
                <p className="text-[10px] text-primary font-bold uppercase tracking-[0.2em] mt-1 whitespace-nowrap">Inteligência</p>
              </div>
            )}
          </div>
          <button className="md:hidden text-sidebar-foreground flex-shrink-0" onClick={() => setMobileMenuOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar overflow-x-hidden">
          {!sidebarCollapsed && <p className="text-xs font-bold text-sidebar-foreground/40 uppercase tracking-widest mb-4 mt-2 px-2 whitespace-nowrap">Navegação</p>}
          
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link key={item.name} href={item.href} onClick={() => setMobileMenuOpen(false)} title={item.name}>
                <div className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-3.5 mb-2 rounded-xl font-medium transition-all group ${isActive ? 'bg-primary/10 text-primary border border-primary/20 shadow-inner' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}>
                  <Icon className={`w-5 h-5 flex-shrink-0 ${!isActive && 'group-hover:scale-110 transition-transform text-sidebar-foreground/50 group-hover:text-sidebar-accent-foreground'}`} />
                  {!sidebarCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border/50 flex flex-col gap-2">
           <button 
             onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
             className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-3.5 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-xl font-medium transition-all group hidden md:flex`}
             title={sidebarCollapsed ? "Expandir" : "Recolher"}
           >
            {sidebarCollapsed ? <PanelLeftOpen className="w-5 h-5 flex-shrink-0 text-sidebar-foreground/50 group-hover:text-sidebar-accent-foreground" /> : <PanelLeftClose className="w-5 h-5 flex-shrink-0 text-sidebar-foreground/50 group-hover:text-sidebar-accent-foreground" />}
            {!sidebarCollapsed && <span className="whitespace-nowrap">Recolher Menu</span>}
          </button>
           <button className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-3.5 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-xl font-medium transition-all group`} title="Configurações">
            <Settings className="w-5 h-5 flex-shrink-0 group-hover:rotate-90 transition-transform text-sidebar-foreground/50 group-hover:text-sidebar-accent-foreground" /> 
            {!sidebarCollapsed && <span className="whitespace-nowrap">Configurações</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen relative">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-background/80 backdrop-blur-xl z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-primary/20">
              <Image src="/logo.jpg" alt="Logo" fill priority sizes="32px" className="object-cover" />
            </div>
            <h1 className="text-base font-bold text-foreground">Olho de Águia</h1>
          </div>
          <button className="p-2 text-foreground bg-secondary rounded-lg" onClick={() => setMobileMenuOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {/* Page Content */}
        {children}
      </main>
    </div>
  );
}
