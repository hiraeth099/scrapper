# Job Hunter Dashboard - Setup Guide

A premium multi-user job hunting lead generation system for tracking and managing job applications.

## Features

- **Multi-user Dashboard** - Support for 4 users with dedicated time slots
- **Job Scraping** - Automated job scraping from multiple portals at scheduled times
- **AI Scoring** - Jobs are scored 0-100 based on user preferences
- **Application Tracking** - Kanban board and list view for tracking applications
- **Analytics** - Comprehensive analytics and insights
- **Portal Management** - Users can enable/disable portals and set priorities
- **Preferences** - Customizable job preferences and resume data

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Icons**: Lucide React

## Admin Setup - Creating Users

As the admin, you need to manually create user accounts. Here's how:

### Step 1: Create Auth User in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Users**
3. Click **Add User** → **Create new user**
4. Fill in the details:
   - **Email**: Use format `username@jobhunter.local` (e.g., `john@jobhunter.local`)
   - **Password**: Create a secure password
   - **Auto Confirm User**: ✅ Check this box

### Step 2: Create User Profile

After creating the auth user, you need to add their profile to the database:

1. Go to **Table Editor** → **user_profiles**
2. Click **Insert** → **Insert row**
3. Fill in the details:
   - **id**: Copy the user's UUID from the Authentication page
   - **username**: The username part (e.g., `john`)
   - **name**: Full name (e.g., `John Doe`)
   - **assigned_slot**: Choose from `slot_1`, `slot_2`, `slot_3`, or `slot_4`
   - **status**: `active`
   - **role**: `user` (or `admin` for admin access)

### Step 3: User Login

Users can now log in with:
- **Username**: `john` (just the username part, not the full email)
- **Password**: The password you set

## Time Slots

The system has 4 daily scraping slots:

- **Slot 1**: 6:00 AM IST (Early Morning 🌅)
- **Slot 2**: 10:00 AM IST (Morning ☀️)
- **Slot 3**: 2:00 PM IST (Afternoon 🌤️)
- **Slot 4**: 6:00 PM IST (Evening 🌆)

Assign one slot to each user when creating their profile.

## Example User Creation

Here's a complete example:

### Auth User (in Supabase Auth):
```
Email: sarah@jobhunter.local
Password: SecurePass123!
Auto Confirm: Yes
```

### User Profile (in user_profiles table):
```
id: <copy from auth.users table>
username: sarah
name: Sarah Johnson
assigned_slot: slot_2
status: active
role: user
```

### User Login:
```
Username: sarah
Password: SecurePass123!
```

## Portal Credentials

Portal login credentials (LinkedIn, Naukri, etc.) are managed by the admin and stored securely. Users can only:
- Toggle portals on/off
- Set scraping priority (1-6)

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Database Schema

The application uses the following main tables:
- `user_profiles` - User information and slot assignments
- `user_preferences` - Job search preferences
- `portals` - Available job portals
- `user_portal_settings` - User-specific portal configurations
- `jobs` - Scraped job listings
- `applications` - Application tracking

All tables have Row Level Security (RLS) enabled, ensuring users can only access their own data.

## Security Notes

- All users can only see their own jobs and applications
- Portal credentials are managed by admin only
- Time slots cannot be changed by users
- RLS policies enforce data isolation between users
