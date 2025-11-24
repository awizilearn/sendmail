
"use client";

import { useEffect } from 'react';
import { Download, CheckCircle2 } from 'lucide-react';
import { useCollection, useMemoFirebase } from '@/firebase';
import { CollectionReference } from 'firebase/firestore';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CardDescription, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { MailRecipient } from '@/app/page';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';

type DataTableProps = {
  recipientsColRef: CollectionReference;
  onDataLoaded: (data: MailRecipient[], headers: string[]) => void;
  selectedRow: MailRecipient | null;
  onRowSelect: (row: MailRecipient) => void;
  onExport: () => void;
};

export default function DataTable({ recipientsColRef, onDataLoaded, selectedRow, onRowSelect, onExport }: DataTableProps) {
  const memoizedQuery = useMemoFirebase(() => recipientsColRef, [recipientsColRef]);
  const { data: recipients, isLoading, error } = useCollection<MailRecipient>(memoizedQuery);

  const headers = recipients && recipients.length > 0
    ? Object.keys(recipients[0]).filter(key => key !== 'id')
    : [];

  useEffect(() => {
    onDataLoaded(recipients || [], headers);
  }, [recipients, headers, onDataLoaded]);


  return (
    <div>
      <div className="flex justify-between items-start">
        <div>
          <CardTitle className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary p-2.5 rounded-lg flex items-center justify-center"><CheckCircle2 className="w-6 h-6"/></div>
              2. Vérifier les données
          </CardTitle>
          <CardDescription className="mt-2 pl-12">
              Sélectionnez un destinataire dans la liste pour prévisualiser son e-mail personnalisé. Total: {recipients?.length ?? 0} destinataires.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={onExport} disabled={!recipients || recipients.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Exporter
        </Button>
      </div>
        <ScrollArea className="h-72 w-full rounded-md border mt-4">
            <Table>
                <TableHeader className="sticky top-0 bg-card shadow-sm z-10">
                    <TableRow>
                        {isLoading && !recipients ? (
                            <TableHead>Chargement...</TableHead>
                        ) : (
                            headers.map((header) => (
                                <TableHead key={header} className="whitespace-nowrap font-semibold bg-card">{header}</TableHead>
                            ))
                        )}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={`skeleton-${i}`}>
                                {headers.length > 0 ? (
                                    headers.map(h => <TableCell key={h}><Skeleton className="h-4 w-full" /></TableCell>)
                                ) : (
                                    <TableCell><Skeleton className="h-4 w-full" /></TableCell>
                                )}
                            </TableRow>
                        ))
                    ) : error ? (
                        <TableRow>
                            <TableCell colSpan={headers.length || 1} className="text-center text-destructive">
                                Erreur: Impossible de charger les données.
                            </TableCell>
                        </TableRow>
                    ) : recipients?.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={headers.length || 1} className="text-center text-muted-foreground">
                                Aucune donnée. Veuillez importer un fichier.
                            </TableCell>
                        </TableRow>
                    ) : (
                        recipients?.map((row, rowIndex) => (
                            <TableRow
                                key={row.id || rowIndex}
                                onClick={() => onRowSelect(row)}
                                className={cn(
                                    'cursor-pointer',
                                    selectedRow && row.id === selectedRow.id ? 'bg-accent/50 hover:bg-accent' : ''
                                )}
                                aria-selected={selectedRow && row.id === selectedRow.id}
                            >
                                {headers.map((header) => (
                                    <TableCell key={header} className="whitespace-nowrap text-sm">
                                        {String(row[header])}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </ScrollArea>
    </div>
  );
}
