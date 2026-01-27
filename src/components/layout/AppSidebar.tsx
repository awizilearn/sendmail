
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from "firebase/auth";
import { useUser, useAuth } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { Upload, LogOut, LayoutDashboard, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePathname } from 'next/navigation';

const NsConseilLogo = () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1.5" y="1.5" width="29" height="29" rx="4" fill="hsl(var(--primary))"/>
        <g transform="translate(0 -2)">
            <path d="M16 4L26 16L16 28L6 16L16 4Z" stroke="hsl(var(--primary-foreground))" strokeWidth="2"/>
            <text x="16" y="18.5" textAnchor="middle" dy=".3em" fontSize="11" fontWeight="bold" fill="hsl(var(--primary))">TCP</text>
        </g>
    </svg>
);

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
    { href: "/dashboard", icon: LayoutDashboard, label: "Tableau de bord" },
    { href: "/", icon: Upload, label: "Imports Excel" },
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
        <aside className="hidden w-64 flex-col border-r bg-white p-4 sm:flex">
            <div className="flex items-center gap-3 mb-8">
                <NsConseilLogo />
                <div className="flex flex-col">
                    <h1 className="text-lg font-bold text-primary">
                        Training Center Pro
                    </h1>
                    <p className="text-xs text-muted-foreground">Automation Suite</p>
                </div>
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
                                <AvatarFallback>{getInitials(user.email, user.displayName || "Compte Admin")}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col items-start text-left">
                                <p className="text-sm font-medium leading-none">
                                Compte Admin
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
