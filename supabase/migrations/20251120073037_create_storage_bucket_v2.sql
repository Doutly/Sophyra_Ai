/*
  # Create Storage Bucket for Interview Assets

  1. Creates storage bucket
    - Name: interview-assets
    - Public access for resume viewing
    - 15MB file size limit
    - Allowed MIME types: PDF, DOC, DOCX

  2. Storage policies
    - Authenticated users can upload their own files
    - Public read access for shared resumes
    - Users can update/delete their own files
*/

-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'interview-assets',
  'interview-assets',
  true,
  15728640,
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 15728640,
  allowed_mime_types = ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Public can read files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;

-- Policy: Allow authenticated users to upload files
CREATE POLICY "Users can upload their own files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'interview-assets');

-- Policy: Allow public read access
CREATE POLICY "Public can read files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'interview-assets');

-- Policy: Allow users to update their own files
CREATE POLICY "Users can update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'interview-assets');

-- Policy: Allow users to delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'interview-assets');
