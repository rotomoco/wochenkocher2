import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, addDays, startOfWeek } from 'date-fns';
import { de } from 'date-fns/locale';
import { ChefHat, Plus, ArrowLeft, ArrowRight, Search, Shuffle, Save } from 'lucide-react';
import { Recipe } from '../types';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const WochenplanungView: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedRecipes, setSelectedRecipes] = useState<{ [key: string]: Recipe }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState<string | null>(null);

  useEffect(() => {
    loadRecipes();
    loadCurrentWeekPlan();
  }, []);

  const loadRecipes = async () => {
    try {
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

      const transformedRecipes = (data || []).map(recipe => ({
        ...recipe,
        tags: recipe.recipe_tags?.map(rt => rt.tags.name) || []
      }));

      setRecipes(transformedRecipes);
      setLoading(false);
    } catch (err) {
      console.error('Error loading recipes:', err);
      setError('Fehler beim Laden der Rezepte');
      setLoading(false);
    }
  };

  const loadCurrentWeekPlan = async () => {
    try {
      // Delete any existing week plans for the current week to avoid duplicates
      const weekStartDate = format(weekStart, 'yyyy-MM-dd');
      const weekEndDate = format(addDays(weekStart, 6), 'yyyy-MM-dd');

      const { data: existingPlans } = await supabase
        .from('week_plans')
        .select('id')
        .gte('week_start', weekStartDate)
        .lte('week_end', weekEndDate);

      if (existingPlans && existingPlans.length > 0) {
        const { data: meals } = await supabase
          .from('week_plan_meals')
          .select(`
            day,
            date,
            recipes (
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
            )
          `)
          .eq('week_plan_id', existingPlans[0].id);

        if (meals) {
          const recipeMap: { [key: string]: Recipe } = {};
          meals.forEach(meal => {
            if (meal.recipes) {
              const recipe = {
                ...meal.recipes,
                tags: meal.recipes.recipe_tags?.map(rt => rt.tags.name) || []
              };
              recipeMap[format(new Date(meal.date), 'yyyy-MM-dd')] = recipe;
            }
          });
          setSelectedRecipes(recipeMap);
        }
      }
    } catch (err) {
      console.error('Error loading week plan:', err);
      toast.error('Fehler beim Laden des Wochenplans');
    }
  };

  const handlePreviousWeek = () => {
    setWeekStart(prev => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    setWeekStart(prev => addDays(prev, 7));
  };

  const handleSelectRecipe = (date: Date, recipe: Recipe) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    setSelectedRecipes(prev => ({
      ...prev,
      [dateStr]: recipe
    }));
    setShowDropdown(null);
  };

  const handleRemoveRecipe = (dateStr: string) => {
    setSelectedRecipes(prev => {
      const newRecipes = { ...prev };
      delete newRecipes[dateStr];
      return newRecipes;
    });
  };

  const handleRandomFill = () => {
    if (recipes.length === 0) return;

    const availableDates = Array.from({ length: 7 }, (_, i) => 
      format(addDays(weekStart, i), 'yyyy-MM-dd')
    );

    const availableRecipes = [...recipes];
    const newSelectedRecipes = { ...selectedRecipes };

    availableDates.forEach(dateStr => {
      if (!newSelectedRecipes[dateStr] && availableRecipes.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableRecipes.length);
        const recipe = availableRecipes.splice(randomIndex, 1)[0];
        newSelectedRecipes[dateStr] = recipe;
      }
    });

    setSelectedRecipes(newSelectedRecipes);
    toast.success('Woche wurde zufällig gefüllt');
  };

  const handleSaveWeekPlan = async () => {
    try {
      // Delete any existing week plans for the current week to avoid duplicates
      const weekStartDate = format(weekStart, 'yyyy-MM-dd');
      const weekEndDate = format(addDays(weekStart, 6), 'yyyy-MM-dd');

      const { data: existingPlans } = await supabase
        .from('week_plans')
        .select('id')
        .gte('week_start', weekStartDate)
        .lte('week_end', weekEndDate);

      if (existingPlans && existingPlans.length > 0) {
        const { error: deleteError } = await supabase
          .from('week_plans')
          .delete()
          .in('id', existingPlans.map(plan => plan.id));

        if (deleteError) throw deleteError;
      }

      // Create new week plan
      const { data: weekPlan, error: weekPlanError } = await supabase
        .from('week_plans')
        .insert({
          week_start: weekStartDate,
          week_end: weekEndDate
        })
        .select()
        .single();

      if (weekPlanError) throw weekPlanError;

      // Create meals for each day
      const meals = Object.entries(selectedRecipes).map(([dateStr, recipe]) => ({
        week_plan_id: weekPlan.id,
        day: format(new Date(dateStr), 'EEEE', { locale: de }),
        recipe_id: recipe.id,
        date: dateStr
      }));

      if (meals.length > 0) {
        const { error: mealsError } = await supabase
          .from('week_plan_meals')
          .insert(meals);

        if (mealsError) throw mealsError;
      }

      toast.success('Wochenplan wurde gespeichert');
      await loadCurrentWeekPlan();
    } catch (err) {
      console.error('Error saving week plan:', err);
      toast.error('Fehler beim Speichern des Wochenplans');
    }
  };

  const filteredRecipes = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.ingredients.some(ing => 
      ing.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (loading) {
    return <div className="flex justify-center items-center h-64">Laden...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto pb-24">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Wochenplanung</h1>
        <button
          onClick={handleRandomFill}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center"
        >
          <Shuffle className="w-5 h-5 mr-2" />
          Zufällig füllen
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-8 bg-white rounded-lg shadow p-4">
        <button
          onClick={handlePreviousWeek}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-lg font-medium">
          {format(weekStart, 'd. MMMM yyyy', { locale: de })} - {' '}
          {format(addDays(weekStart, 6), 'd. MMMM yyyy', { locale: de })}
        </span>
        <button
          onClick={handleNextWeek}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Week Plan */}
      <div className="space-y-4">
        {Array.from({ length: 7 }).map((_, index) => {
          const date = addDays(weekStart, index);
          const dateStr = format(date, 'yyyy-MM-dd');
          const selectedRecipe = selectedRecipes[dateStr];
          const isDropdownOpen = showDropdown === dateStr;

          return (
            <div
              key={dateStr}
              className="bg-white rounded-lg shadow p-4"
            >
              <h3 className="font-medium mb-3">
                {format(date, 'EEEE, d. MMMM', { locale: de })}
              </h3>
              {selectedRecipe ? (
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    {selectedRecipe.image ? (
                      <img
                        src={selectedRecipe.image}
                        alt={selectedRecipe.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ChefHat className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{selectedRecipe.name}</p>
                      <Link
                        to={`/gericht/${selectedRecipe.id}`}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Plus className="w-4 h-4" />
                      </Link>
                    </div>
                    <button
                      onClick={() => handleRemoveRecipe(dateStr)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Entfernen
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(isDropdownOpen ? null : dateStr)}
                    className="w-full flex items-center justify-center h-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 hover:bg-gray-100 transition-colors"
                  >
                    <Plus className="w-6 h-6 text-gray-400 mr-2" />
                    <span className="text-gray-600">Gericht auswählen</span>
                  </button>
                  
                  {isDropdownOpen && (
                    <div className="absolute z-10 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200">
                      <div className="p-2">
                        <div className="relative mb-2">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            type="text"
                            placeholder="Gericht suchen..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          {filteredRecipes.map(recipe => (
                            <button
                              key={recipe.id}
                              onClick={() => handleSelectRecipe(date, recipe)}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg flex items-center space-x-3"
                            >
                              <div className="w-10 h-10 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                                {recipe.image ? (
                                  <img
                                    src={recipe.image}
                                    alt={recipe.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <ChefHat className="w-4 h-4 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <span className="flex-1">{recipe.name}</span>
                            </button>
                          ))}
                          {filteredRecipes.length === 0 && (
                            <div className="text-center py-4 text-gray-500 text-sm">
                              Keine Gerichte gefunden
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <button
          onClick={handleSaveWeekPlan}
          className="flex items-center px-6 py-3 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-colors"
        >
          <Save className="w-5 h-5 mr-2" />
          Wochenplan speichern
        </button>
      </div>
    </div>
  );
};

export default WochenplanungView;