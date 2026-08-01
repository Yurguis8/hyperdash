import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();

    // 1. Cria a sessão do Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: 'MetaDash Pro - Assinatura Mensal',
              description: 'Acesso completo ao painel de métricas e exportação de relatórios.',
            },
            unit_amount: 4700, // R$ 47,00 em centavos
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      customer_email: email,
      success_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard?payment=success`,
      cancel_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/register?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Erro no Stripe Checkout:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}