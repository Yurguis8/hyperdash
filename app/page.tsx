'use client';

import React from 'react';
import { ArrowRight, Check } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans antialiased selection:bg-neutral-900 selection:text-white">
      {/* Navbar Minimal */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-neutral-900 rounded flex items-center justify-center text-white font-semibold text-xs">
              M
            </div>
            <span className="font-semibold text-sm tracking-tight text-neutral-900">
              HyperPanel
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a href="/login" className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors">
              Entrar
            </a>
            <a href="/register" className="px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-all active:scale-[0.98]">
              Criar Conta
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section stark & corporativa */}
      <section className="pt-40 pb-32 px-6 flex flex-col items-center text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <h1 className="text-5xl md:text-7xl font-semibold tracking-tighter text-neutral-900 leading-[1.05]">
            Dados complexos.<br />
            <span className="text-neutral-400">Design simples.</span>
          </h1>
          <p className="text-lg text-neutral-500 max-w-xl mx-auto leading-relaxed">
            Conecte sua conta do Meta Ads em segundos. Visualize performance e exporte relatórios profissionais através de uma interface desenhada para produtividade.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <a href="/register" className="w-full sm:w-auto px-6 py-3 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
              Começar agora <ArrowRight className="w-4 h-4" />
            </a>
            <a href="#pricing" className="w-full sm:w-auto px-6 py-3 bg-white text-neutral-900 text-sm font-medium rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-all flex items-center justify-center active:scale-[0.98]">
              Ver planos
            </a>
          </div>
        </div>
      </section>

      {/* Pricing Section Clean */}
      <section id="pricing" className="py-32 px-6 bg-[#FAFAFA] border-t border-neutral-100">
        <div className="max-w-sm mx-auto">
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">Simples e transparente</h2>
            <p className="text-sm text-neutral-500">Sem surpresas. Acesso total às ferramentas.</p>
          </div>

          <div className="p-8 rounded-2xl bg-white border border-neutral-200 shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
            <div className="border-b border-neutral-100 pb-6 mb-6">
              <h3 className="text-lg font-medium tracking-tight text-neutral-900 mb-2">Pro</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tighter text-neutral-900">R$ 47</span>
                <span className="text-sm text-neutral-500">/mês</span>
              </div>
            </div>
            
            <ul className="space-y-4 mb-8">
              {['Contas Ilimitadas', 'Métricas em Tempo Real', 'Exportação para Excel', 'Suporte Prioritário'].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-neutral-600">
                  <Check className="w-4 h-4 text-neutral-900" /> {item}
                </li>
              ))}
            </ul>

            <a href="/register" className="block w-full py-3 px-4 rounded-lg text-sm font-medium text-center bg-neutral-900 text-white hover:bg-neutral-800 transition-all active:scale-[0.98]">
              Assinar Plano
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}