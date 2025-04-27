import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChefHat, Clock, Filter } from 'lucide-react';
import { Recipe } from '../types';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const SucheView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  useEffect(() => {
    loadTags();
  }, []);

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
      toast.error('Fehler beim Laden der Tags');
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      let query = supabase
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

      // Add search filter if searchTerm exists
      if (searchTerm.trim()) {
        query = query.or(`
          name.ilike.%${searchTerm}%,
          recipe.ilike.%${searchTerm}%,
          ingredients.name.ilike.%${searchTerm}%
        `);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform the data to match the Recipe type
      let filteredRecipes = (data || []).map(recipe => ({
        ...recipe,
        tags: recipe.recipe_tags?.map(rt => rt.tags.name) || []
      }));

      // Filter by selected tags
      if (selectedTags.length > 0) {
        filteredRecipes = filteredRecipes.filter(recipe =>
          selectedTags.every(tag => recipe.tags?.includes(tag))
        );
      }

      setRecipes(filteredRecipes);
      setError(null);
    } catch (err) {
      console.error('Error searching recipes:', err);
      setError('Fehler bei der Suche');
      toast.error('Fehler bei der Suche');
    } finally {
      setLoading(false);
    }
  };

  // Automatically search when tags are changed
  useEffect(() => {
    if (searchTerm.trim() || selectedTags.length > 0) {
      handleSearch();
    } else {
      setRecipes([]);
    }
  }, [searchTerm, selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Rezepte suchen</h1>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Nach Gerichten, Zutaten oder Beschreibungen suchen..."
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
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Suche läuft...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map(recipe => (
            <Link
              key={recipe.id}
              to={`/gericht/${recipe.id}`}
              className="block bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
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
      )}

      {!loading && recipes.length === 0 && (searchTerm || selectedTags.length > 0) && (
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
  );
};

export default SucheView;