import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { BrandMark, Icon } from '../components/ui';
import { api } from '../cms/client';
import { useContent } from '../cms/context';
import { navigate, SiteLink, useLocation } from '../lib/navigation';
import { Field, LoginForm, SaveBar, TextArea, TextInput } from './ui';

type Section = 'overview' | 'homepage' | 'settings';

export default function AdminApp() {
  const { pathname } = useLocation();
  const path = pathname.replace(/\/+$/, '') || '/admin';
  const loginPath = path === '/admin/login';
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState('');
  const [section, setSection] = useState<Section>(path === '/admin/website' ? 'homepage' : path === '/admin/settings' ? 'settings' : 'overview');
  const { content, patch, reload } = useContent();

  useEffect(() => {
    let live = true;
    api.session().then(result => {
      if (!live) return;
      setAuthed(true);
      setEmail((result as { email: string }).email);
      setReady(true);
    }).catch(() => {
      if (!live) return;
      setAuthed(false);
      setReady(true);
    });
    return () => { live = false; };
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!authed && !loginPath) navigate('/admin/login');
    if (authed && loginPath) navigate('/admin');
  }, [authed, loginPath, ready]);

  if (!ready) return <div className="admin-boot" role="status">Loading admin…</div>;
  if (!authed) return <Login />;

  return <AdminShell email={email} section={section} setSection={next => { setSection(next); navigate(next === 'overview' ? '/admin' : next === 'homepage' ? '/admin/website' : '/admin/settings'); }} onLogout={async () => { await api.logout(); setAuthed(false); navigate('/admin/login'); }}>
    {section === 'overview' && <Overview content={content} onOpen={setSection} />}
    {section === 'homepage' && <Homepage content={content} patch={patch} />}
    {section === 'settings' && <Settings content={content} patch={patch} reload={reload} />}
  </AdminShell>;
}

function Login() {
  return <div className="admin-gate"><div className="admin-gate-card"><BrandMark /><p className="admin-kicker">DEVZARD / ADMIN</p><h1>Sign in.</h1><p className="admin-gate-copy">Sign in to manage the website.</p><LoginForm mode="login" error="" onSubmit={async (email, password) => { await api.login(email, password); navigate('/admin'); }} /><SiteLink href="/" className="admin-back">Back to website</SiteLink></div></div>;
}

function AdminShell({ email, section, setSection, onLogout, children }: { email: string; section: Section; setSection: (section: Section) => void; onLogout: () => Promise<void>; children: ReactNode }) {
  const links: { id: Section; label: string; icon: 'grid' | 'globe' | 'settings' }[] = [{ id: 'overview', label: 'Overview', icon: 'grid' }, { id: 'homepage', label: 'Homepage', icon: 'globe' }, { id: 'settings', label: 'Settings', icon: 'settings' }];
  return <div className="admin-shell"><aside><SiteLink href="/admin" className="admin-brand"><BrandMark /><span>Devzard</span></SiteLink><nav aria-label="Admin">{links.map(link => <button key={link.id} type="button" className={section === link.id ? 'active' : ''} onClick={() => setSection(link.id)}><Icon name={link.icon} size={16} />{link.label}</button>)}</nav><div className="admin-aside-foot"><span>{email}</span><button type="button" onClick={onLogout}><Icon name="logout" size={14} />Sign out</button></div></aside><main className="admin-main"><header className="admin-top"><p>Devzard content</p><SiteLink href="/" className="admin-view"><Icon name="eye" size={14} />View site</SiteLink></header><div className="admin-body">{children}</div></main></div>;
}

function Overview({ content, onOpen }: { content: any; onOpen: (section: Section) => void }) {
  const cards = [{ label: 'Projects', value: content.projects.length }, { label: 'Products', value: content.products.length }, { label: 'Services', value: content.services.length }, { label: 'Team members', value: content.team.length }];
  return <div className="admin-page"><header className="admin-page-head"><div><p className="admin-kicker">Content management</p><h1>Overview</h1></div></header><div className="admin-stat-grid">{cards.map(card => <div className="admin-stat" key={card.label}><span>{card.label}</span><strong>{card.value}</strong></div>)}</div><section className="admin-panel"><h2>Quick actions</h2><p className="admin-note">Manage the content that appears on the public website.</p><div className="admin-quick"><button className="admin-btn primary" type="button" onClick={() => onOpen('homepage')}>Edit homepage</button><button className="admin-btn ghost" type="button" onClick={() => onOpen('settings')}>Edit settings</button></div></section></div>;
}

function Homepage({ content, patch }: { content: any; patch: (fn: (current: any) => any) => Promise<void> }) {
  const [draft, setDraft] = useState(content.homepage);
  const [saving, setSaving] = useState(false);
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(content.homepage), [draft, content.homepage]);
  const save = async () => { setSaving(true); await patch(current => ({ ...current, homepage: draft })); setSaving(false); };
  return <div className="admin-page"><header className="admin-page-head"><div><p className="admin-kicker">Public website</p><h1>Homepage</h1></div></header><section className="admin-panel"><h2>Hero</h2><Field label="Brand"><TextInput value={draft.heroBrand} onChange={event => setDraft({ ...draft, heroBrand: event.target.value })} /></Field><Field label="Headline"><TextInput value={draft.heroHeadline} onChange={event => setDraft({ ...draft, heroHeadline: event.target.value })} /></Field><Field label="Accent"><TextInput value={draft.heroHeadlineAccent} onChange={event => setDraft({ ...draft, heroHeadlineAccent: event.target.value })} /></Field><Field label="Supporting text"><TextArea rows={3} value={draft.heroSubtitle} onChange={event => setDraft({ ...draft, heroSubtitle: event.target.value })} /></Field></section><SaveBar dirty={dirty} saving={saving} onSave={save} /></div>;
}

function Settings({ content, patch, reload }: { content: any; patch: (fn: (current: any) => any) => Promise<void>; reload: () => Promise<void> }) {
  const [draft, setDraft] = useState(content.settings);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(content.settings);
  const save = async () => { setSaving(true); await patch(current => ({ ...current, settings: draft })); setSaving(false); };
  return <div className="admin-page"><header className="admin-page-head"><div><p className="admin-kicker">Configuration</p><h1>Settings</h1></div></header><section className="admin-panel"><Field label="Site name"><TextInput value={draft.siteName} onChange={event => setDraft({ ...draft, siteName: event.target.value })} /></Field><Field label="Footer text"><TextArea rows={3} value={draft.footerText} onChange={event => setDraft({ ...draft, footerText: event.target.value })} /></Field><Field label="Contact email"><TextInput type="email" value={draft.email} onChange={event => setDraft({ ...draft, email: event.target.value })} /></Field></section><SaveBar dirty={dirty} saving={saving} onSave={save} /><button type="button" className="admin-btn ghost" onClick={reload}>Reload saved content</button></div>;
}
