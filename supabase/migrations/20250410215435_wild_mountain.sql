/*
  # Create Storage Bucket for Recipe Images

  1. New Storage Bucket
    - Name: recipes
    - Public access: false
    - File size limit: 5MB
    - Allowed mime types: image/*

  2. Security
    - Enable RLS policies for authenticated users to:
      - Upload images
      - Read images
      - Update their images
      - Delete their images
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'recipes',
  'recipes',
  false,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[]
);

-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'recipes');

-- Allow authenticated users to update their files
CREATE POLICY "Allow authenticated users to update files"
ON storage.objects FOR UPDATE TO authenticated 
USING (bucket_id = 'recipes');

-- Allow authenticated users to read files
CREATE POLICY "Allow authenticated users to read files"
ON storage.objects FOR SELECT TO authenticated 
USING (bucket_id = 'recipes');

-- Allow authenticated users to delete their files
CREATE POLICY "Allow authenticated users to delete files"
ON storage.objects FOR DELETE TO authenticated 
USING (bucket_id = 'recipes');