'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegisterAndPay = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Erro ao iniciar pagamento. Verifique a configuração.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro na conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black p-4 font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      
      <div className="w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Criar conta
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Plano Pro — R$ 47/mês
          </p>
        </div>

        <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
          <form onSubmit={handleRegisterAndPay} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Nome
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-md text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-colors"
                placeholder="Seu nome"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-md text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-colors"
                placeholder="seu@email.com"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                Senha
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-transparent border border-zinc-200 dark:border-zinc-800 rounded-md text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-zinc-900 dark:bg-white text-white dark:text-black font-medium py-2 rounded-md text-sm hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processando...' : 'Assinar e Continuar'}
            </button>
          </form>
        </div>

        <p className="text-sm text-center text-zinc-500 dark:text-zinc-400 mt-6">
          Já tem uma conta?{' '}
          <Link href="/login" className="text-zinc-900 dark:text-zinc-100 font-medium hover:underline underline-offset-4">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}