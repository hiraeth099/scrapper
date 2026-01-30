-- Sample Data for Job Hunter Dashboard
-- Run this AFTER creating users via Supabase Auth UI

-- Note: Replace the UUIDs below with actual user IDs from your auth.users table

-- Example: If you created a user with email john@jobhunter.local,
-- copy their UUID from the Supabase Auth dashboard and use it below

-- Sample user profiles (update IDs with real user IDs)
-- INSERT INTO user_profiles (id, username, name, assigned_slot, status, role) VALUES
-- ('YOUR-USER-UUID-HERE', 'john', 'John Doe', 'slot_1', 'active', 'user'),
-- ('YOUR-USER-UUID-HERE', 'sarah', 'Sarah Johnson', 'slot_2', 'active', 'user'),
-- ('YOUR-USER-UUID-HERE', 'mike', 'Mike Chen', 'slot_3', 'active', 'user'),
-- ('YOUR-USER-UUID-HERE', 'emma', 'Emma Wilson', 'slot_4', 'active', 'admin');

-- Sample preferences for a user (update user_id with real user ID)
-- INSERT INTO user_preferences (user_id, target_roles, min_salary, preferred_locations, remote_only, min_experience, max_experience, resume_json) VALUES
-- ('YOUR-USER-UUID-HERE',
--  ARRAY['Platform Engineer', 'DevOps Engineer', 'SRE'],
--  1200000,
--  ARRAY['Bangalore', 'Hyderabad', 'Remote'],
--  false,
--  3,
--  8,
--  '{"experience_years": 5, "current_role": "Platform Engineer", "skills": ["Kubernetes", "AWS", "Python", "Terraform", "Docker"], "certifications": ["AWS Solutions Architect"], "education": "B.Tech Computer Science"}'::jsonb
-- );

-- Sample jobs (update user_id and portal_id with real IDs)
-- First, get portal IDs:
-- SELECT id, name FROM portals;

-- Then insert sample jobs:
-- INSERT INTO jobs (user_id, portal_id, title, company, location, salary_min, salary_max, description, score, slot, ai_analysis) VALUES
-- ('YOUR-USER-UUID-HERE',
--  (SELECT id FROM portals WHERE name = 'linkedin'),
--  'Senior Platform Engineer',
--  'TechCorp Solutions',
--  'Bangalore',
--  1500000,
--  2500000,
--  'We are looking for an experienced Platform Engineer to build and maintain our cloud infrastructure...',
--  85,
--  'slot_1',
--  '{"skill_match": 85, "experience_match": 90, "location_match": 100, "salary_match": 95}'::jsonb
-- ),
-- ('YOUR-USER-UUID-HERE',
--  (SELECT id FROM portals WHERE name = 'naukri'),
--  'DevOps Engineer',
--  'StartupXYZ',
--  'Remote',
--  1200000,
--  1800000,
--  'Join our fast-growing startup as a DevOps Engineer...',
--  78,
--  'slot_1',
--  '{"skill_match": 80, "experience_match": 75, "location_match": 100, "salary_match": 70}'::jsonb
-- );

-- Quick reference for creating test users:
-- 1. Go to Supabase Auth → Add User
-- 2. Email: username@jobhunter.local (e.g., john@jobhunter.local)
-- 3. Password: YourSecurePassword123
-- 4. Auto Confirm: ✅
-- 5. Copy the generated UUID
-- 6. Add to user_profiles table with the UUID
-- 7. User logs in with just the username (john) and password

-- Portal credentials note:
-- Portal credentials (for actual scraping) should be stored securely by admin
-- and are NOT exposed to regular users. Users only toggle portals on/off.
