import { buildApiUrl } from '@/services/api/config';

const BACKEND_URL = buildApiUrl('/api/loan-assistant');

export type LoanAssistantMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export interface LoanContext {
  beneficiaryName?: string;
  loanAmount?: number;
  bankName?: string;
}

export const loanAssistantClient = {
  async sendMessage(messages: LoanAssistantMessage[], context: LoanContext) {
    
    const payload = {
      messages,
      context
    };

    try {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Backend API request failed');
      }

      const data = await response.json();
      
      if (!data.content) {
        throw new Error('Backend returned an empty response.');
      }

      return data.content;
    } catch (error) {
      console.error("Loan Assistant Error:", error);
      throw error;
    }
  },
};

