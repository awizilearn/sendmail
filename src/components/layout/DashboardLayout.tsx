
'use client';

import { useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useUser } from "@/firebase";
import AppSidebar from "./AppSidebar";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <AppSidebar />
      <main className="flex flex-1 flex-col p-4 md:p-8 space-y-8 overflow-auto">
        <div className="flex-grow">
          {children}
        </div>
        <footer className="text-center text-sm text-muted-foreground py-4 border-t">
          Copyright © 2025 | <a href="https://mbl-service.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">mbl-service.com</a>
        </footer>
      </main>
    </div>
  );
}
