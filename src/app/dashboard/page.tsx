
'use client';

import { useMemo } from 'react';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CheckCircle, XCircle, Mail } from 'lucide-react';
import type { DeliveryLog } from '@/types/delivery-log';

const StatCard = ({ title, value, icon, isLoading }: { title: string, value: number, icon: React.ReactNode, isLoading: boolean }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <Skeleton className="h-8 w-1/2" />
      ) : (
        <div className="text-2xl font-bold">{value}</div>
      )}
    </CardContent>
  </Card>
);


export default function DashboardPage() {
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

  const stats = useMemo(() => {
    if (!logs) return { total: 0, delivered: 0, failed: 0 };
    return {
      total: logs.length,
      delivered: logs.filter(log => log.status === 'Delivered').length,
      failed: logs.filter(log => log.status === 'Failed').length,
    };
  }, [logs]);

  return (
    <DashboardLayout>
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Rapports</p>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de bord des envois</h1>
        </div>
      </header>

      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Total des envois"
            value={stats.total}
            icon={<Mail className="h-4 w-4 text-muted-foreground" />}
            isLoading={isLoadingLogs}
          />
          <StatCard
            title="E-mails délivrés"
            value={stats.delivered}
            icon={<CheckCircle className="h-4 w-4 text-green-500" />}
            isLoading={isLoadingLogs}
          />
          <StatCard
            title="E-mails échoués"
            value={stats.failed}
            icon={<XCircle className="h-4 w-4 text-red-500" />}
            isLoading={isLoadingLogs}
          />
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Historique des envois</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Statut</TableHead>
                    <TableHead>Bénéficiaire</TableHead>
                    <TableHead>Formateur</TableHead>
                    <TableHead>Date du RDV</TableHead>
                    <TableHead className="text-right">Date d'envoi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingLogs ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={`skel-${i}`}>
                        <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                        <TableCell><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-4 w-48" /></div></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-4 w-24" /></TableCell>
                      </TableRow>
                    ))
                  ) : !logs || logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        Aucun e-mail n'a encore été envoyé.
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map(log => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Badge variant={log.status === 'Delivered' ? 'default' : 'destructive'} className={log.status === 'Delivered' ? 'bg-green-600 hover:bg-green-700' : ''}>
                            {log.status === 'Delivered' ? 'Délivré' : 'Échoué'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage />
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
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {format(parseISO(log.sentAt), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
