
'use client';

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { signOut } from "firebase/auth";
import { LayoutDashboard, Upload, Mail, Users, Settings, LogOut, Bell, Moon, Search, Calendar, Download, Mail as MailIcon, CheckCircle2, AlertCircle, MailOpen, MoreVertical, Filter, Lightbulb } from "lucide-react";
import { useUser, useAuth } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

const NsConseilLogo = () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1.5" y="1.5" width="29" height="29" rx="4" fill="hsl(var(--primary))"/>
        <g transform="translate(0 -2)">
            <path d="M16 4L26 16L16 28L6 16L16 4Z" stroke="hsl(var(--primary-foreground))" strokeWidth="2"/>
            <text x="16" y="18.5" textAnchor="middle" dy=".3em" fontSize="11" fontWeight="bold" fill="hsl(var(--primary))">TH</text>
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

const deliveryLogs = [
  { beneficiary: { name: 'Santo SAMMARTINO', email: 'santo.sam@example.com', initials: 'SS' }, trainer: 'Marc Dupont', date: 'Oct 25, 2023, 14:00', status: 'Delivered' },
  { beneficiary: { name: 'Richard JACQUET', email: 'r.jacquet@domain.net', initials: 'RJ' }, trainer: 'Elena Rossi', date: 'Oct 25, 2023, 09:30', status: 'Failed' },
  { beneficiary: { name: 'Alice MOREAU', email: 'a.moreau@service.com', initials: 'AM' }, trainer: 'Marc Dupont', date: 'Oct 24, 2023, 16:15', status: 'Opened' },
  { beneficiary: { name: 'Benoit LEFEBVRE', email: 'blefebvre@outlook.fr', initials: 'BL' }, trainer: 'Sophie Martin', date: 'Oct 24, 2023, 11:00', status: 'Delivered' },
  { beneficiary: { name: 'Catherine DUVAL', email: 'c.duval@training.org', initials: 'CD' }, trainer: 'Marc Dupont', date: 'Oct 23, 2023, 15:30', status: 'Bounced' },
];

const getStatusAction = (status: string) => {
    switch (status) {
        case 'Failed':
        case 'Delivered':
            return 'Resend';
        case 'Opened':
            return 'View History';
        case 'Bounced':
            return 'Update Email';
        default:
            return '';
    }
}

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'Delivered':
            return <div className="inline-flex items-center gap-1.5 text-xs font-medium text-green-800 bg-green-100 rounded-full px-2 py-0.5"><span className="h-2 w-2 rounded-full bg-green-500"></span>Delivered</div>;
        case 'Failed':
            return <div className="inline-flex items-center gap-1.5 text-xs font-medium text-red-800 bg-red-100 rounded-full px-2 py-0.5"><span className="h-2 w-2 rounded-full bg-red-500"></span>Failed</div>;
        case 'Opened':
            return <div className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-800 bg-blue-100 rounded-full px-2 py-0.5"><span className="h-2 w-2 rounded-full bg-blue-500"></span>Opened</div>;
        case 'Bounced':
            return <div className="inline-flex items-center gap-1.5 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full px-2 py-0.5"><span className="h-2 w-2 rounded-full bg-yellow-500"></span>Bounced</div>;
        default:
            return null;
    }
}


