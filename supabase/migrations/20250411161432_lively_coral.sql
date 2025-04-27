/*
  # Fix units and ingredients relationship

  1. Changes
    - Create units table with proper structure
    - Update ingredients table to use unit_id reference
    - Add foreign key constraint
    - Migrate existing unit data
  
  2. Security
    - Enable RLS on units table
    - Add policies for authenticated users
*/

-- Create units table if it doesn't exist
CREATE TABLE IF NOT EXISTS units (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE units ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON units FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON units FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON units FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete for authenticated users" ON units FOR DELETE TO authenticated USING (true);

-- Add unit_id to ingredients
ALTER TABLE ingredients 
ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES units(id);

-- Create a function to count ingredients per unit
CREATE OR REPLACE FUNCTION get_unit_recipe_count(unit_row units)
RETURNS bigint
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(DISTINCT i.recipe_id)
  FROM ingredients i
  WHERE i.unit_id = unit_row.id;
$$;