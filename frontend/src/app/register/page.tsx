'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowRight, AlertCircle, CheckCircle2, Shield } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        const errorData = await res.json();
        setError(errorData.detail || 'Falha ao registrar.');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col md:flex-row-reverse font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* Visual Section - Right Side */}
      <div className="flex-1 relative hidden md:flex flex-col justify-between p-12 overflow-hidden border-l border-white/10">
        <div className="absolute inset-0 z-0">
          <Image 
            src="/congress_bg.png" 
            alt="Congress Background" 
            fill 
            className="object-cover opacity-20 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-[#050505] via-[#050505]/80 to-transparent"></div>
        </div>
        
        <div className="relative z-10 flex justify-end w-full">
          <Link href="/" className="flex items-center gap-3 group">
            <span className="font-black text-xl uppercase tracking-widest">Olho de Águia</span>
            <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-white/10 group-hover:border-emerald-500/50 transition-colors">
              <Image src="/logo.jpg" alt="Logo" fill className="object-cover" />
            </div>
          </Link>
        </div>
        
        <div className="relative z-10 max-w-lg ml-auto text-right">
          <Shield className="w-12 h-12 text-emerald-500 mb-6 ml-auto" />
          <h1 className="text-5xl font-black uppercase tracking-tighter leading-tight mb-4 text-transparent bg-clip-text bg-gradient-to-bl from-white to-white/50">
            Junte-se à <br/> <span className="text-emerald-500">Inteligência</span>.
          </h1>
          <p className="text-lg font-medium text-white/60 leading-relaxed">Credencie-se no sistema para monitorar a Câmara, o Senado e dominar as estratégias eleitorais baseadas em fatos.</p>
        </div>
      </div>

      {/* Form Section - Left Side */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#050505] relative overflow-y-auto">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/10 via-transparent to-transparent opacity-50"></div>
        
        <div className="w-full max-w-md relative z-10 py-12">
          <div className="md:hidden flex items-center gap-3 mb-12">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-white/10">
              <Image src="/logo.jpg" alt="Logo" fill className="object-cover" />
            </div>
            <span className="font-black text-xl uppercase tracking-widest text-white">Olho de Águia</span>
          </div>
          
          <h2 className="text-3xl font-black uppercase mb-8 text-white">Criar Credencial</h2>
          
          {error && (
            <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 font-medium flex items-center gap-3 text-sm backdrop-blur-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
            </div>
          )}

          {success ? (
            <div className="mb-6 p-8 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold rounded-2xl flex flex-col items-center gap-4 text-center backdrop-blur-sm">
              <CheckCircle2 className="w-16 h-16" /> 
              <span>Credencial criada com sucesso! <br/>Redirecionando para o acesso restrito...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-white/50">Nome de Agente/Equipe</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-white/20 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  placeholder="Seu Nome"
                />
              </div>
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
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-white/50">Confirmar Palavra-passe</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder-white/20 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 bg-white text-black text-lg font-black uppercase p-4 rounded-2xl hover:bg-emerald-500 hover:text-white hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100 mt-8 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
              >
                {isLoading ? 'Registrando...' : 'Emitir Credencial'} <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          )}

          <p className="mt-8 text-sm font-medium text-white/40 text-center">
            Já possui autorização? <Link href="/login" className="font-bold text-emerald-500 hover:text-emerald-400 hover:underline underline-offset-4 transition-colors">Acessar Sistema</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
