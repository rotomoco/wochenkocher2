import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Trash2 } from 'lucide-react';
import { Recipe } from '../types';
import { fetchRecipes } from '../lib/api';

interface Ingredient {
  name: string;
  recipes: Recipe[];
  units: string[];
}

const ZutatenView: React.FC = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<string>('');

  useEffect(() => {
    loadIngredients();
  }, []);

  const loadIngredients = async () => {
    try {
      const recipes = await fetchRecipes();
      const ingredientMap = new Map<string, Ingredient>();

      recipes.forEach(recipe => {
        recipe.ingredients.forEach(ing => {
          const existing = ingredientMap.get(ing.name);
          if (existing) {
            existing.recipes.push(recipe);
            if (!existing.units.includes(ing.unit)) {
              existing.units.push(ing.unit);
            }
          } else {
            ingredientMap.set(ing.name, {
              name: ing.name,
              recipes: [recipe],
              units: [ing.unit]
            });
          }
        });
      });

      setIngredients(Array.from(ingredientMap.values()));
      setLoading(false);
    } catch (err) {
      setError('Fehler beim Laden der Zutaten');
      setLoading(false);
    }
  };

  const handleDeleteIngredient = async (ingredient: Ingredient) => {
    if (!confirm(`Möchtest du "${ingredient.name}" wirklich löschen?`)) return;

    try {
      // Here you would typically make an API call to delete the ingredient
      // For now, we'll just update the local state
      setIngredients(prev => prev.filter(ing => ing.name !== ingredient.name));
    } catch (err) {
      setError('Fehler beim Löschen der Zutat');
    }
  };

  const filteredIngredients = ingredients.filter(ingredient => {
    const matchesSearch = ingredient.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUnit = !selectedUnit || ingredient.units.includes(selectedUnit);
    return matchesSearch && matchesUnit;
  });

  const allUnits = Array.from(
    new Set(ingredients.flatMap(ing => ing.units))
  ).sort();

  if (loading) {
    return <div className="flex justify-center items-center h-64">Laden...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Zutaten</h1>
        <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
          <Plus className="w-5 h-5 mr-2" />
          Neue Zutat
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Nach Zutaten suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <Filter className="w-5 h-5 mr-2" />
            Filter
          </button>
        </div>

        {showFilters && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Einheit</h3>
            <div className="flex flex-wrap gap-2">
              {allUnits.map(unit => (
                <button
                  key={unit}
                  onClick={() => setSelectedUnit(selectedUnit === unit ? '' : unit)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedUnit === unit
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Name</th>
                <th className="text-left py-3 px-4">Einheiten</th>
                <th className="text-left py-3 px-4">Verwendung</th>
                <th className="text-right py-3 px-4">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {filteredIngredients.map(ingredient => (
                <tr key={ingredient.name} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{ingredient.name}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {ingredient.units.map(unit => (
                        <span
                          key={unit}
                          className="px-2 py-0.5 bg-gray-100 text-xs rounded-full"
                        >
                          {unit}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-500">
                      {ingredient.recipes.length} Rezepte
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDeleteIngredient(ingredient)}
                      className="text-red-500 hover:text-red-700"
                      title="Zutat löschen"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredIngredients.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">Keine Zutaten gefunden</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ZutatenView;