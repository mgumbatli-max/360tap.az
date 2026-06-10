const KEY = 'tap_listing_draft';

export function saveDraft(form: any) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(KEY, JSON.stringify({ form, savedAt: Date.now() })); } catch {}
}
export type DraftData = Record<string, any>;
export const getDraft = (): { data: DraftData; savedAt: number } | null => {
  const v = loadDraft();
  return v ? { data: v.form, savedAt: v.savedAt } : null;
};
export function loadDraft(): { form: any; savedAt: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = localStorage.getItem(KEY);
    if (!v) return null;
    return JSON.parse(v);
  } catch { return null; }
}
export function clearDraft() {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(KEY); } catch {}
}
