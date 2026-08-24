import { User } from '@supabase/supabase-js';

export function parseDemoUser(raw: string | null): User | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }
    return parsed as User;
  } catch {
    return null;
  }
}
