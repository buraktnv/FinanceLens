import type { Request } from 'express';
import type { User } from '@supabase/supabase-js';

/**
 * Express request carrying the Supabase user attached by the global
 * AuthGuard after successful token verification.
 */
export interface RequestWithUser extends Request {
  user?: User;
}