export default function DashboardPage() {
    const { user, isUserLoading } = useUser();
    const auth = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

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

    if (isUserLoading || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <p>Loading...</p>
            </div>
        );
    }
    
    const navLinks = [
        { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
        { href: "#", icon: Mail, label: "Email Logs" },
        { href: "/", icon: Upload, label: "Excel Import" },
        { href: "#", icon: Users, label: "Beneficiaries" },
    ];

    return (
        <div className="flex min-h-screen w-full bg-background text-foreground">
            <aside className="hidden w-64 flex-col border-r bg-white p-4 sm:flex">
                <div className="flex items-center gap-3 mb-8">
                    <NsConseilLogo />
                    <div className="flex flex-col">
                        <h1 className="text-lg font-bold text-primary">
                          TrainingHub
                        </h1>
                        <p className="text-xs text-muted-foreground">Automation Center</p>
                    </div>
                </div>
                <nav className="flex flex-col gap-2">
                    {navLinks.map(link => (
                        <NavLink key={link.href} href={link.href} active={link.href === '/dashboard'}>
                            <link.icon className="h-4 w-4" /> {link.label}
                        </NavLink>
                    ))}
                </nav>
                <div className="mt-auto">
                    <nav className="flex flex-col gap-2 mb-4">
                        <NavLink href="#"><Settings className="h-4 w-4" /> Settings</NavLink>
                    </nav>
                    {user && (
                        <div className="flex items-center gap-3 rounded-lg p-2">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={user.photoURL || "#"} alt="Avatar" />
                                <AvatarFallback>{getInitials(user.email, user.displayName || "Admin Account")}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col items-start text-left">
                                <p className="text-sm font-medium leading-none">
                                Admin Account
                                </p>
                                <p className="text-xs leading-none text-muted-foreground">
                                  Pro Plan
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </aside>
            <main className="flex-1 p-4 md:p-8 space-y-8 overflow-auto">
                <header className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight">Delivery Tracking</h1>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search beneficiaries..." className="pl-9 bg-white" />
                        </div>
                        <Button variant="ghost" size="icon"><Bell className="h-5 w-5"/></Button>
                        <Button variant="ghost" size="icon"><Moon className="h-5 w-5"/></Button>
                    </div>
                </header>

                <div className="space-y-8">
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-xl font-semibold">Delivery Performance</h2>
                                <p className="text-sm text-muted-foreground">Real-time status of automated appointment notifications.</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <Button variant="outline" className="flex items-center gap-2 bg-white">
                                    <Calendar className="h-4 w-4" />
                                    <span>Oct 1 - Oct 31, 2023</span>
                                </Button>
                                <Button>
                                    <Download className="mr-2 h-4 w-4" />
                                    Export Report
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Card className="bg-white">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
                                    <MailIcon className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">1,284</div>
                                    <p className="text-xs text-green-600">+12.5% from last month</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-white">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Delivered</CardTitle>
                                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">1,240</div>
                                    <p className="text-xs text-green-600">+10.2% reach rate</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-white">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Opened</CardTitle>
                                    <MailOpen className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">956</div>
                                    <p className="text-xs text-green-600">74.3% open rate</p>
                                </CardContent>
                            </Card>
                             <Card className="bg-white">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Failed</CardTitle>
                                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-red-600">44</div>
                                    <p className="text-xs text-red-600">-2.1% reduction</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <Card className="bg-white">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Detailed Delivery Logs</CardTitle>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon"><Filter className="h-4 w-4"/></Button>
                                    <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4"/></Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>BENEFICIARY</TableHead>
                                        <TableHead>TRAINER</TableHead>
                                        <TableHead>APPOINTMENT DATE</TableHead>
                                        <TableHead>STATUS</TableHead>
                                        <TableHead className="text-right">ACTIONS</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {deliveryLogs.map((log, index) => (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarFallback>{log.beneficiary.initials}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium">{log.beneficiary.name}</div>
                                                        <div className="text-sm text-muted-foreground">{log.beneficiary.email}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{log.trainer}</TableCell>
                                            <TableCell>{log.date}</TableCell>
                                            <TableCell>
                                                {getStatusBadge(log.status)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="link" className="p-0 h-auto text-primary">{getStatusAction(log.status)}</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                                <span>Showing 1 to 5 of 1,284 results</span>
                                <div className="flex items-center gap-1">
                                    <Button variant="outline" size="sm">{"<"}</Button>
                                    <Button variant="default" size="sm">1</Button>
                                    <Button variant="outline" size="sm">2</Button>
                                    <Button variant="outline" size="sm">3</Button>
                                    <Button variant="outline" size="sm">{">"}</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                        <CardContent className="p-6 flex items-center justify-between">
                           <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                                    <Lightbulb className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Improve Deliverability</h3>
                                    <p className="text-sm text-muted-foreground">44 failed emails detected. Most failures occur on "example.com" domains. Check your DNS SPF/DKIM records in the Automation Hub.</p>
                                </div>
                           </div>
                           <Button variant="outline" className="bg-white">Configure Email Rules</Button>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
