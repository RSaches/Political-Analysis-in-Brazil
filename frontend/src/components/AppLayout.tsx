'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
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
  Landmark,
  Moon,
  Sun,
  LogOut
} from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { name: 'Chat IA', href: '/dashboard', icon: MessageSquare },
    { name: 'Monitor Político', href: '/monitor-politico', icon: Compass },
    { name: 'Projetos de Lei', href: '/projetos-de-lei', icon: FileText },
    { name: 'Deputados', href: '/deputados', icon: Users },
    { name: 'Senado', href: '/senado', icon: Landmark },
    { name: 'Radar Votações', href: '/radar', icon: Activity },
    { name: 'Agenda', href: '/agenda', icon: Calendar },
    { name: 'Estatísticas', href: '/estatisticas', icon: BarChart2 },
  ];

  const publicRoutes = ['/', '/login', '/register'];
  if (publicRoutes.includes(pathname)) {
    return <>{children}</>;
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans transition-colors duration-500">
      
      {/* Sidebar Navigation */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: sidebarCollapsed ? 96 : 288,
          x: mobileMenuOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 768 ? -288 : 0)
        }}
        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        className={`fixed inset-y-0 left-0 z-50 glass-panel border-r border-sidebar-border shadow-2xl flex flex-col md:relative ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
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
          
          {navItems.map((item, i) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link key={item.name} href={item.href} onClick={() => setMobileMenuOpen(false)} title={item.name}>
                <motion.div 
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-3.5 mb-2 rounded-xl font-medium transition-colors group relative overflow-hidden ${isActive ? 'text-primary-foreground shadow-lg shadow-primary/20' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'}`}
                >
                  {isActive && (
                    <motion.div layoutId="activeNav" className="absolute inset-0 bg-primary rounded-xl z-0" />
                  )}
                  <Icon className={`w-5 h-5 flex-shrink-0 z-10 relative ${!isActive && 'group-hover:scale-110 transition-transform text-sidebar-foreground/50 group-hover:text-primary'}`} />
                  {!sidebarCollapsed && <span className="whitespace-nowrap z-10 relative">{item.name}</span>}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-sidebar-border/50 flex flex-col gap-2">
           <button 
             onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
             className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-3.5 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-xl font-medium transition-all group hidden md:flex`}
             title={sidebarCollapsed ? "Expandir" : "Recolher Menu"}
           >
            {sidebarCollapsed ? <PanelLeftOpen className="w-5 h-5 flex-shrink-0 text-sidebar-foreground/50 group-hover:text-sidebar-accent-foreground" /> : <PanelLeftClose className="w-5 h-5 flex-shrink-0 text-sidebar-foreground/50 group-hover:text-sidebar-accent-foreground" />}
            {!sidebarCollapsed && <span className="whitespace-nowrap">Recolher Menu</span>}
          </button>
          
          {mounted && (
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-3.5 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-xl font-medium transition-all group`} 
              title="Alternar Tema"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 flex-shrink-0 text-amber-400 group-hover:rotate-45 transition-transform" /> : <Moon className="w-5 h-5 flex-shrink-0 text-blue-500 group-hover:-rotate-12 transition-transform" />}
              {!sidebarCollapsed && <span className="whitespace-nowrap">{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>}
            </button>
          )}

          <button 
            onClick={handleLogout}
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-3.5 text-red-500 hover:bg-red-500/10 hover:text-red-600 rounded-xl font-bold transition-all group`} 
            title="Sair da Conta"
          >
            <LogOut className="w-5 h-5 flex-shrink-0 group-hover:-translate-x-1 transition-transform" /> 
            {!sidebarCollapsed && <span className="whitespace-nowrap">Sair da Conta</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen relative bg-background">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border glass-panel z-10">
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
