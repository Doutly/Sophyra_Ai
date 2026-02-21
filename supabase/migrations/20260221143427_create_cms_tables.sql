/*
  # Create CMS Tables for Sophyra Admin

  ## Summary
  Creates four new tables to support the admin content management system:
  blog posts, career listings, job applications, and contact form submissions.

  ## New Tables

  ### 1. `blogs`
  - `id` (uuid, primary key)
  - `title` (text) — post title
  - `slug` (text, unique) — URL-friendly identifier
  - `cover_image_url` (text) — cover photo URL
  - `author` (text) — author display name
  - `category` (text) — post category tag
  - `excerpt` (text) — short preview text
  - `content` (text) — full post body (markdown/HTML)
  - `is_published` (boolean, default false)
  - `published_at` (timestamptz) — when it was published
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `careers`
  - `id` (uuid, primary key)
  - `title` (text) — job title
  - `department` (text)
  - `location` (text)
  - `type` (text) — Full-time / Part-time / Contract / Internship
  - `description` (text) — short description
  - `requirements` (text) — job requirements
  - `is_active` (boolean, default true)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. `job_applications`
  - `id` (uuid, primary key)
  - `career_id` (uuid, FK → careers)
  - `name` (text)
  - `email` (text)
  - `phone` (text)
  - `resume_url` (text)
  - `created_at` (timestamptz)

  ### 4. `contact_submissions`
  - `id` (uuid, primary key)
  - `name` (text)
  - `email` (text)
  - `phone` (text, nullable)
  - `message` (text)
  - `is_read` (boolean, default false)
  - `source` (text) — 'contact' or 'university'
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Blogs and careers readable by anyone (public content)
  - Inserts allowed for job_applications and contact_submissions (unauthenticated)
  - No direct authenticated update/delete from client (admin manages via service role)
*/

-- ─── blogs ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  slug text UNIQUE NOT NULL DEFAULT '',
  cover_image_url text DEFAULT '',
  author text NOT NULL DEFAULT 'Sophyra AI',
  category text NOT NULL DEFAULT 'General',
  excerpt text DEFAULT '',
  content text DEFAULT '',
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published blogs"
  ON blogs FOR SELECT
  USING (is_published = true);

-- ─── careers ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS careers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  department text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT 'Remote',
  type text NOT NULL DEFAULT 'Full-time',
  description text DEFAULT '',
  requirements text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE careers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active careers"
  ON careers FOR SELECT
  USING (is_active = true);

-- ─── job_applications ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  career_id uuid NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  resume_url text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a job application"
  ON job_applications FOR INSERT
  WITH CHECK (true);

-- ─── contact_submissions ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  message text NOT NULL DEFAULT '',
  is_read boolean NOT NULL DEFAULT false,
  source text NOT NULL DEFAULT 'contact',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact form"
  ON contact_submissions FOR INSERT
  WITH CHECK (true);
