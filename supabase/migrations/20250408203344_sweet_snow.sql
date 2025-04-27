/*
  # Initial Schema Setup

  1. New Tables
    - `recipes`
      - `id` (uuid, primary key)
      - `name` (text)
      - `recipe` (text)
      - `image` (text, optional)
      - `tags` (jsonb)
      - `created_at` (timestamp)
    
    - `ingredients`
      - `recipe_id` (uuid, foreign key)
      - `amount` (decimal)
      - `unit` (text)
      - `name` (text)
    
    - `settings`
      - `id` (integer, primary key)
      - `weekly_planning_notification` (boolean)
      - `daily_recipe_notification` (boolean)
      - `shopping_list_notification` (boolean)
      - `dark_mode` (boolean)
      - `primary_color` (text)
    
    - `week_plans`
      - `id` (uuid, primary key)
      - `week_start` (timestamp)
      - `week_end` (timestamp)
      - `created_at` (timestamp)
    
    - `week_plan_meals`
      - `week_plan_id` (uuid, foreign key)
      - `day` (text)
      - `recipe_id` (uuid, foreign key)
      - `date` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Recipes table
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  recipe TEXT NOT NULL,
  image TEXT,
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ingredients table
CREATE TABLE ingredients (
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  amount DECIMAL NOT NULL,
  unit TEXT NOT NULL,
  name TEXT NOT NULL
);

-- Settings table
CREATE TABLE settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  weekly_planning_notification BOOLEAN DEFAULT FALSE,
  daily_recipe_notification BOOLEAN DEFAULT FALSE,
  shopping_list_notification BOOLEAN DEFAULT FALSE,
  dark_mode BOOLEAN DEFAULT FALSE,
  primary_color TEXT DEFAULT '#22c55e'
);

-- Week plans table
CREATE TABLE week_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_start TIMESTAMPTZ NOT NULL,
  week_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Week plan meals table
CREATE TABLE week_plan_meals (
  week_plan_id UUID REFERENCES week_plans(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL
);

-- Enable Row Level Security
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE week_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE week_plan_meals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON recipes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON recipes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON recipes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete for authenticated users" ON recipes FOR DELETE TO authenticated USING (true);

CREATE POLICY "Enable read access for all users" ON ingredients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON ingredients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON ingredients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete for authenticated users" ON ingredients FOR DELETE TO authenticated USING (true);

CREATE POLICY "Enable read access for all users" ON settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON settings FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable read access for all users" ON week_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON week_plans FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON week_plans FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete for authenticated users" ON week_plans FOR DELETE TO authenticated USING (true);

CREATE POLICY "Enable read access for all users" ON week_plan_meals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON week_plan_meals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users" ON week_plan_meals FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Enable delete for authenticated users" ON week_plan_meals FOR DELETE TO authenticated USING (true);