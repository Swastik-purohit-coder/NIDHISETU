import { supabase } from '@/lib/supabaseClient';
import type { OfficerProfile } from '@/types/entities';

const COLLECTION_NAME = 'officers';

const getProfile = async (officerId: string): Promise<OfficerProfile | null> => {
  if (!supabase) throw new Error('Supabase not initialized');
  
  const { data, error } = await supabase
    .from(COLLECTION_NAME)
    .select('*')
    .eq('id', officerId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data as OfficerProfile;
};

const getProfileByMobile = async (mobile: string): Promise<OfficerProfile | null> => {
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
  return data as OfficerProfile;
};

const upsertProfile = async (profile: OfficerProfile) => {
  if (!supabase) throw new Error('Supabase not initialized');
  
  const { error } = await supabase
    .from(COLLECTION_NAME)
    .upsert(profile);

  if (error) throw error;
  return profile;
};

const updateProfile = async (officerId: string, updates: Partial<OfficerProfile>) => {
  if (!supabase) throw new Error('Supabase not initialized');
  
  const { id: _ignored, ...safeUpdates } = updates;
  const sanitized = { ...safeUpdates, role: 'officer' as const };

  const { data, error } = await supabase
    .from(COLLECTION_NAME)
    .update(sanitized)
    .eq('id', officerId)
    .select()
    .single();

  if (error) throw error;
  return data as OfficerProfile;
};

const subscribeToProfile = (
  officerId: string,
  onData: (profile: OfficerProfile | null) => void,
  onError?: (error: Error) => void
) => {
  if (!supabase) {
    onData(null);
    return () => undefined;
  }

  // Initial fetch
  getProfile(officerId)
    .then(onData)
    .catch((err) => onError?.(err instanceof Error ? err : new Error(String(err))));

  const channel = supabase
    .channel(`public:${COLLECTION_NAME}:${officerId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: COLLECTION_NAME,
        filter: `id=eq.${officerId}`,
      },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          onData(null);
        } else {
          onData(payload.new as OfficerProfile);
        }
      }
    )
    .subscribe();

  return () => {
    supabase?.removeChannel(channel);
  };
};

export const officerRepository = {
  getProfile,
  getProfileByMobile,
  upsertProfile,
  updateProfile,
  subscribeToProfile,
};
