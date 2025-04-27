/*
  # Fix Storage Configuration

  1. Changes
    - Update recipes bucket to be public
    - Add proper storage policies
*/

-- Update recipes bucket to be public
UPDATE storage.buckets
SET public = true
WHERE id = 'recipes';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete files" ON storage.objects;

-- Create new policies
CREATE POLICY "Recipe images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'recipes');

CREATE POLICY "Users can upload recipe images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'recipes');

CREATE POLICY "Users can update recipe images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'recipes');

CREATE POLICY "Users can delete recipe images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'recipes');