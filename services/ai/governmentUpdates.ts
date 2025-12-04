import { buildApiUrl } from '@/services/api/config';

export type GovernmentUpdate = {
  title: string;
  description: string;
  imageUrl: string;
  publishedAt?: string;
  source?: string;
};

const ENDPOINT = buildApiUrl('/api/government-updates');

export const governmentUpdatesClient = {
  async fetchLatest(topic?: string): Promise<GovernmentUpdate[]> {
    const url = topic ? `${ENDPOINT}?topic=${encodeURIComponent(topic)}` : ENDPOINT;
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to fetch government updates');
    }

    const data = await response.json();
    if (!Array.isArray(data.updates)) {
      throw new Error('Malformed updates payload');
    }

    return data.updates as GovernmentUpdate[];
  },
};
