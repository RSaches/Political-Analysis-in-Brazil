'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      });

      if (res.ok) {
        const data = await res.json();
        login(data.access_token);
        router.push('/dashboard');
      } else {
        const errorData = await res.json();
        setError(errorData.detail || 'Falha ao autenticar.');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col md:flex-row font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* Visual Section - Left Side */}
      <div className="flex-1 relative hidden md:flex flex-col justify-between p-12 overflow-hidden border-r border-white/10">
        <div className="absolute inset-0 z-0">
          <Image 
            src="/war_room.png" 
            alt="War Room Background" 
            fill 
            className="object-cover opacity-20 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/80 to-transparent"></div>
        </div>
        
        <Link href="/" className="relative z-10 flex items-center gap-3 w-fit group">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-white/10 group-hover:border-emerald-500/50 transition-colors">
            <Image src="/logo.jpg" alt="Logo" fill className="object-cover" />
          </div>
          <span className="font-black text-xl uppercase tracking-widest">Olho de Águia</span>
        </Link>
        
        <div className="relative z-10 max-w-lg">
          <ShieldCheck className="w-12 h-12 text-emerald-500 mb-6" />
          <h1 className="text-5xl font-black uppercase tracking-tighter leading-tight mb-4 text-transparent bg-clip-text bg-gradient-to-br from-white to-white/50">
            Acesso ao <br/> Centro de <span className="text-emerald-500">Comando</span>.
          </h1>
          <p className="text-lg font-medium text-white/60 leading-relaxed">Autentique-se para acessar os dados restritos e ferramentas de inteligência em tempo real.</p>
        </div>
      </div>

      {/* Form Section - Right Side */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#050505] relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/10 via-transparent to-transparent opacity-50"></div>
        
        <div className="w-full max-w-md relative z-10">
          <div className="md:hidden flex items-center gap-3 mb-12">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-white/10">
              <Image src="/logo.jpg" alt="Logo" fill className="object-cover" />
            </div>
            <span className="font-black text-xl uppercase tracking-widest text-white">Olho de Águia</span>
          </div>
          
          <h2 className="text-3xl font-black uppercase mb-8 text-white">Iniciar Sessão</h2>
          
          {error && (
            <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 font-medium flex items-center gap-3 text-sm backdrop-blur-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-white/50">Endereço de E-mail</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-white/20 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                placeholder="nome@campanha.com.br"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-white/50">Palavra-passe</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-white/20 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                placeholder="••••••••"
              />
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-emerald-500 text-black text-lg font-black uppercase p-4 rounded-2xl hover:bg-emerald-400 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100 mt-8 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
            >
              {isLoading ? 'Autenticando...' : 'Acessar War Room'} <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <p className="mt-8 text-sm font-medium text-white/40 text-center">
            Sem autorização? <Link href="/register" className="font-bold text-emerald-500 hover:text-emerald-400 hover:underline underline-offset-4 transition-colors">Solicitar Acesso</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
