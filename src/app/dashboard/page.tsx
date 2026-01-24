
'use client';

import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DeliveryLog } from "@/types/delivery-log";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Search, Calendar, Download, Mail as MailIcon, CheckCircle2, AlertCircle, MoreVertical, Filter, Lightbulb, Bell, Moon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";


const getStatusAction = (status: string) => {
    switch (status) {
        case 'Failed':
        case 'Delivered':
            return 'Renvoyer';
        default:
            return '';
    }
}

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'Delivered':
            return <div className="inline-flex items-center gap-1.5 text-xs font-medium text-green-800 bg-green-100 rounded-full px-2 py-0.5"><span className="h-2 w-2 rounded-full bg-green-500"></span>Livré</div>;
        case 'Failed':
            return <div className="inline-flex items-center gap-1.5 text-xs font-medium text-red-800 bg-red-100 rounded-full px-2 py-0.5"><span className="h-2 w-2 rounded-full bg-red-500"></span>Échoué</div>;
        default:
            return null;
    }
}

export default function DashboardPage() {
    const { toast } = useToast();
    const [deliveryLogs, setDeliveryLogs] = useState<DeliveryLog[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        try {
            const savedLogs = localStorage.getItem('deliveryLogs');
            if (savedLogs) {
                setDeliveryLogs(JSON.parse(savedLogs));
            }
        } catch (error) {
            console.error("Failed to load delivery logs from localStorage", error);
            toast({
                variant: 'destructive',
                title: 'Erreur de chargement',
                description: 'Impossible de charger les journaux d\'envoi.',
            });
        }
    }, [toast]);

    const stats = useMemo(() => {
        const total = deliveryLogs.length;
        const delivered = deliveryLogs.filter(log => log.status === 'Delivered').length;
        const failed = deliveryLogs.filter(log => log.status === 'Failed').length;
        const deliveredRate = total > 0 ? (delivered / total) * 100 : 0;
        return { total, delivered, failed, deliveredRate };
    }, [deliveryLogs]);

    const paginatedLogs = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return deliveryLogs.slice(startIndex, startIndex + itemsPerPage);
    }, [deliveryLogs, currentPage]);

    const totalPages = Math.ceil(deliveryLogs.length / itemsPerPage);

    return (
        <DashboardLayout>
            <header className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Suivi des envois</h1>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Rechercher des bénéficiaires..." className="pl-9 bg-white" />
                    </div>
                    <Button variant="ghost" size="icon"><Bell className="h-5 w-5"/></Button>
                    <Button variant="ghost" size="icon"><Moon className="h-5 w-5"/></Button>
                </div>
            </header>

            <div className="space-y-8">
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h2 className="text-xl font-semibold">Performance des envois</h2>
                            <p className="text-sm text-muted-foreground">Statut en temps réel des notifications de rendez-vous automatisées.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button variant="outline" className="flex items-center gap-2 bg-white">
                                <Calendar className="h-4 w-4" />
                                <span>Oct 1 - Oct 31, 2023</span>
                            </Button>
                            <Button>
                                <Download className="mr-2 h-4 w-4" />
                                Exporter le rapport
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Card className="bg-white">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Total Envoyés</CardTitle>
                                <MailIcon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.total}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-white">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Livrés</CardTitle>
                                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.delivered}</div>
                                <p className="text-xs text-muted-foreground">{stats.deliveredRate.toFixed(1)}% de réussite</p>
                            </CardContent>
                        </Card>
                         <Card className="bg-white">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Échoués</CardTitle>
                                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Card className="bg-white">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Journaux d'envoi détaillés</CardTitle>
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
                                    <TableHead>BÉNÉFICIAIRE</TableHead>
                                    <TableHead>FORMATEUR</TableHead>
                                    <TableHead>DATE DU RDV</TableHead>
                                    <TableHead>STATUT</TableHead>
                                    <TableHead className="text-right">ACTIONS</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedLogs.map((log) => (
                                    <TableRow key={log.id}>
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
                            <span>Affichage de {(currentPage - 1) * itemsPerPage + 1} à {Math.min(currentPage * itemsPerPage, deliveryLogs.length)} sur {deliveryLogs.length} résultats</span>
                            <div className="flex items-center gap-1">
                                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>{"<"}</Button>
                                <span className="px-2">Page {currentPage} sur {totalPages > 0 ? totalPages : 1}</span>
                                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>{">"}</Button>
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
                                <h3 className="font-semibold">Améliorer la délivrabilité</h3>
                                <p className="text-sm text-muted-foreground">{stats.failed} e-mails en échec détectés. La plupart des échecs se produisent sur les domaines "example.com". Vérifiez vos enregistrements DNS SPF/DKIM dans le Hub d'automatisation.</p>
                            </div>
                       </div>
                       <Button variant="outline" className="bg-white">Configurer les règles d'e-mail</Button>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
