/*
# Add Tags Management

1. New Tables
  - `tags`
    - `id` (uuid, primary key)
    - `name` (text, unique)
    - `color` (text)
    - `created_at` (timestamptz)

2. Changes
  - Modify `recipes` table to use a many-to-many relationship with tags
  - Add `recipe_tags` junction table

3. Security
  - Enable RLS on new tables
  - Add policies for authenticated users
*/

-- Create tags table
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#22c55e',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create junction table for recipes and tags
CREATE TABLE recipe_tags (
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (recipe_id, tag_id)
);

-- Migrate existing tags from recipes table
INSERT INTO tags (name, color)
SELECT DISTINCT jsonb_array_elements_text(tags) as tag_name, '#22c55e' as color
FROM recipes
WHERE tags IS NOT NULL AND jsonb_array_length(tags) > 0;

-- Insert into junction table
INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id
FROM recipes r
CROSS JOIN LATERAL jsonb_array_elements_text(r.tags) as tag_name
JOIN tags t ON t.name = tag_name;

-- Remove old tags column
ALTER TABLE recipes DROP COLUMN tags;

-- Enable RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_tags ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON tags
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON tags
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON tags
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete for authenticated users" ON tags
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "Enable read access for all users" ON recipe_tags
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON recipe_tags
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON recipe_tags
  FOR DELETE TO authenticated USING (true);