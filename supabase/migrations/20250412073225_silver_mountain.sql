/*
  # Add Preparation Time to Recipes

  1. Changes
    - Add preparation_time column to recipes table
    - Default value is NULL to indicate no time set
    - Time is stored in minutes as an integer

  2. Security
    - No additional security needed as recipes table already has RLS enabled
*/

-- Add preparation_time column to recipes table
ALTER TABLE recipes
ADD COLUMN IF NOT EXISTS preparation_time INTEGER;

-- Update existing recipes to have NULL preparation_time
UPDATE recipes SET preparation_time = NULL;