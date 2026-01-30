import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          username: string;
          name: string;
          assigned_slot: 'slot_1' | 'slot_2' | 'slot_3' | 'slot_4';
          status: 'active' | 'inactive';
          role: 'admin' | 'user';
          created_at: string;
          updated_at: string;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          target_roles: string[];
          min_salary: number;
          max_salary: number | null;
          preferred_locations: string[];
          remote_only: boolean;
          min_experience: number;
          max_experience: number;
          resume_json: Record<string, unknown>;
          email_notifications: boolean;
          notification_frequency: 'immediate' | 'daily' | 'weekly';
          updated_at: string;
        };
      };
      portals: {
        Row: {
          id: string;
          name: string;
          display_name: string;
          is_active: boolean;
          created_at: string;
        };
      };
      user_portal_settings: {
        Row: {
          id: string;
          user_id: string;
          portal_id: string;
          is_enabled: boolean;
          priority: number;
          updated_at: string;
        };
      };
      jobs: {
        Row: {
          id: string;
          user_id: string;
          portal_id: string;
          title: string;
          company: string;
          location: string | null;
          salary_min: number | null;
          salary_max: number | null;
          description: string | null;
          requirements: string | null;
          score: number;
          ai_analysis: Record<string, unknown>;
          external_url: string | null;
          scraped_at: string;
          slot: 'slot_1' | 'slot_2' | 'slot_3' | 'slot_4' | null;
          created_at: string;
        };
      };
      applications: {
        Row: {
          id: string;
          user_id: string;
          job_id: string;
          status: 'not_applied' | 'applied' | 'callback' | 'interview' | 'offer' | 'rejected';
          applied_date: string | null;
          callback_date: string | null;
          notes: string;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
};
