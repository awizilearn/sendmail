"use client";

import { Download, List } from 'lucide-react';
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

type DataTableProps = {
  data: MailRecipient[];
  headers: string[];
  selectedRow: MailRecipient | null;
  onRowSelect: (row: MailRecipient) => void;
  onExport: () => void;
};

export default function DataTable({ data, headers, selectedRow, onRowSelect, onExport }: DataTableProps) {
  return (
    <div>
      <div className="flex justify-between items-start">
        <div>
          <CardTitle className="flex items-center gap-2">
              <div className="bg-primary/10 text-primary p-2 rounded-lg"><List className="w-5 h-5"/></div>
              2. Review Data
          </CardTitle>
          <CardDescription className="mt-2 pl-12">
              Select a recipient from the list to preview their personalized email. Total: {data.length} recipients.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={onExport} disabled={data.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export to Excel
        </Button>
      </div>
        <ScrollArea className="h-72 w-full rounded-md border mt-4">
            <Table>
                <TableHeader className="sticky top-0 bg-card shadow-sm">
                    <TableRow>
                        {headers.map((header) => (
                            <TableHead key={header} className="whitespace-nowrap font-semibold">{header}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((row, rowIndex) => (
                        <TableRow
                            key={rowIndex}
                            onClick={() => onRowSelect(row)}
                            className={cn(
                                'cursor-pointer',
                                selectedRow && JSON.stringify(row) === JSON.stringify(selectedRow) ? 'bg-accent/20 hover:bg-accent/30' : ''
                            )}
                            aria-selected={selectedRow && JSON.stringify(row) === JSON.stringify(selectedRow)}
                        >
                            {headers.map((header) => (
                                <TableCell key={header} className="whitespace-nowrap text-sm">
                                    {String(row[header])}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </ScrollArea>
    </div>
  );
}
