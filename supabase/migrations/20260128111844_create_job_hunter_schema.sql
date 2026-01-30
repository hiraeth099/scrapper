/*
  # Job Hunter Dashboard - Complete Database Schema

  ## Overview
  This migration creates the complete database structure for a multi-user job hunting dashboard
  with admin-managed access, time slot assignments, and personalized job scraping.

  ## New Tables

  ### 1. `user_profiles`
  Extends Supabase auth.users with additional profile data
  - `id` (uuid, FK to auth.users)
  - `username` (text, unique)
  - `name` (text)
  - `assigned_slot` (text, one of: slot_1, slot_2, slot_3, slot_4)
  - `status` (text, one of: active, inactive)
  - `role` (text, one of: admin, user)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `user_preferences`
  Stores user job search preferences
  - `id` (uuid, PK)
  - `user_id` (uuid, FK to user_profiles)
  - `target_roles` (text[])
  - `min_salary` (integer)
  - `max_salary` (integer)
  - `preferred_locations` (text[])
  - `remote_only` (boolean)
  - `min_experience` (integer)
  - `max_experience` (integer)
  - `resume_json` (jsonb)
  - `email_notifications` (boolean)
  - `notification_frequency` (text)
  - `updated_at` (timestamptz)

  ### 3. `portals`
  Master list of job portals
  - `id` (uuid, PK)
  - `name` (text, unique)
  - `display_name` (text)
  - `is_active` (boolean)
  - `created_at` (timestamptz)

  ### 4. `user_portal_settings`
  User-specific portal preferences
  - `id` (uuid, PK)
  - `user_id` (uuid, FK to user_profiles)
  - `portal_id` (uuid, FK to portals)
  - `is_enabled` (boolean)
  - `priority` (integer)
  - `updated_at` (timestamptz)

  ### 5. `jobs`
  Scraped job listings
  - `id` (uuid, PK)
  - `user_id` (uuid, FK to user_profiles)
  - `portal_id` (uuid, FK to portals)
  - `title` (text)
  - `company` (text)
  - `location` (text)
  - `salary_min` (integer)
  - `salary_max` (integer)
  - `description` (text)
  - `requirements` (text)
  - `score` (integer, 0-100)
  - `ai_analysis` (jsonb)
  - `external_url` (text)
  - `scraped_at` (timestamptz)
  - `slot` (text)
  - `created_at` (timestamptz)

  ### 6. `applications`
  User application tracking
  - `id` (uuid, PK)
  - `user_id` (uuid, FK to user_profiles)
  - `job_id` (uuid, FK to jobs)
  - `status` (text, one of: not_applied, applied, callback, interview, offer, rejected)
  - `applied_date` (date)
  - `callback_date` (date)
  - `notes` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
  - Admin can access all data
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  name text NOT NULL,
  assigned_slot text NOT NULL CHECK (assigned_slot IN ('slot_1', 'slot_2', 'slot_3', 'slot_4')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  target_roles text[] DEFAULT ARRAY[]::text[],
  min_salary integer DEFAULT 0,
  max_salary integer,
  preferred_locations text[] DEFAULT ARRAY[]::text[],
  remote_only boolean DEFAULT false,
  min_experience integer DEFAULT 0,
  max_experience integer DEFAULT 15,
  resume_json jsonb DEFAULT '{}'::jsonb,
  email_notifications boolean DEFAULT true,
  notification_frequency text DEFAULT 'immediate' CHECK (notification_frequency IN ('immediate', 'daily', 'weekly')),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create portals table
CREATE TABLE IF NOT EXISTS portals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE portals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view portals"
  ON portals FOR SELECT
  TO authenticated
  USING (true);

-- Create user_portal_settings table
CREATE TABLE IF NOT EXISTS user_portal_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  portal_id uuid NOT NULL REFERENCES portals(id) ON DELETE CASCADE,
  is_enabled boolean DEFAULT true,
  priority integer DEFAULT 1,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, portal_id)
);

ALTER TABLE user_portal_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own portal settings"
  ON user_portal_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own portal settings"
  ON user_portal_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portal settings"
  ON user_portal_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  portal_id uuid NOT NULL REFERENCES portals(id) ON DELETE CASCADE,
  title text NOT NULL,
  company text NOT NULL,
  location text,
  salary_min integer,
  salary_max integer,
  description text,
  requirements text,
  score integer DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  ai_analysis jsonb DEFAULT '{}'::jsonb,
  external_url text,
  scraped_at timestamptz DEFAULT now(),
  slot text CHECK (slot IN ('slot_1', 'slot_2', 'slot_3', 'slot_4')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own jobs"
  ON jobs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'not_applied' CHECK (status IN ('not_applied', 'applied', 'callback', 'interview', 'offer', 'rejected')),
  applied_date date,
  callback_date date,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, job_id)
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own applications"
  ON applications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications"
  ON applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications"
  ON applications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own applications"
  ON applications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert default portals
INSERT INTO portals (name, display_name, is_active) VALUES
  ('linkedin', 'LinkedIn', true),
  ('naukri', 'Naukri.com', true),
  ('indeed', 'Indeed', true),
  ('instahyre', 'Instahyre', true),
  ('wellfound', 'Wellfound', true),
  ('cutshort', 'Cutshort', true)
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_score ON jobs(score DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_user_portal_settings_user_id ON user_portal_settings(user_id);