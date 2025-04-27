/*
  # Add notification time settings

  1. Changes
    - Add notification time columns to settings table
    - Set default times for notifications
*/

-- Add notification time columns to settings table
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS weekly_planning_time TIME DEFAULT '09:00',
ADD COLUMN IF NOT EXISTS daily_recipe_time TIME DEFAULT '09:00',
ADD COLUMN IF NOT EXISTS shopping_list_time TIME DEFAULT '09:00',
ADD COLUMN IF NOT EXISTS weekly_planning_day INTEGER DEFAULT 0, -- 0 = Sunday
ADD COLUMN IF NOT EXISTS shopping_list_day INTEGER DEFAULT 1;  -- 1 = Monday