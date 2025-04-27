/*
  # Add Units Management

  1. New Tables
    - `units`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on new table
    - Add policies for authenticated users
*/

-- Create units table
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE units ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users"
  ON units FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON units FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON units FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Enable delete for authenticated users"
  ON units FOR DELETE
  TO authenticated
  USING (true);

-- Insert default units
INSERT INTO units (name) VALUES
  ('g'),
  ('kg'),
  ('Stk'),
  ('TL'),
  ('EL'),
  ('ml'),
  ('l'),
  ('Prise'),
  ('Bund'),
  ('Packung');