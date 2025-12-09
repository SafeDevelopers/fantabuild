/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { supabase, DatabaseCreation } from './supabase';
import { Creation } from '../components/CreationHistory';
import { GenerationMode } from './gemini';

/**
 * Convert database creation to app creation format
 */
function dbToAppCreation(db: DatabaseCreation): Creation {
  return {
    id: db.id,
    name: db.name,
    html: db.html,
    originalImage: db.original_image,
    timestamp: new Date(db.created_at),
    purchased: db.purchased,
  };
}

/**
 * Fetch all creations for a user
 */
export async function fetchUserCreations(userId: string): Promise<{ creations: Creation[]; error: any }> {
  const { data, error } = await supabase
    .from('creations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return { creations: [], error };
  }

  const creations = (data || []).map(dbToAppCreation);
  return { creations, error: null };
}

/**
 * Save a new creation
 */
export async function saveCreation(
  userId: string,
  creation: Omit<Creation, 'id' | 'timestamp'>,
  mode: GenerationMode
): Promise<{ creation: Creation | null; error: any }> {
  const { data, error } = await supabase
    .from('creations')
    .insert({
      user_id: userId,
      name: creation.name,
      html: creation.html,
      original_image: creation.originalImage,
      mode,
      purchased: creation.purchased || false,
    })
    .select()
    .single();

  if (error) {
    return { creation: null, error };
  }

  return { creation: dbToAppCreation(data), error: null };
}

/**
 * Update a creation (e.g., mark as purchased)
 */
export async function updateCreation(
  creationId: string,
  updates: Partial<Pick<DatabaseCreation, 'purchased' | 'name' | 'html'>>
): Promise<{ error: any }> {
  const { error } = await supabase
    .from('creations')
    .update(updates)
    .eq('id', creationId);

  return { error };
}

/**
 * Delete a creation
 */
export async function deleteCreation(creationId: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from('creations')
    .delete()
    .eq('id', creationId);

  return { error };
}

/**
 * Mark a creation as purchased
 */
export async function markCreationAsPurchased(creationId: string): Promise<{ error: any }> {
  return updateCreation(creationId, { purchased: true });
}

