import { supabase } from '@/lib/supabaseClient';
import type {
    BeneficiaryFormPayload,
    BeneficiaryMetadata,
    BeneficiaryRecord,
    OfficerContext,
} from '@/types/beneficiary';
import type { BeneficiaryProfile } from '@/types/entities';

const COLLECTION_NAME = 'beneficiaries';

const cleanContext = (context?: OfficerContext): OfficerContext | undefined => {
  if (!context) {
    return undefined;
  }
  const entries = Object.entries(context).filter(([, value]) => Boolean(value));
  return entries.length ? (Object.fromEntries(entries) as OfficerContext) : undefined;
};

const normalizeMobile = (mobile: string) => mobile.replace(/[^0-9]/g, '');

const saveDraft = async (formValues: BeneficiaryFormPayload, metadata: BeneficiaryMetadata): Promise<BeneficiaryRecord> => {
  if (!supabase) throw new Error('Supabase not initialized');

  const normalizedMobile = normalizeMobile(formValues.mobile);
  if (!normalizedMobile) {
    throw new Error('Beneficiary mobile number is required before saving.');
  }
  const sanitizedValues: BeneficiaryFormPayload = {
    ...formValues,
    mobile: normalizedMobile,
  };
  const context = cleanContext(metadata.createdBy);
  const metadataToPersist: BeneficiaryMetadata = {
    ...metadata,
    ...(context ? { createdBy: context } : {}),
  };
  const record: BeneficiaryRecord = {
    ...sanitizedValues,
    id: normalizedMobile,
    metadata: metadataToPersist,
  };
  const { id, ...persistable } = record;
  
  const { error } = await supabase
    .from(COLLECTION_NAME)
    .upsert({ id: normalizedMobile, ...persistable });

  if (error) throw error;
  return { ...record, id: normalizedMobile };
};

const getRecordByMobile = async (mobile: string): Promise<BeneficiaryRecord | null> => {
  if (!supabase) throw new Error('Supabase not initialized');

  const normalizedMobile = normalizeMobile(mobile);
  if (!normalizedMobile) {
    return null;
  }
  
  const { data, error } = await supabase
    .from(COLLECTION_NAME)
    .select('*')
    .eq('id', normalizedMobile)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as BeneficiaryRecord;
};

const getProfileByMobile = async (mobile: string): Promise<BeneficiaryProfile | null> => {
  const record = await getRecordByMobile(mobile);
  if (!record) {
    return null;
  }
  return {
    id: record.metadata?.beneficiaryUid ?? record.id,
    name: record.fullName,
    mobile: record.mobile,
    role: 'beneficiary',
    village: record.village,
    district: record.district,
    bank: record.bankName,
    scheme: record.schemeName,
  };
};

const listRecords = async (): Promise<BeneficiaryRecord[]> => {
  if (!supabase) throw new Error('Supabase not initialized');

  const { data, error } = await supabase
    .from(COLLECTION_NAME)
    .select('*')
    .order('metadata->createdAt', { ascending: false });

  if (error) throw error;
  return data as BeneficiaryRecord[];
};

const subscribeToRecords = (onData: (records: BeneficiaryRecord[]) => void, onError?: (error: Error) => void) => {
  if (!supabase) {
    onData([]);
    return () => undefined;
  }

  listRecords()
    .then(onData)
    .catch((err) => onError?.(err instanceof Error ? err : new Error(String(err))));

  const channel = supabase
    .channel('public:beneficiaries')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: COLLECTION_NAME,
      },
      () => {
        listRecords()
          .then(onData)
          .catch((err) => onError?.(err instanceof Error ? err : new Error(String(err))));
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

const subscribeToRecord = (
  recordId: string,
  onData: (record: BeneficiaryRecord | null) => void,
  onError?: (error: Error) => void
) => {
  if (!recordId || !supabase) {
    onData(null);
    return () => undefined;
  }

  getRecordByMobile(recordId)
    .then(onData)
    .catch((err) => onError?.(err instanceof Error ? err : new Error(String(err))));

  const channel = supabase
    .channel(`public:beneficiaries:${recordId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: COLLECTION_NAME,
        filter: `id=eq.${recordId}`,
      },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          onData(null);
        } else {
          onData(payload.new as BeneficiaryRecord);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const beneficiaryRepository = {
  normalizeMobile,
  saveDraft,
  getRecordByMobile,
  getProfileByMobile,
  listRecords,
  subscribeToRecords,
  subscribeToRecord,
};
