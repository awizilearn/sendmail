'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/mail-pilot/Header';
import { EmailSignUpForm } from '@/components/auth/EmailSignUpForm';

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
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
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
    </div>
  );
}
