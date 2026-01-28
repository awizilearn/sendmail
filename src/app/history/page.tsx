
'use client';

import { useMemo } from 'react';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { DeliveryLog } from '@/types/delivery-log';

export default function HistoryPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const deliveryLogsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, 'delivery-logs'),
            where('ownerId', '==', user.uid),
            orderBy('sentAt', 'desc')
        );
    }, [user, firestore]);

    const { data: logs, isLoading: isLoadingLogs } = useCollection<DeliveryLog>(deliveryLogsQuery);
    
    const formattedLogs = useMemo(() => {
        if (!logs) return [];
        return logs.map(log => ({
            ...log,
            sentAtFormatted: format(new Date(log.sentAt), "d MMM yyyy 'à' HH:mm", { locale: fr }),
            statusBadge: log.status === 'Delivered' ? (
                <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 border-green-200 dark:border-green-600/50">
                    Envoyé
                </Badge>
            ) : (
                <Badge variant="destructive">Échoué</Badge>
            )
        }));
    }, [logs]);

    return (
        <DashboardLayout>
            <header className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-muted-foreground">Historique</p>
                    <h1 className="text-3xl font-bold tracking-tight">Journaux d'envoi</h1>
                </div>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Envois récents</CardTitle>
                    <CardDescription>
                        Liste de tous les e-mails envoyés via l'application.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="w-full overflow-auto rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[250px]">Bénéficiaire</TableHead>
                                    <TableHead>Formateur</TableHead>
                                    <TableHead>Date du RDV</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead className="text-right">Date d'envoi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingLogs ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={`skel-${i}`}>
                                            <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-5 w-28 ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : formattedLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            Aucun journal d'envoi trouvé.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    formattedLogs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback>{log.beneficiary.initials}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium">{log.beneficiary.name}</div>
                                                        <div className="text-xs text-muted-foreground">{log.beneficiary.email}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{log.trainer}</TableCell>
                                            <TableCell className="text-muted-foreground">{log.date}</TableCell>
                                            <TableCell>{log.statusBadge}</TableCell>
                                            <TableCell className="text-right text-muted-foreground text-xs">{log.sentAtFormatted}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </DashboardLayout>
    );
}
