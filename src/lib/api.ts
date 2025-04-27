import { createClient } from '@supabase/supabase-js';
import { Recipe, Settings, WeekPlan } from '../types';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export async function fetchRecipes(): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select(`
      id,
      name,
      recipe,
      image,
      created_at,
      ingredients (
        amount,
        unit,
        name
      ),
      recipe_tags (
        tags (
          name
        )
      )
    `);

  if (error) throw error;

  // Transform the data to match the expected Recipe type
  return (data || []).map(recipe => ({
    ...recipe,
    tags: recipe.recipe_tags?.map(rt => rt.tags.name) || []
  }));
}

export async function fetchSettings(): Promise<Settings> {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No settings found, return defaults
      return {
        weeklyPlanningNotification: false,
        dailyRecipeNotification: false,
        shoppingListNotification: false,
        darkMode: false,
        primaryColor: '#22c55e'
      };
    }
    throw error;
  }

  return {
    weeklyPlanningNotification: data.weekly_planning_notification,
    dailyRecipeNotification: data.daily_recipe_notification,
    shoppingListNotification: data.shopping_list_notification,
    darkMode: data.dark_mode,
    primaryColor: data.primary_color
  };
}

export async function updateSettings(settings: Settings): Promise<Settings> {
  const { data, error } = await supabase
    .from('settings')
    .upsert({
      id: 1,
      weekly_planning_notification: settings.weeklyPlanningNotification,
      daily_recipe_notification: settings.dailyRecipeNotification,
      shopping_list_notification: settings.shoppingListNotification,
      dark_mode: settings.darkMode,
      primary_color: settings.primaryColor
    })
    .select()
    .single();

  if (error) throw error;

  return {
    weeklyPlanningNotification: data.weekly_planning_notification,
    dailyRecipeNotification: data.daily_recipe_notification,
    shoppingListNotification: data.shopping_list_notification,
    darkMode: data.dark_mode,
    primaryColor: data.primary_color
  };
}

export async function fetchCurrentWeekPlan(): Promise<WeekPlan | null> {
  const { data: weekPlans, error: weekPlanError } = await supabase
    .from('week_plans')
    .select('*')
    .order('week_start', { ascending: false })
    .limit(1);

  if (weekPlanError) throw weekPlanError;
  if (!weekPlans || weekPlans.length === 0) return null;

  const weekPlan = weekPlans[0];

  const { data: meals, error: mealsError } = await supabase
    .from('week_plan_meals')
    .select(`
      day,
      date,
      recipes (
        id,
        name,
        recipe,
        image,
        ingredients (
          amount,
          unit,
          name
        ),
        recipe_tags (
          tags (
            name
          )
        )
      )
    `)
    .eq('week_plan_id', weekPlan.id);

  if (mealsError) throw mealsError;

  return {
    id: weekPlan.id,
    weekStart: new Date(weekPlan.week_start),
    weekEnd: new Date(weekPlan.week_end),
    meals: meals?.map(meal => ({
      day: meal.day,
      date: new Date(meal.date),
      recipe: {
        id: meal.recipes.id,
        name: meal.recipes.name,
        recipe: meal.recipes.recipe,
        image: meal.recipes.image,
        tags: meal.recipes.recipe_tags?.map(rt => rt.tags.name) || [],
        ingredients: meal.recipes.ingredients
      }
    })) || []
  };
}