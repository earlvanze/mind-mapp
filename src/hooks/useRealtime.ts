/**
 * useRealtime — realtime collaboration hook
 *
 * Manages the lifecycle of the Supabase Realtime broadcast subscription
 * for the currently loaded cloud project. Applies incoming remote changes
 * to the local store via importState.
 *
 * Follow mode: when ON, remote changes auto-update the local view.
 * When OFF (default), changes are queued for the local user to review before applying.
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { useMindMapStore } from '../store/useMindMapStore';
import { subscribeToProject, broadcastChange, type RemoteChange } from '../lib/realtime';
import type { Node } from '../store/useMindMapStore';
import { isSupabaseConfigured } from '../lib/supabase';

interface UseRealtimeOptions {
  projectId: string | undefined;
  userId: string | undefined;
  /** Called when a remote change arrives */
  onRemoteUpdate?: (change: RemoteChange) => void;
}

interface UseRealtimeReturn {
  isConnected: boolean;
  isFollowing: boolean;
  toggleFollowMode: () => void;
  pendingCount: number;
  dismissPending: () => void;
}

export function useRealtime({
  projectId,
  userId,
  onRemoteUpdate,
}: UseRealtimeOptions): UseRealtimeReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const pendingRef = useRef<RemoteChange[]>([]);

  const nodes = useMindMapStore(s => s.nodes);
  const importState = useMindMapStore(s => s.importState);

  /** Apply a single remote change to the local store */
  const applyRemoteChange = useCallback((change: RemoteChange) => {
    const { operation, payload } = change;
    if (operation === 'UPSERT' && payload?.node) {
      const remoteNode = payload.node as Node;
      const mergedNode: Node = {
        ...remoteNode,
        isNew: false,
        isDeleting: false,
      };
      importState({ [remoteNode.id]: mergedNode });
    } else if (operation === 'DELETE' && payload?.node) {
      const deletedId = (payload.node as Node).id;
      const newNodes = { ...nodes };
      delete newNodes[deletedId];
      importState(newNodes);
    } else if (operation === 'EDGE_UPSERT' && payload?.fromId && payload?.toId) {
      const fromNode = nodes[payload.fromId];
      if (fromNode && !fromNode.children.includes(payload.toId)) {
        importState({
          [payload.fromId]: {
            ...fromNode,
            children: [...fromNode.children, payload.toId],
          },
        });
      }
    } else if (operation === 'EDGE_DELETE' && payload?.fromId && payload?.toId) {
      const fromNode = nodes[payload.fromId];
      if (fromNode) {
        importState({
          [payload.fromId]: {
            ...fromNode,
            children: fromNode.children.filter(id => id !== payload.toId),
          },
        });
      }
    }
  }, [nodes, importState]);

  // Subscribe/unsubscribe when projectId or userId changes
  useEffect(() => {
    if (!projectId || !userId || !isSupabaseConfigured) {
      setIsConnected(false);
      return () => {};
    }

    const unsubscribe = subscribeToProject(projectId, userId, (change) => {
      onRemoteUpdate?.(change);
      if (isFollowing) {
        applyRemoteChange(change);
      } else {
        pendingRef.current = [...pendingRef.current, change];
        setPendingCount(c => c + 1);
      }
    });

    setIsConnected(true);
    return () => {
      unsubscribe();
      setIsConnected(false);
    };
  }, [projectId, userId, onRemoteUpdate, applyRemoteChange, isFollowing]);

  const toggleFollowMode = useCallback(() => {
    setIsFollowing(f => {
      if (!f) {
        // Turned follow ON — apply all queued changes
        pendingRef.current.forEach(applyRemoteChange);
        pendingRef.current = [];
        setPendingCount(0);
      }
      return !f;
    });
  }, [applyRemoteChange]);

  const dismissPending = useCallback(() => {
    pendingRef.current = [];
    setPendingCount(0);
  }, []);

  return {
    isConnected,
    isFollowing,
    toggleFollowMode,
    pendingCount,
    dismissPending,
  };
}
