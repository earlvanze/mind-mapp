import { supabase, isSupabaseConfigured } from './supabase';
import type { Node } from '../store/useMindMapStore';

export type CloudProjectListItem = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type CloudProject = CloudProjectListItem & {
  data: { nodes: Record<string, Node>; focusId: string };
};

export async function listProjects(userId: string): Promise<CloudProjectListItem[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase!
    .from('projects')
    .select('id, name, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) { console.error('[CloudSync] list error:', error); return []; }
  return data || [];
}

export async function loadProject(id: string): Promise<CloudProject['data'] | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase!
    .from('projects')
    .select('data')
    .eq('id', id)
    .single();
  if (error) { console.error('[CloudSync] load error:', error); return null; }
  return data?.data ?? null;
}

export async function saveProject(userId: string, name: string, data: CloudProject['data'], id?: string): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const payload = { user_id: userId, name, data, updated_at: new Date().toISOString() };
  if (id) {
    const { error } = await supabase!.from('projects').update(payload).eq('id', id);
    if (error) { console.error('[CloudSync] save error:', error); return null; }
    return id;
  } else {
    const { data: result, error } = await supabase!.from('projects').insert(payload).select('id').single();
    if (error) { console.error('[CloudSync] create error:', error); return null; }
    return result?.id ?? null;
  }
}

export async function deleteProject(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const { error } = await supabase!.from('projects').delete().eq('id', id);
  if (error) { console.error('[CloudSync] delete error:', error); return false; }
  return true;
}
