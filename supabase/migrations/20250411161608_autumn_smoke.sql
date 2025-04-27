/*
  # Fix units table policies

  1. Changes
    - Add check for existing policies before creating them
    - Create units table if it doesn't exist
    - Add recipe count function
  
  2. Security
    - Only create policies if they don't exist
*/

-- Create units table if it doesn't exist
CREATE TABLE IF NOT EXISTS units (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT NOW()
);

-- Enable RLS if not already enabled
ALTER TABLE units ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  -- Drop policies if they exist
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'units' AND policyname = 'Enable read access for all users'
  ) THEN
    DROP POLICY "Enable read access for all users" ON units;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'units' AND policyname = 'Enable insert for authenticated users'
  ) THEN
    DROP POLICY "Enable insert for authenticated users" ON units;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'units' AND policyname = 'Enable update for authenticated users'
  ) THEN
    DROP POLICY "Enable update for authenticated users" ON units;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'units' AND policyname = 'Enable delete for authenticated users'
  ) THEN
    DROP POLICY "Enable delete for authenticated users" ON units;
  END IF;
END $$;

-- Create new policies
CREATE POLICY "Enable read access for all users" ON units
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users" ON units
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON units
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Enable delete for authenticated users" ON units
  FOR DELETE TO authenticated
  USING (true);

-- Add unit_id to ingredients if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ingredients' AND column_name = 'unit_id'
  ) THEN
    ALTER TABLE ingredients ADD COLUMN unit_id uuid REFERENCES units(id);
  END IF;
END $$;

-- Create or replace the recipe count function
CREATE OR REPLACE FUNCTION get_unit_recipe_count(unit_row units)
RETURNS bigint
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(DISTINCT i.recipe_id)
  FROM ingredients i
  WHERE i.unit_id = unit_row.id;
$$;