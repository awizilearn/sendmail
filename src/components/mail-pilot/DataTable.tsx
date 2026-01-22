
"use client";

import { useEffect, useState, useMemo } from 'react';
import { Download, CheckCircle2, Trash2 } from 'lucide-react';
import { useCollection, useMemoFirebase, useUser } from '@/firebase';
import { CollectionReference } from 'firebase/firestore';
import * as XLSX from 'xlsx';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CardDescription, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { MailRecipient } from '@/app/page';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { clearAllRecipients } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

type DataTableProps = {
  recipientsColRef: CollectionReference | null;
  onSelectionChange: (data: MailRecipient[]) => void;
  onHeadersLoaded: (headers: string[]) => void;
  selectedRow: MailRecipient | null;
  onRowSelect: (row: MailRecipient | null) => void;
};

export default function DataTable({ recipientsColRef, onSelectionChange, onHeadersLoaded, selectedRow, onRowSelect }: DataTableProps) {
  const memoizedQuery = useMemoFirebase(() => recipientsColRef, [recipientsColRef]);
  const { data: recipients, isLoading, error } = useCollection<MailRecipient>(memoizedQuery);
  const { user } = useUser();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set<string>());

  const headers = useMemo(() => {
    if (!recipients || recipients.length === 0) return [];
    return Object.keys(recipients[0]).filter(key => key !== 'id');
  }, [recipients]);

  useEffect(() => {
    if (recipients) {
        const allIds = new Set(recipients.map(r => r.id as string).filter(Boolean));
        setSelectedIds(allIds);
    } else {
        setSelectedIds(new Set());
    }
  }, [recipients]);

  useEffect(() => {
    if (recipients) {
        const selected = recipients.filter(r => selectedIds.has(r.id as string));
        onSelectionChange(selected);
    } else {
        onSelectionChange([]);
    }
  }, [selectedIds, recipients, onSelectionChange]);
  
  useEffect(() => {
    onHeadersLoaded(headers);
  }, [headers, onHeadersLoaded]);
  

  const handleClearData = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Utilisateur non authentifié.' });
      return;
    }
    setIsDeleting(true);
    const result = await clearAllRecipients(user.uid);
    if (result.success) {
      toast({
        title: 'Succès',
        description: 'Tous les destinataires ont été supprimés.',
        className: 'bg-green-100 dark:bg-green-900 border-green-400 dark:border-green-600'
      });
      onRowSelect(null);
    } else {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: result.message,
      });
    }
    setIsDeleting(false);
  };
  
  const handleExport = () => {
    if (!recipients) return;
    const worksheet = XLSX.utils.json_to_sheet(recipients);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Recipients");
    XLSX.writeFile(workbook, "recipients.xlsx");
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
        setSelectedIds(new Set(recipients?.map(r => r.id as string).filter(Boolean)));
    } else {
        setSelectedIds(new Set());
    }
  };

  const handleRowToggle = (rowId: string) => {
      setSelectedIds(prev => {
          const newSet = new Set(prev);
          if (newSet.has(rowId)) {
              newSet.delete(rowId);
          } else {
              newSet.add(rowId);
          }
          return newSet;
      });
  };

  const isAllSelected = recipients ? selectedIds.size === recipients.length && recipients.length > 0 : false;
  const isSomeSelected = recipients ? selectedIds.size > 0 && selectedIds.size < recipients.length : false;


  return (
    <div>
      <div className="flex justify-between items-start">
        <div>
          <CardTitle className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary p-2.5 rounded-lg flex items-center justify-center"><CheckCircle2 className="w-6 h-6"/></div>
              2. Vérifier les données
          </CardTitle>
          <CardDescription className="mt-2 pl-12">
              Sélectionnez les destinataires pour l'envoi, puis cliquez sur une ligne pour prévisualiser l'e-mail. Total: {recipients?.length ?? 0}.
          </CardDescription>
        </div>
        <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={!recipients || recipients.length === 0 || isDeleting}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Vider
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Êtes-vous sûr de vouloir continuer ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. Cela supprimera définitivement tous les destinataires de votre base de données.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearData} disabled={isDeleting}>
                    {isDeleting ? 'Suppression...' : 'Supprimer les données'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={!recipients || recipients.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Exporter
            </Button>
        </div>
      </div>
        <ScrollArea className="h-72 w-full rounded-md border mt-4">
            <Table>
                <TableHeader className="sticky top-0 bg-card shadow-sm z-10">
                    <TableRow>
                        <TableHead className="w-12">
                            <Checkbox
                                checked={isAllSelected ? true : isSomeSelected ? "indeterminate" : false}
                                onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                                aria-label="Select all"
                            />
                        </TableHead>
                        {isLoading && !recipients ? (
                            Array.from({ length: 5 }).map((_, i) => <TableHead key={`skel-head-${i}`}><Skeleton className="h-4 w-24" /></TableHead>)
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
                                <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                                {headers.length > 0 ? (
                                    headers.map(h => <TableCell key={h}><Skeleton className="h-4 w-full" /></TableCell>)
                                ) : (
                                    Array.from({ length: 4 }).map((_, j) => <TableCell key={`skel-cell-${j}`}><Skeleton className="h-4 w-full" /></TableCell>)
                                )}
                            </TableRow>
                        ))
                    ) : error ? (
                        <TableRow>
                            <TableCell colSpan={headers.length + 1} className="text-center text-destructive">
                                Erreur: Impossible de charger les données.
                            </TableCell>
                        </TableRow>
                    ) : recipients?.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={headers.length + 1} className="text-center text-muted-foreground h-24">
                                Aucune donnée. Veuillez importer un fichier pour commencer.
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
                                data-state={selectedIds.has(row.id as string) ? 'selected' : ''}
                            >
                                <TableCell onClick={(e) => { e.stopPropagation(); }}>
                                    <Checkbox
                                        checked={selectedIds.has(row.id as string)}
                                        onCheckedChange={() => handleRowToggle(row.id as string)}
                                        aria-label="Select row"
                                    />
                                </TableCell>
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
