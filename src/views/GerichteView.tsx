import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, ChefHat, Clock, Filter } from 'lucide-react';
import { Recipe } from '../types';
import { supabase } from '../lib/supabase';

const GerichteView: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  useEffect(() => {
    loadRecipes();
    loadTags();
  }, []);

  useEffect(() => {
    filterRecipes();
  }, [searchTerm, selectedTags, recipes]);

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

      // Transform the data to match the Recipe type
      const transformedRecipes = (data || []).map(recipe => ({
        ...recipe,
        tags: recipe.recipe_tags?.map(rt => rt.tags.name) || []
      }));

      setRecipes(transformedRecipes);
      setFilteredRecipes(transformedRecipes);
      setLoading(false);
    } catch (err) {
      console.error('Error loading recipes:', err);
      setError('Fehler beim Laden der Rezepte');
      setLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('name')
        .order('name');

      if (error) throw error;
      setAvailableTags(data.map(tag => tag.name));
    } catch (err) {
      console.error('Error loading tags:', err);
    }
  };

  const filterRecipes = () => {
    let filtered = recipes;

    // Suchwort filtern
    if (searchTerm) {
      filtered = filtered.filter(recipe =>
        recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.ingredients.some(ing => 
          ing.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Tags filtern
    if (selectedTags.length > 0) {
      filtered = filtered.filter(recipe =>
        selectedTags.every(tag => recipe.tags?.includes(tag))
      );
    }

    setFilteredRecipes(filtered);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Laden...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gerichteübersicht</h1>
        <Link
          to="/neues-gericht"
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Neues Gericht
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Nach Gerichten oder Zutaten suchen..."
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
            <h3 className="text-sm font-medium text-gray-700 mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    selectedTags.includes(tag)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map(recipe => (
            <Link
              key={recipe.id}
              to={`/gericht/${recipe.id}`}
              className="block bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative h-48">
                {recipe.image ? (
                  <img
                    src={recipe.image}
                    alt={recipe.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <ChefHat className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2">{recipe.name}</h3>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>30 Min</span>
                </div>
                {recipe.tags && recipe.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {recipe.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>

        {filteredRecipes.length === 0 && (
          <div className="text-center py-12">
            <ChefHat className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Keine Gerichte gefunden
            </h3>
            <p className="text-gray-500">
              Versuche es mit anderen Suchbegriffen oder Filtern
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GerichteView;