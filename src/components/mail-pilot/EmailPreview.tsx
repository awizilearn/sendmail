
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { MailRecipient } from '@/types/mail-recipient';
import { replacePlaceholders } from '@/lib/placeholder-replacer';

type EmailPreviewProps = {
  subject: string;
  body: string;
  data: MailRecipient | null;
};

export default function EmailPreview({ subject, body, data }: EmailPreviewProps) {
  const previewSubject = replacePlaceholders(subject, data);
  const previewBody = replacePlaceholders(body, data).replace(/\n/g, '<br />');

  return (
    <Card className="bg-accent/10 border-accent/30">
      <CardHeader className="p-4">
        <div className="text-sm font-normal">
          <span className="font-semibold text-muted-foreground">Sujet: </span>{previewSubject}
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="p-4 text-sm min-h-[150px]">
        {data ? (
          <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: previewBody }} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-center">Sélectionnez un destinataire pour voir un aperçu.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
