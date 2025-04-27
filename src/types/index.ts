export interface Recipe {
  id: string;
  name: string;
  ingredients: Ingredient[];
  image?: string;
  recipe: string;
  tags?: string[];
  created_at?: string;
  preparation_time?: number | null;
}

export type Unit = 'g' | 'kg' | 'Stk' | 'TL' | 'EL' | 'ml' | 'l' | 'Prise' | 'Bund' | 'Packung';

export interface Ingredient {
  amount: number;
  unit: Unit;
  name: string;
}

export interface WeekPlan {
  id: string;
  weekStart: Date;
  weekEnd: Date;
  meals: {
    day: string;
    recipe: Recipe;
    date: Date;
  }[];
}

export interface Settings {
  weeklyPlanningNotification: boolean;
  dailyRecipeNotification: boolean;
  shoppingListNotification: boolean;
  darkMode: boolean;
  primaryColor: string;
  weeklyPlanningTime: string;
  dailyRecipeTime: string;
  shoppingListTime: string;
  weeklyPlanningDay: number;
  shoppingListDay: number;
}

export interface NotificationTime {
  hours: number;
  minutes: number;
}

export interface Profile {
  id: string;
  avatar_url: string | null;
  updated_at: string;
}