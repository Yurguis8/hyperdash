'use client';

import React, { useState } from 'react';
import { Check } from 'lucide-react';

export default function PricingPage() {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'user_123',
          email: 'cliente@exemplo.com',
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Erro ao redirecionar para o pagamento.');
      }
    } catch (err) {
      console.error(err);
      alert('Falha na comunicação com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-black flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-xl mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-3">Escolha seu plano</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Obtenha clareza total sobre o retorno de investimento (ROAS) dos seus anúncios no Meta Ads.
        </p>
      </div>

      <div className="bg-white dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
        <div className="absolute top-4 right-4 bg-[#0071E3]/10 text-[#0071E3] text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
          Mais Popular
        </div>

        <h2 className="text-2xl font-bold tracking-tight">Plano PRO</h2>
        <p className="text-xs text-slate-500 mt-1">Para gestores de tráfego, agências e e-commerces.</p>

        <div className="my-6">
          <span className="text-4xl font-extrabold">R$ 97</span>
          <span className="text-slate-500 font-medium"> / mês</span>
        </div>

        <ul className="space-y-3 mb-8 text-sm">
          <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
            <Check className="w-5 h-5 text-emerald-500" />
            Conexão direta via Meta Ads API
          </li>
          <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
            <Check className="w-5 h-5 text-emerald-500" />
            Dashboard com cálculo automático de ROAS, CTR, CPC e CPM
          </li>
          <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
            <Check className="w-5 h-5 text-emerald-500" />
            Exportação ilimitada de relatórios em Excel
          </li>
          <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
            <Check className="w-5 h-5 text-emerald-500" />
            Suporte prioritário
          </li>
        </ul>

        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full bg-[#0071E3] hover:bg-[#0077ED] text-white font-medium py-3.5 rounded-full text-sm transition-all shadow-md disabled:opacity-50 cursor-pointer"
        >
          {loading ? 'Carregando checkout...' : 'Assinar Agora'}
        </button>
      </div>
    </div>
  );
}