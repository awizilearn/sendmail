
"use client";

import { useState } from 'react';
import { Wand2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { getAIGeneratedMessage } from '@/app/actions';
import EmailPreview from './EmailPreview';
import type { MailRecipient } from '@/types/mail-recipient';

type EmailComposerProps = {
  selectedRecipient: MailRecipient | null;
  headers: string[];
  subject: string;
  onSubjectChange: (subject: string) => void;
  body: string;
  onBodyChange: (body: string) => void;
};

export default function EmailComposer({ 
  selectedRecipient, 
  headers,
  subject,
  onSubjectChange,
  body,
  onBodyChange
}: EmailComposerProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const insertVariable = (variable: string) => {
    const textarea = document.querySelector('textarea#email-body') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentBody = body;
    const newBody = `${currentBody.substring(0, start)}{{${variable}}}${currentBody.substring(end)}`;
    
    onBodyChange(newBody);

    // Move cursor after inserted variable
    setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + variable.length + 4;
        textarea.focus();
    }, 0);
  };

  const handleGenerateAI = async () => {
    if (!selectedRecipient) {
      toast({
        variant: 'destructive',
        title: 'Aucun destinataire sélectionné',
        description: 'Veuillez sélectionner un destinataire pour générer un message personnalisé.',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const input = {
        recipientName: String(selectedRecipient['Bénéficiare'] || ''),
        eventName: String(selectedRecipient['Formation'] || 'formation'),
        eventType: String(selectedRecipient['Type de RDV'] || 'rendez-vous'),
        eventDate: `${selectedRecipient['Date du RDV'] || ''} at ${selectedRecipient['Heure RDV'] || ''}`,
        trainerName: String(selectedRecipient['Formateur/Formatrice'] || ''),
      };

      const result = await getAIGeneratedMessage(input);
      if (result.success) {
        onBodyChange(body + '\n\n' + result.message);
        toast({
          title: 'Suggestion IA ajoutée',
          description: "Un nouveau paragraphe a été ajouté au corps de l'e-mail.",
          className: 'bg-green-100 dark:bg-green-900 border-green-400 dark:border-green-600'
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        variant: 'destructive',
        title: 'La génération par IA a échoué',
        description: errorMessage,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-2xl">Composer & Prévisualiser</CardTitle>
        <CardDescription>
            Étape 3 sur 4 : Créez votre modèle d'e-mail. Utilisez des variables pour personnaliser chaque destinataire.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-subject">Sujet</Label>
                <Input 
                  id="email-subject" 
                  placeholder="Sujet de l'e-mail" 
                  value={subject}
                  onChange={(e) => onSubjectChange(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-body">Corps de l'e-mail</Label>
                <Textarea 
                  id="email-body"
                  placeholder="Corps de l'e-mail..." 
                  className="min-h-[200px] text-sm leading-relaxed" 
                  value={body}
                  onChange={(e) => onBodyChange(e.target.value)}
                />
              </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleGenerateAI} disabled={isGenerating || !selectedRecipient} size="sm">
              <Wand2 className={`mr-2 h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
              Générer avec l'IA
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Insérer une variable :</span>
              <Select onValueChange={insertVariable}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {headers.map((header) => (
                    <SelectItem key={header} value={header}>
                      {header}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-2">Aperçu de l'e-mail</h3>
            <EmailPreview 
              subject={subject} 
              body={body} 
              data={selectedRecipient} 
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
