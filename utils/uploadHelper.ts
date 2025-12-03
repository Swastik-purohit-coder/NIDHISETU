import * as FileSystem from 'expo-file-system/legacy';
import { decode as base64Decode } from 'base-64';
import { supabase } from '@/lib/supabaseClient';

export const uploadEvidenceFile = async (uri: string, userId: string): Promise<string> => {
  if (!supabase) throw new Error('Supabase not configured');
  
  // If it's already a remote URL, return it
  if (uri.startsWith('http') || uri.startsWith('https')) return uri;

  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const binary = base64Decode(base64);
    const buffer = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      buffer[i] = binary.charCodeAt(i);
    }

    const fileName = `${userId}/${Date.now()}.jpg`;
    const { error } = await supabase.storage
      .from('UploadEvedence')
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) throw error;

    const { data } = supabase.storage.from('UploadEvedence').getPublicUrl(fileName);
    return data.publicUrl;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};
