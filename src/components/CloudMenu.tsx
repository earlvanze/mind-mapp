import { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { listProjects, loadProject, saveProject, deleteProject, type CloudProjectListItem } from '../lib/cloudSync';
import type { Node } from '../store/useMindMapStore';
import AuthDialog from './AuthDialog';

interface Props {
  mapName: string;
  mapData: { nodes: Record<string, Node>; focusId: string };
  onLoadProject: (data: { nodes: Record<string, Node>; focusId: string }) => void;
  onSaveProject: (id?: string) => void;
  cloudProjectId?: string;
}

export default function CloudMenu({ mapName, mapData, onLoadProject, onSaveProject, cloudProjectId }: Props) {
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [projects, setProjects] = useState<CloudProjectListItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveName, setSaveName] = useState(mapName || 'Untitled');
  const [showSaveAs, setShowSaveAs] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const auth = supabase?.auth ?? null;

  useEffect(() => {
    if (!isSupabaseConfigured || !auth) return;
    auth.getUser().then(({ data }) => {
      if (data?.user) setUser({ id: data.user.id, email: data.user.email ?? undefined });
    });
    const { data: { subscription } } = auth.onAuthStateChange((_e, session) => {
      if (session?.user) setUser({ id: session.user.id, email: session.user.email ?? undefined });
      else setUser(null);
    });
    return () => subscription.unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (open && user && isSupabaseConfigured) {
      setLoading(true);
      listProjects(user.id).then(list => { setProjects(list); setLoading(false); });
    }
  }, [open, user]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (menuRef.current && !target?.closest('.cloud-menu')) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSave = async () => {
    if (!user) { setAuthOpen(true); return; }
    setSaving(true);
    const newId = await saveProject(user.id, saveName || mapName || 'Untitled', mapData, cloudProjectId);
    setSaving(false);
    setShowSaveAs(false);
    if (newId) onSaveProject(newId);
    if (user) setProjects(await listProjects(user.id));
  };

  const handleLoad = async (id: string) => {
    setLoading(true);
    const data = await loadProject(id);
    if (data) { onLoadProject(data); setOpen(false); }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project?')) return;
    await deleteProject(id);
    if (user) setProjects(await listProjects(user.id));
  };

  const handleSignOut = async () => {
    if (!auth) return;
    await auth.signOut();
    setUser(null);
    setProjects([]);
  };

  return (
    <>
      <div className="cloud-menu" ref={menuRef}>
        <button
          className={`toolbar-btn${user ? ' active' : ''}${!isSupabaseConfigured ? ' disabled' : ''}`}
          onClick={() => isSupabaseConfigured && setOpen(o => !o)}
          disabled={!isSupabaseConfigured}
          title={isSupabaseConfigured ? `Cloud${user ? ` (${projects.length} projects)` : ' (not signed in)'}` : 'Cloud sync requires Supabase env vars'}
        >
          ☁️{user ? ` (${projects.length})` : ''}
        </button>

        {open && isSupabaseConfigured && (
          <div className="cloud-menu-dropdown">
            <div className="cloud-menu-header">
              <span>{user ? `👤 ${user.email || user.id.slice(0, 8)}` : 'Not signed in'}</span>
              {user && <button className="btn-small" onClick={handleSignOut}>Sign out</button>}
            </div>

            {!user ? (
              <div className="cloud-menu-body">
                <p>Sign in to sync your maps across devices.</p>
                <button className="btn-primary full-width" onClick={() => { setOpen(false); setAuthOpen(true); }}>
                  Sign In / Create Account
                </button>
              </div>
            ) : (
              <div className="cloud-menu-body">
                {showSaveAs ? (
                  <div className="cloud-save-form">
                    <input
                      type="text"
                      value={saveName}
                      onChange={e => setSaveName(e.target.value)}
                      placeholder="Project name"
                      autoFocus
                      onKeyDown={e => e.key === 'Enter' && handleSave()}
                    />
                    <div className="cloud-save-actions">
                      <button className="btn-small" onClick={() => setShowSaveAs(false)}>Cancel</button>
                      <button className="btn-primary btn-small" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : cloudProjectId ? 'Update' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="cloud-save-row">
                    <button className="btn-primary full-width" onClick={() => setShowSaveAs(true)}>
                      {cloudProjectId ? '💾 Save Update' : '💾 Save to Cloud'}
                    </button>
                  </div>
                )}

                {loading ? (
                  <div className="cloud-loading">Loading projects...</div>
                ) : projects.length > 0 ? (
                  <div className="cloud-project-list">
                    <div className="cloud-project-list-header">Your Projects</div>
                    {projects.map(p => (
                      <div key={p.id} className={`cloud-project-item${p.id === cloudProjectId ? ' current' : ''}`}>
                        <button className="cloud-project-load" onClick={() => handleLoad(p.id)}>
                          <span className="cloud-project-name">{p.name}</span>
                          <span className="cloud-project-date">{new Date(p.updated_at).toLocaleDateString()}</span>
                        </button>
                        <button className="cloud-project-delete" onClick={() => handleDelete(p.id)} title="Delete">🗑</button>
                      </div>
                    ))}
                  </div>
                ) : !showSaveAs ? (
                  <p className="cloud-empty">No saved projects yet.</p>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>

      {authOpen && <AuthDialog onClose={() => setAuthOpen(false)} onAuth={email => { setUser({ id: '', email }); }} />}
    </>
  );
}
