"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, Wand2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { getAIGeneratedMessage } from '@/app/actions';
import EmailPreview from './EmailPreview';
import type { MailRecipient } from '@/app/page';

const formSchema = z.object({
  subject: z.string().min(1, 'Subject is required.'),
  body: z.string().min(1, 'Email body is required.'),
});

type EmailComposerProps = {
  selectedRecipient: MailRecipient | null;
  headers: string[];
};

export default function EmailComposer({ selectedRecipient, headers }: EmailComposerProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: `Confirmation de votre rendez-vous avec {{Formateur/Formatrice}} votre formateur {{PLATEFORME}}`,
      body: `Bonjour {{Civilité}} {{Bénéficiare}},\n\nNous vous confirmons votre prochain rendez-vous pour la continuité de votre formation : {{Formation}}.\n\nLe rendez-vous est prévu pour le {{Date du RDV}} à {{Heure RDV}}.\n\nVeuillez tenir informé votre formateur ou formatrice en cas d'empêchement.\n\nCordialement,\nL'équipe de formation`,
    },
  });

  useEffect(() => {
    // Reset form if recipient is cleared
    if (!selectedRecipient) {
        form.reset();
    }
  }, [selectedRecipient, form]);

  const subject = form.watch('subject');
  const body = form.watch('body');

  const insertVariable = (variable: string) => {
    const textarea = document.querySelector('textarea[name="body"]') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentBody = form.getValues('body');
    const newBody = `${currentBody.substring(0, start)}{{${variable}}}${currentBody.substring(end)}`;
    
    form.setValue('body', newBody, { shouldValidate: true });

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
        title: 'No Recipient Selected',
        description: 'Please select a recipient to generate a personalized message.',
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
        const currentBody = form.getValues('body');
        form.setValue('body', currentBody + '\n\n' + result.message, { shouldValidate: true });
        toast({
          title: 'AI Suggestion Added',
          description: 'A new paragraph has been added to the email body.',
          className: 'bg-green-100 dark:bg-green-900 border-green-400 dark:border-green-600'
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        variant: 'destructive',
        title: 'AI Generation Failed',
        description: errorMessage,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="h-full shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <div className="bg-primary/10 text-primary p-2 rounded-lg"><Mail className="w-5 h-5"/></div>
            3. Compose & Preview
        </CardTitle>
        <CardDescription className="pl-12">
            Craft your email template. Use variables from the dropdown to personalize for each recipient.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6">
          <Form {...form}>
            <form className="space-y-4">
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="Email subject" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Body</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Email body..." className="min-h-[200px] text-sm leading-relaxed" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleGenerateAI} disabled={isGenerating || !selectedRecipient} size="sm">
              <Wand2 className={`mr-2 h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
              Generate with AI
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Insert Variable:</span>
              <Select onValueChange={insertVariable}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Select variable" />
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
            <h3 className="text-lg font-semibold mb-2">Email Preview</h3>
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
