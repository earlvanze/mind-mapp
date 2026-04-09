/**

 * Realtime collaboration via Supabase Realtime broadcast
 *
 * Architecture:
 * - One broadcast channel per project (identified by project_id)
 * - Clients subscribe to the channel and receive change events
 * - ClientNanoID: unique per-session ID that lets us skip our own echoed changes
 * - Change types: UPSERT (node upsert), DELETE (node delete), EDGE_UPSERT, EDGE_DELETE
 */
import { supabase, isSupabaseConfigured } from './supabase';
import type { Node } from '../store/useMindMapStore';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Singleton: per-process client nano-ID (random, survives page session)
let _clientNanoId: string | null = null;
function clientNanoId(): string {
  if (!_clientNanoId) {
    _clientNanoId = `c_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
  return _clientNanoId;
}

export type ChangeOperation = 'UPSERT' | 'DELETE' | 'EDGE_UPSERT' | 'EDGE_DELETE';

export type RemoteChange = {
  operation: ChangeOperation;
  payload: { node?: Node; fromId?: string; toId?: string } | null;
  client_nanoid: string;
  created_at: string;
};

export type RemoteChangeHandler = (change: RemoteChange) => void;

interface RealtimeChannelState {
  channel: RealtimeChannel;
  unsubscribed: boolean;
}

/**
 * Subscribe to realtime changes for a given cloud project.
 * Returns a cleanup function.
 */
export function subscribeToProject(
  projectId: string,
  userId: string,
  onRemoteChange: RemoteChangeHandler,
): () => void {
  if (!isSupabaseConfigured || !supabase) {
    return () => {};
  }

  const nanoId = clientNanoId();
  const channelName = `project-${projectId}`;
  const client = supabase;

  // Remove existing if any (idempotent)
  const existing = client.getChannels().filter(c => c.topic === `realtime:${channelName}`);
  existing.forEach(c => client.removeChannel(c));

  const channel = supabase.channel(channelName, {
    config: { broadcast: { self: false } },
  });

  channel
    .on('broadcast', { event: 'change' }, (payload) => {
      const change = payload.payload as RemoteChange;
      // Skip changes that originated from us
      if (change.client_nanoid === nanoId) return;
      onRemoteChange(change);
    })
    .subscribe(async (status) => {
      if (status !== 'SUBSCRIBED') return;
      // Optionally persist a heartbeat row so presence is visible
      try {
        await supabase!
          .from('project_changes')
          .insert({ project_id: projectId, user_id: userId, operation: 'UPSERT', payload: {}, client_nanoid: nanoId })
          .select('id')
          .single();
      } catch {
        // Non-fatal — presence heartbeat is best-effort
      }
    });

  const state: RealtimeChannelState = { channel, unsubscribed: false };

  return () => {
    if (state.unsubscribed) return;
    state.unsubscribed = true;
    supabase!.removeChannel(channel);
  };
}

/**
 * Broadcast a local change to all collaborators on the channel.
 * Returns false if realtime is not configured (no-op, non-blocking).
 */
export async function broadcastChange(
  projectId: string,
  change: Omit<RemoteChange, 'client_nanoid' | 'created_at'>,
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;

  const fullChange: RemoteChange = {
    ...change,
    client_nanoid: clientNanoId(),
    created_at: new Date().toISOString(),
  };

  const channelName = `project-${projectId}`;
  const channels = supabase.getChannels().filter(c => c.topic === `realtime:${channelName}`);
  const channel = channels[0];

  if (channel?.state === 'joined') {
    await channel.send({
      type: 'broadcast',
      event: 'change',
      payload: fullChange,
    });
  }

  return true;
}
