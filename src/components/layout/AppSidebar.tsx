
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from "firebase/auth";
import { useUser, useAuth } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { Upload, LogOut, Settings, History } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePathname } from 'next/navigation';
import AppLogo from '../common/AppLogo';

const NavLink = ({ href, children, active = false }: { href: string; children: React.ReactNode; active?: boolean }) => (
  <Link
    href={href}
    className={cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-foreground transition-all hover:bg-accent hover:text-accent-foreground",
      active && "bg-accent text-accent-foreground font-semibold"
    )}
  >
    {children}
  </Link>
);

const navLinks = [
    { href: "/", icon: Upload, label: "Imports Excel" },
    { href: "/history", icon: History, label: "Historique d'envoi" },
    { href: "/settings", icon: Settings, label: "Paramètres E-mail" },
];

export default function AppSidebar() {
    const { user } = useUser();
    const auth = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();

    const handleLogout = async () => {
        if (auth) {
            await signOut(auth);
            toast({ title: "Déconnexion réussie", description: "Vous avez été déconnecté." });
            router.push('/login');
        }
    };

    const getInitials = (email?: string | null, name?: string | null) => {
        if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        if (email) return email.charAt(0).toUpperCase();
        return '?';
    };

    return (
        <aside className="hidden w-64 flex-col border-r bg-background p-4 sm:flex">
            <div className="mb-8">
                <AppLogo />
            </div>
            <nav className="flex flex-col gap-2">
                {navLinks.map(link => (
                    <NavLink key={link.label} href={link.href} active={pathname === link.href}>
                        <link.icon className="h-4 w-4" /> {link.label}
                    </NavLink>
                ))}
            </nav>
            <div className="mt-auto">
                {user && (
                    <div className="flex items-center justify-between gap-3 rounded-lg p-2">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={user.photoURL || "#"} alt="Avatar" />
                                <AvatarFallback>{getInitials(user.email, user.displayName || "envoi mail J-4")}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col items-start text-left">
                                <p className="text-sm font-medium leading-none">
                                envoi mail J-4
                                </p>
                                <p className="text-xs leading-none text-muted-foreground">
                                  Forfait Pro
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Se déconnecter">
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </div>
        </aside>
    );
}
