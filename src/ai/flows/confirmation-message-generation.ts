'use server';

/**
 * @fileOverview Dynamically generates confirmation email content based on event type and recipient data.
 *
 * - generateConfirmationMessage - A function that generates personalized confirmation email content.
 * - ConfirmationMessageInput - The input type for the generateConfirmationMessage function.
 * - ConfirmationMessageOutput - The return type for the generateConfirmationMessage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ConfirmationMessageInputSchema = z.object({
  recipientName: z.string().describe('The name of the recipient.'),
  eventName: z.string().describe('The name of the event.'),
  eventType: z.string().describe('The type of the event (e.g., training, meeting).'),
  eventDate: z.string().describe('The date and time of the event.'),
  trainerName: z.string().describe('The name of the trainer or facilitator.'),
});
export type ConfirmationMessageInput = z.infer<typeof ConfirmationMessageInputSchema>;

const ConfirmationMessageOutputSchema = z.object({
  confirmationMessage: z.string().describe('The personalized confirmation message.'),
});
export type ConfirmationMessageOutput = z.infer<typeof ConfirmationMessageOutputSchema>;

export async function generateConfirmationMessage(
  input: ConfirmationMessageInput
): Promise<ConfirmationMessageOutput> {
  return generateConfirmationMessageFlow(input);
}

const confirmationMessagePrompt = ai.definePrompt({
  name: 'confirmationMessagePrompt',
  input: {schema: ConfirmationMessageInputSchema},
  output: {schema: ConfirmationMessageOutputSchema},
  prompt: `You are an AI assistant designed to generate personalized confirmation messages for various events.

  Based on the event details and recipient information provided, create a confirmation message that sounds natural and avoids being too generic.

  Event Type: {{{eventType}}}
  Event Name: {{{eventName}}}
  Recipient Name: {{{recipientName}}}
  Event Date: {{{eventDate}}}
  Trainer Name: {{{trainerName}}}

  Generate a confirmation message that includes all the relevant details and sounds personalized.
  The confirmation message should contain a polite tone and helpful information. Do not include a greeting or signature.
  Be concise.
  `,
});

const generateConfirmationMessageFlow = ai.defineFlow(
  {
    name: 'generateConfirmationMessageFlow',
    inputSchema: ConfirmationMessageInputSchema,
    outputSchema: ConfirmationMessageOutputSchema,
  },
  async input => {
    const {output} = await confirmationMessagePrompt(input);
    return output!;
  }
);
