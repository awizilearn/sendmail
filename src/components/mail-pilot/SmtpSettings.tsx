"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Send, Settings, Loader2, MailCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CardDescription, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
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
import { sendTestEmail } from '@/app/actions';

const smtpSchema = z.object({
  host: z.string().min(1, 'Host is required'),
  port: z.coerce.number().min(1, 'Port is required'),
  user: z.string().min(1, 'Username is required').email('Invalid email address'),
  pass: z.string().min(1, 'Password is required'),
});

type SmtpSettingsProps = {
  recipientCount: number;
};

export default function SmtpSettings({ recipientCount }: SmtpSettingsProps) {
  const [isSending, setIsSending] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof smtpSchema>>({
    resolver: zodResolver(smtpSchema),
    defaultValues: {
      host: '',
      port: 587,
      user: '',
      pass: '',
    },
  });

  const handleSendTestEmail = async (values: z.infer<typeof smtpSchema>) => {
    setIsTesting(true);
    toast({
      title: 'Testing Connection...',
      description: 'Attempting to send a test email.',
    });

    const result = await sendTestEmail(values);

    if (result.success) {
      toast({
        title: 'Connection Verified',
        description: result.message,
        className: 'bg-green-100 dark:bg-green-900 border-green-400 dark:border-green-600',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Connection Failed',
        description: result.message,
      });
    }

    setIsTesting(false);
  };


  const handleSendEmails = async (values: z.infer<typeof smtpSchema>) => {
    setIsSending(true);

    toast({
      title: 'Sending Emails...',
      description: `Simulating sending to ${recipientCount} recipients.`,
    });
    
    // Simulate sending emails
    await new Promise(resolve => setTimeout(resolve, 2500));

    setIsSending(false);
    toast({
      title: 'Simulation Complete',
      description: `Emails would have been sent to ${recipientCount} recipients.`,
      className: 'bg-green-100 dark:bg-green-900 border-green-400 dark:border-green-600'
    });
  };

  return (
    <div>
      <CardTitle className="flex items-center gap-2">
          <div className="bg-primary/10 text-primary p-2 rounded-lg"><Settings className="w-5 h-5"/></div>
          4. Configure & Send
      </CardTitle>
      <CardDescription className="mt-2 pl-12">
        Configure your SMTP client to send the emails. Credentials are not stored.
      </CardDescription>
      <Form {...form}>
        <form className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField control={form.control} name="host" render={({ field }) => (
                <FormItem>
                  <FormLabel>SMTP Host</FormLabel>
                  <FormControl><Input placeholder="smtp.example.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="port" render={({ field }) => (
                <FormItem>
                  <FormLabel>Port</FormLabel>
                  <FormControl><Input type="number" placeholder="587" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="user" render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl><Input type="email" placeholder="your@email.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="pass" render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
                type="button" 
                variant="outline"
                onClick={form.handleSubmit(handleSendTestEmail)} 
                disabled={isTesting || isSending}
                className="w-full sm:w-auto"
            >
              {isTesting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <MailCheck className="mr-2 h-4 w-4" />
              )}
              Send Test Email
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" className="w-full flex-1" disabled={isSending || isTesting || recipientCount === 0}>
                  {isSending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Simulate Sending to {recipientCount > 0 ? recipientCount : ''} Recipients
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Email Sending Simulation</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will start a simulation of sending emails to all {recipientCount} recipients. No actual emails will be sent.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={form.handleSubmit(handleSendEmails)} disabled={isSending}>
                    {isSending ? 'Simulating...' : 'Proceed'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </form>
      </Form>
    </div>
  );
}
