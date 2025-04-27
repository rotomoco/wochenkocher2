import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Minus, Upload, X } from 'lucide-react';
import { Recipe, Ingredient } from '../types';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const NeuesGerichtView: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [newIngredient, setNewIngredient] = useState({
    amount: 1,
    unit: 'Stk' as const,
    name: ''
  });
  const [recipe, setRecipe] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableTags = ['Vegetarisch', 'Vegan', 'Schnell', 'Aufwendig', 'Pasta', 'Fleisch', 'Fisch', 'Suppe'];
  const units = ['g', 'kg', 'Stk', 'TL', 'EL'] as const;

  const handleAddIngredient = () => {
    if (!newIngredient.name.trim() || newIngredient.amount <= 0) return;

    setIngredients([...ingredients, { ...newIngredient }]);
    setNewIngredient({
      amount: 1,
      unit: 'Stk',
      name: ''
    });
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleAddTag = () => {
    if (!newTag || tags.includes(newTag)) return;
    setTags([...tags, newTag]);
    setNewTag('');
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedFile = await compressImage(file);
      const fileName = `${Date.now()}-${file.name}`;
      
      const { data, error } = await supabase.storage
        .from('recipes')
        .upload(fileName, compressedFile);

      if (error) throw error;

      const imageUrl = getImageUrl(fileName);
      setImage(imageUrl);
    } catch (err) {
      console.error('Error uploading image:', err);
      toast.error('Fehler beim Hochladen des Bildes');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || ingredients.length === 0 || !recipe) {
      setError('Bitte fülle alle Pflichtfelder aus');
      return;
    }

    setLoading(true);
    try {
      // First, insert the recipe
      const { data: recipeData, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          name,
          recipe,
          image,
          tags
        })
        .select()
        .single();

      if (recipeError) throw recipeError;

      // Then, insert all ingredients
      const { error: ingredientsError } = await supabase
        .from('ingredients')
        .insert(
          ingredients.map(ingredient => ({
            recipe_id: recipeData.id,
            ...ingredient
          }))
        );

      if (ingredientsError) throw ingredientsError;

      navigate('/gerichte');
    } catch (err) {
      console.error('Error creating recipe:', err);
      setError('Fehler beim Speichern des Rezepts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Neues Gericht erstellen</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Name */}
        <div className="bg-white rounded-lg shadow p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name des Gerichts *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        {/* Bild */}
        <div className="bg-white rounded-lg shadow p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bild
          </label>
          <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
            <div className="space-y-2 text-center">
              {image ? (
                <div className="relative">
                  <img
                    src={image}
                    alt="Preview"
                    className="mx-auto h-32 w-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setImage(null)}
                    className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500">
                      <span>Bild hochladen</span>
                      <input
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Zutaten */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-4">Zutaten *</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <input
                type="number"
                value={newIngredient.amount}
                onChange={(e) => setNewIngredient({
                  ...newIngredient,
                  amount: parseFloat(e.target.value)
                })}
                className="w-24 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                min="0"
                step="0.1"
              />
              <select
                value={newIngredient.unit}
                onChange={(e) => setNewIngredient({
                  ...newIngredient,
                  unit: e.target.value as typeof units[number]
                })}
                className="w-24 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {units.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
              <input
                type="text"
                value={newIngredient.name}
                onChange={(e) => setNewIngredient({
                  ...newIngredient,
                  name: e.target.value
                })}
                placeholder="Zutat"
                className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                onKeyPress={(e) => e.key === 'Enter' && handleAddIngredient()}
              />
              <button
                type="button"
                onClick={handleAddIngredient}
                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <ul className="space-y-2">
              {ingredients.map((ingredient, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <span>
                    {ingredient.amount} {ingredient.unit} {ingredient.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveIngredient(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Tags */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-4">Tags</h2>
          <div className="space-y-4">
            <div className="flex gap-2">
              <select
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Tag auswählen...</option>
                {availableTags
                  .filter(tag => !tags.includes(tag))
                  .map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))
                }
              </select>
              <button
                type="button"
                onClick={handleAddTag}
                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 text-green-600 hover:text-green-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Zubereitung */}
        <div className="bg-white rounded-lg shadow p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Zubereitung *
          </label>
          <textarea
            value={recipe}
            onChange={(e) => setRecipe(e.target.value)}
            rows={10}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Speichern...' : 'Gericht speichern'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NeuesGerichtView;