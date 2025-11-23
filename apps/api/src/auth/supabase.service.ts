import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL')!,
      this.configService.get<string>('SUPABASE_SERVICE_KEY')!,
    );
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  async verifyToken(token: string): Promise<User | null> {
    try {
      const { data, error } = await this.supabase.auth.getUser(token);
      if (error || !data.user) {
        return null;
      }
      return data.user;
    } catch {
      return null;
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      const { data, error } = await this.supabase.auth.admin.getUserById(userId);
      if (error || !data.user) {
        return null;
      }
      return data.user;
    } catch {
      return null;
    }
  }
}
