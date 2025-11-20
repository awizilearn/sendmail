'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/mail-pilot/Header';

export default function LoginPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleSignIn = () => {
    if (auth) {
      initiateAnonymousSignIn(auth);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Welcome to Mail Pilot</CardTitle>
            <CardDescription>
              Sign in to manage your email campaigns.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSignIn} className="w-full" disabled={isUserLoading}>
              {isUserLoading ? 'Loading...' : 'Sign In Anonymously'}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
