'use server';

import { generateConfirmationMessage, type ConfirmationMessageInput } from '@/ai/flows/confirmation-message-generation';

export async function getAIGeneratedMessage(input: ConfirmationMessageInput): Promise<{success: boolean; message: string;}> {
    try {
        const result = await generateConfirmationMessage(input);
        return { success: true, message: result.confirmationMessage };
    } catch (error) {
        console.error('AI message generation failed:', error);
        return { success: false, message: 'Failed to generate message from AI. Please try again.' };
    }
}
