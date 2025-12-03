import Constants from 'expo-constants';

// Point to your local backend (use your machine's IP if testing on physical device)
// For Android Emulator, use 'http://10.0.2.2:3000'
// For iOS Simulator, use 'http://localhost:3000'
const BACKEND_URL = 'http://192.168.203.142:3000/api/loan-assistant';

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

