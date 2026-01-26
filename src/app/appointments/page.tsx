'use client';

import { useMemo } from 'react';
import { collection, query, where } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { MailRecipient } from '@/types/mail-recipient';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar as CalendarIcon, Clock, User as UserIcon, Briefcase } from 'lucide-react';
import { format, parse } from 'date-fns';
import { fr } from 'date-fns/locale';

// Helper to group recipients by date
const groupAppointmentsByDate = (recipients: MailRecipient[]) => {
  if (!recipients) return {};

  return recipients.reduce((acc, recipient) => {
    const dateStr = recipient['Date du RDV'] as string;
    if (!dateStr) return acc;
    
    const dateKey = dateStr; 

    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(recipient);
    return acc;
  }, {} as Record<string, MailRecipient[]>);
};

export default function AppointmentsPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const recipientsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, 'recipients'), 
            where('ownerId', '==', user.uid)
        );
    }, [user, firestore]);

    const { data: recipients, isLoading: isLoadingRecipients } = useCollection<MailRecipient>(recipientsQuery);

    const groupedAppointments = useMemo(() => {
        if (!recipients) return {};
        const grouped = groupAppointmentsByDate(recipients);
        
        const sortedDateKeys = Object.keys(grouped).sort((a, b) => {
            const dateA = parse(a, 'dd/MM/yyyy', new Date());
            const dateB = parse(b, 'dd/MM/yyyy', new Date());
            return dateA.getTime() - dateB.getTime();
        });

        const sortedGroupedAppointments: Record<string, MailRecipient[]> = {};
        for (const key of sortedDateKeys) {
            sortedGroupedAppointments[key] = grouped[key];
        }

        return sortedGroupedAppointments;

    }, [recipients]);

    const getInitials = (name?: string | number) => {
        if (typeof name !== 'string' || !name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <DashboardLayout>
            <header>
                <h1 className="text-3xl font-bold tracking-tight">Rendez-vous</h1>
                <p className="text-muted-foreground">Consultez et gérez vos rendez-vous à venir importés depuis Excel.</p>
            </header>

            <div className="space-y-8">
                {isLoadingRecipients ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <Card key={`skel-day-${i}`} className="p-4">
                            <CardContent className="p-0">
                                <Skeleton className="h-6 w-48 mb-4" />
                                <div className="space-y-4">
                                    {Array.from({ length: 2 }).map((_, j) => (
                                        <div key={`skel-appt-${j}`} className="flex items-center gap-4 p-3 rounded-lg border">
                                            <Skeleton className="h-10 w-10 rounded-full" />
                                            <div className="grid gap-1 flex-1">
                                                <Skeleton className="h-4 w-1/2" />
                                                <Skeleton className="h-3 w-1/4" />
                                            </div>
                                            <div className="grid gap-1 text-sm text-right">
                                                <Skeleton className="h-4 w-24" />
                                                <Skeleton className="h-3 w-32" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : Object.keys(groupedAppointments).length === 0 ? (
                    <Card className="flex flex-col items-center justify-center text-center p-12">
                        <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold">Aucun rendez-vous trouvé</h3>
                        <p className="text-muted-foreground">Importez un fichier Excel sur la page "Imports Excel" pour commencer.</p>
                    </Card>
                ) : (
                    Object.entries(groupedAppointments).map(([dateStr, appointments]) => {
                         const date = parse(dateStr, 'dd/MM/yyyy', new Date());
                         const formattedDate = format(date, "EEEE d MMMM yyyy", { locale: fr });
                         
                         return (
                            <div key={dateStr}>
                                <h2 className="text-xl font-semibold mb-4 capitalize flex items-center gap-2">
                                    <CalendarIcon className="h-5 w-5 text-primary" />
                                    {formattedDate}
                                </h2>
                                <div className="space-y-4">
                                    {appointments.map(appt => (
                                        <Card key={appt.id} className="hover:shadow-md transition-shadow">
                                            <CardContent className="p-4 flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <Avatar>
                                                        <AvatarFallback>{getInitials(appt['Bénéficiare'])}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-semibold">{String(appt['Bénéficiare'] || 'N/A')}</p>
                                                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                                            <Briefcase className="h-3 w-3" />
                                                            {String(appt['Formation'] || 'Formation non spécifiée')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium flex items-center justify-end gap-1.5">
                                                        <Clock className="h-4 w-4" />
                                                        {`${appt['Heure RDV']} - ${appt['Fin RDV']}`}
                                                    </p>
                                                     <p className="text-sm text-muted-foreground flex items-center justify-end gap-1.5">
                                                        <UserIcon className="h-3 w-3" />
                                                        {String(appt['Formateur/Formatrice'] || 'N/A')}
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                         )
                    })
                )}
            </div>
        </DashboardLayout>
    );
}
