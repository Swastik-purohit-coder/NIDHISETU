import { supabase } from '@/lib/supabaseClient';
import type { ReviewerProfile } from '@/types/entities';

const COLLECTION_NAME = 'reviewers';

const getProfile = async (reviewerId: string): Promise<ReviewerProfile | null> => {
  if (!supabase) throw new Error('Supabase not initialized');
  
  const { data, error } = await supabase
    .from(COLLECTION_NAME)
    .select('*')
    .eq('id', reviewerId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data as ReviewerProfile;
};

const getProfileByMobile = async (mobile: string): Promise<ReviewerProfile | null> => {
  if (!supabase) throw new Error('Supabase not initialized');
  
  const { data, error } = await supabase
    .from(COLLECTION_NAME)
    .select('*')
    .eq('mobile', mobile)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data as ReviewerProfile;
};

const upsertProfile = async (profile: ReviewerProfile) => {
  if (!supabase) throw new Error('Supabase not initialized');
  
  const { error } = await supabase
    .from(COLLECTION_NAME)
    .upsert(profile);

  if (error) throw error;
  return profile;
};

const updateProfile = async (reviewerId: string, updates: Partial<ReviewerProfile>) => {
  if (!supabase) throw new Error('Supabase not initialized');
  
  const { id: _ignored, ...safeUpdates } = updates;
  const sanitized = { ...safeUpdates, role: 'reviewer' as const };

  const { data, error } = await supabase
    .from(COLLECTION_NAME)
    .update(sanitized)
    .eq('id', reviewerId)
    .select()
    .single();

  if (error) throw error;
  return data as ReviewerProfile;
};

const subscribeToProfile = (
  reviewerId: string,
  onData: (profile: ReviewerProfile | null) => void,
  onError?: (error: Error) => void
) => {
  if (!supabase) {
    onData(null);
    return () => undefined;
  }

  // Initial fetch
  getProfile(reviewerId)
    .then(onData)
    .catch((err) => onError?.(err instanceof Error ? err : new Error(String(err))));

  const channel = supabase
    .channel(`public:${COLLECTION_NAME}:${reviewerId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: COLLECTION_NAME,
        filter: `id=eq.${reviewerId}`,
      },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          onData(null);
        } else {
          onData(payload.new as ReviewerProfile);
        }
      }
    )
    .subscribe();

  return () => {
    supabase?.removeChannel(channel);
  };
};

export const reviewerRepository = {
  getProfile,
  getProfileByMobile,
  upsertProfile,
  updateProfile,
  subscribeToProfile,
};
