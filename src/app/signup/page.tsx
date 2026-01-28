'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmailSignUpForm } from '@/components/auth/EmailSignUpForm';

const NsConseilLogo = () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1.5" y="1.5" width="29" height="29" rx="4" fill="hsl(var(--primary))"/>
        <g transform="translate(0 -2)">
            <path d="M16 4L26 16L16 28L6 16L16 4Z" stroke="hsl(var(--primary-foreground))" strokeWidth="2"/>
            <text x="16" y="18.5" textAnchor="middle" dy=".3em" fontSize="11" fontWeight="bold" fill="hsl(var(--primary))">NS</text>
        </g>
    </svg>
);


export default function SignUpPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <p>Chargement...</p>
        </div>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div className="flex items-center gap-3 mb-8">
          <NsConseilLogo />
          <h1 className="text-3xl font-bold text-primary">NS CONSEIL</h1>
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Créer un compte</CardTitle>
          <CardDescription>
            Entrez votre e-mail ci-dessous pour créer votre compte.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <EmailSignUpForm />
          <p className="px-2 text-center text-sm text-muted-foreground">
            Vous avez déjà un compte ?{" "}
            <Link href="/login" className="underline underline-offset-4 hover:text-primary">
              Se connecter
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
