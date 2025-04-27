/*
  # Fix Storage Buckets Configuration

  1. Changes
    - Create recipes bucket if it doesn't exist
    - Update recipes bucket to be public
    - Add proper storage policies
*/

-- Create recipes bucket if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'recipes'
    ) THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('recipes', 'recipes', true);
    END IF;
END $$;

-- Update recipes bucket to be public
UPDATE storage.buckets
SET public = true
WHERE id = 'recipes';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Recipe images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete recipe images" ON storage.objects;

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