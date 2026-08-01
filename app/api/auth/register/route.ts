import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'E-mail e senha são obrigatórios.' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Este e-mail já está cadastrado.' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: name ? { name } : undefined,
    });

    if (authError || !authData.user) {
      const message =
        authError?.message?.includes('already been registered') ||
        authError?.message?.includes('already registered')
          ? 'Este e-mail já está cadastrado.'
          : authError?.message || 'Não foi possível criar a conta.';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        id: authData.user.id,
        name,
        email,
        stripeSubscriptionStatus: 'pending',
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}