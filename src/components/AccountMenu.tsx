import React from "react";
import { UserCircle, LogOut, Save, FolderOpen, Mail, X } from "lucide-react";
import { supabase, supabaseConfigured } from "../lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import type { BirthData } from "../types";

interface SavedProfile {
  id: string;
  label: string;
  birth_data: BirthData;
  is_default: boolean;
  updated_at: string;
}

interface AccountMenuProps {
  birthData: BirthData | null;
  hasResult: boolean;
  onProfileLoad: (data: BirthData) => void;
}

type AuthView = "menu" | "login-email" | "link-sent";

export default function AccountMenu({ birthData, hasResult, onProfileLoad }: AccountMenuProps) {
  const [open, setOpen] = React.useState(false);
  const [user, setUser] = React.useState<User | null>(null);
  const [view, setView] = React.useState<AuthView>("menu");
  const [email, setEmail] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [profiles, setProfiles] = React.useState<SavedProfile[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [saveLabel, setSaveLabel] = React.useState("");
  const [showSaveForm, setShowSaveForm] = React.useState(false);
  const [feedback, setFeedback] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_ev, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  React.useEffect(() => {
    if (user && open) loadProfiles();
  }, [user, open]);

  async function loadProfiles() {
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;
    try {
      const res = await fetch("/api/me/profiles", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setProfiles(await res.json());
    } catch { /* network error — silent, profile list stays empty */ }
  }

  async function sendMagicLink() {
    if (!supabase || !email.trim()) return;
    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
    setSending(false);
    if (!error) setView("link-sent");
    else setFeedback("Fehler beim Senden. Bitte erneut versuchen.");
  }

  async function saveProfile() {
    if (!supabase || !birthData) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/me/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ label: saveLabel.trim() || (birthData.name || "Mein Profil"), birth_data: birthData }),
      });
      if (res.ok) {
        setFeedback("Profil gespeichert.");
        setShowSaveForm(false);
        setSaveLabel("");
        await loadProfiles();
      } else {
        setFeedback("Fehler beim Speichern.");
      }
    } catch { setFeedback("Netzwerkfehler."); }
    finally { setSaving(false); }
  }

  async function logout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setOpen(false);
    setView("menu");
    setProfiles([]);
  }

  if (!supabaseConfigured) {
    return (
      <div data-testid="account-menu-disabled" className="text-[10px] font-mono text-stone-500 px-3 py-1.5 border border-stone-700/40 rounded-full">
        Konto-Funktion derzeit nicht verfügbar
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        data-testid="account-menu-trigger"
        onClick={() => { setOpen(o => !o); setFeedback(null); }}
        className="flex items-center space-x-1.5 px-3 py-2 rounded-full border border-gold-muted/20 hover:border-gold-muted/50 text-stone-400 hover:text-gold-light transition-all text-xs font-mono"
        title={user ? user.email ?? "Konto" : "Anmelden"}
      >
        <UserCircle className="h-4 w-4" />
        {user && <span className="max-w-[120px] truncate">{user.email}</span>}
        {!user && <span>Anmelden</span>}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-obsidian-deep border border-gold-muted/20 rounded-xl shadow-2xl z-50 p-4 space-y-3">
          <button onClick={() => setOpen(false)} className="absolute top-3 right-3 text-stone-500 hover:text-stone-300">
            <X className="h-4 w-4" />
          </button>

          {/* Logged out */}
          {!user && view === "menu" && (
            <div className="space-y-3">
              <p className="text-xs text-stone-400 font-sans">Mit E-Mail anmelden (kein Passwort):</p>
              <button
                data-testid="account-login-button"
                onClick={() => setView("login-email")}
                className="w-full flex items-center justify-center space-x-2 py-2 border border-gold-muted/30 rounded-lg text-gold-light text-xs font-mono hover:bg-gold-muted/5"
              >
                <Mail className="h-4 w-4" />
                <span>Magic Link senden</span>
              </button>
            </div>
          )}

          {!user && view === "login-email" && (
            <div className="space-y-3">
              <p className="text-xs text-stone-400 font-sans">E-Mail-Adresse:</p>
              <input
                data-testid="account-email-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMagicLink()}
                placeholder="deine@email.de"
                className="w-full bg-obsidian-deep/65 text-[#E0D8D0] rounded-lg border border-gold-muted/20 px-3 py-2 text-sm focus:outline-none focus:border-gold-muted/50"
              />
              <button
                data-testid="account-send-link"
                onClick={sendMagicLink}
                disabled={sending || !email.trim()}
                className="w-full py-2 border border-gold-muted/30 rounded-lg text-gold-light text-xs font-mono hover:bg-gold-muted/5 disabled:opacity-40"
              >
                {sending ? "Wird gesendet…" : "Link senden"}
              </button>
              {feedback && <p className="text-xs text-red-400">{feedback}</p>}
            </div>
          )}

          {!user && view === "link-sent" && (
            <div className="space-y-2 text-center">
              <p className="text-xs text-gold-light font-sans">Link verschickt — prüfe dein Postfach.</p>
              <p className="text-[10px] text-stone-500 font-mono">Rate-Limit: 4 Links/Stunde/E-Mail</p>
            </div>
          )}

          {/* Logged in */}
          {user && (
            <div className="space-y-3">
              <p className="text-xs text-stone-400 font-mono truncate" data-testid="account-email-display">{user.email}</p>

              {/* Save profile */}
              {hasResult && birthData && !showSaveForm && (
                <button
                  data-testid="account-save-profile"
                  onClick={() => { setShowSaveForm(true); setSaveLabel(birthData.name || ""); }}
                  className="w-full flex items-center justify-center space-x-2 py-2 border border-gold-muted/30 rounded-lg text-gold-light text-xs font-mono hover:bg-gold-muted/5"
                >
                  <Save className="h-4 w-4" />
                  <span>Dieses Profil speichern</span>
                </button>
              )}

              {showSaveForm && (
                <div className="space-y-2">
                  <input
                    data-testid="account-save-label"
                    value={saveLabel}
                    onChange={e => setSaveLabel(e.target.value)}
                    placeholder="Profilname"
                    className="w-full bg-obsidian-deep/65 text-[#E0D8D0] rounded-lg border border-gold-muted/20 px-3 py-2 text-sm focus:outline-none"
                  />
                  <div className="flex space-x-2">
                    <button onClick={saveProfile} disabled={saving} className="flex-1 py-1.5 border border-gold-muted/30 rounded text-gold-light text-xs font-mono hover:bg-gold-muted/5 disabled:opacity-40">
                      {saving ? "…" : "Speichern"}
                    </button>
                    <button onClick={() => setShowSaveForm(false)} className="px-3 py-1.5 border border-stone-700 rounded text-stone-400 text-xs font-mono">
                      Abbrechen
                    </button>
                  </div>
                </div>
              )}

              {feedback && <p className="text-xs text-stone-300 font-sans">{feedback}</p>}

              {/* Load profile */}
              {profiles.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] text-stone-500 font-mono uppercase tracking-wider">Gespeicherte Profile</p>
                  {profiles.map(p => (
                    <button
                      key={p.id}
                      data-testid={`account-load-profile-${p.id}`}
                      onClick={() => { onProfileLoad(p.birth_data); setOpen(false); }}
                      className="w-full text-left px-3 py-2 rounded-lg border border-stone-700/40 hover:border-gold-muted/30 text-xs text-stone-300 font-sans flex items-center space-x-2"
                    >
                      <FolderOpen className="h-3.5 w-3.5 text-stone-500 shrink-0" />
                      <span className="truncate">{p.label}</span>
                    </button>
                  ))}
                </div>
              )}

              <button
                data-testid="account-logout"
                onClick={logout}
                className="w-full flex items-center justify-center space-x-2 py-2 border border-stone-700/40 rounded-lg text-stone-400 text-xs font-mono hover:text-red-400 hover:border-red-400/30"
              >
                <LogOut className="h-4 w-4" />
                <span>Abmelden</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
