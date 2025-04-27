import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChefHat, Clock, ArrowLeft, Share, Printer, Edit2, Save, X, Plus, Minus, Upload } from 'lucide-react';
import { Recipe, Ingredient } from '../types';
import { supabase } from '../lib/supabase';
import { getImageUrl, compressImage } from '../lib/imageUtils';
import toast from 'react-hot-toast';

const TagesgerichtView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedRecipe, setEditedRecipe] = useState<Recipe | null>(null);
  const [newIngredient, setNewIngredient] = useState<Ingredient>({
    amount: 1,
    unit: 'Stk',
    name: ''
  });
  const [saving, setSaving] = useState(false);

  const units = ['g', 'kg', 'Stk', 'TL', 'EL'] as const;

  useEffect(() => {
    if (id) {
      loadRecipe(id);
    }
  }, [id]);

  const loadRecipe = async (recipeId: string) => {
    try {
      const { data, error: recipeError } = await supabase
        .from('recipes')
        .select(`
          *,
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
        `)
        .eq('id', recipeId)
        .single();

      if (recipeError) throw recipeError;

      if (data) {
        const transformedRecipe = {
          ...data,
          tags: data.recipe_tags?.map(rt => rt.tags.name) || [],
          image: getImageUrl(data.image)
        };
        setRecipe(transformedRecipe);
        setEditedRecipe(transformedRecipe);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error loading recipe:', err);
      setError('Fehler beim Laden des Rezepts');
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!recipe) return;

    const text = `
${recipe.name}

${recipe.preparation_time ? `Zubereitungszeit: ${recipe.preparation_time} Minuten\n` : ''}
Zutaten:
${recipe.ingredients.map(ing => `${ing.amount} ${ing.unit} ${ing.name}`).join('\n')}

Zubereitung:
${recipe.recipe}
    `.trim();

    try {
      await navigator.share({
        title: recipe.name,
        text: text
      });
    } catch (err) {
      navigator.clipboard.writeText(text);
      toast.success('Rezept in die Zwischenablage kopiert!');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editedRecipe) return;

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
      setEditedRecipe({
        ...editedRecipe,
        image: fileName
      });
    } catch (err) {
      console.error('Error uploading image:', err);
      toast.error('Fehler beim Hochladen des Bildes');
    }
  };

  const handleAddIngredient = () => {
    if (!editedRecipe || !newIngredient.name.trim()) return;

    setEditedRecipe({
      ...editedRecipe,
      ingredients: [...editedRecipe.ingredients, { ...newIngredient }]
    });

    setNewIngredient({
      amount: 1,
      unit: 'Stk',
      name: ''
    });
  };

  const handleRemoveIngredient = (index: number) => {
    if (!editedRecipe) return;

    setEditedRecipe({
      ...editedRecipe,
      ingredients: editedRecipe.ingredients.filter((_, i) => i !== index)
    });
  };

  const handleSave = async () => {
    if (!editedRecipe || !id) return;

    try {
      setSaving(true);

      const { error: updateError } = await supabase
        .from('recipes')
        .update({
          name: editedRecipe.name,
          recipe: editedRecipe.recipe,
          image: editedRecipe.image,
          preparation_time: editedRecipe.preparation_time
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Delete existing ingredients
      const { error: deleteError } = await supabase
        .from('ingredients')
        .delete()
        .eq('recipe_id', id);

      if (deleteError) throw deleteError;

      // Insert new ingredients
      const { error: ingredientsError } = await supabase
        .from('ingredients')
        .insert(
          editedRecipe.ingredients.map(ingredient => ({
            recipe_id: id,
            ...ingredient
          }))
        );

      if (ingredientsError) throw ingredientsError;

      setRecipe(editedRecipe);
      setIsEditing(false);
      toast.success('Rezept wurde gespeichert');
    } catch (err) {
      console.error('Error saving recipe:', err);
      toast.error('Fehler beim Speichern des Rezepts');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Laden...</div>;
  }

  if (error || !recipe) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || 'Rezept nicht gefunden'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <Link
          to="/gerichte"
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Zurück zur Übersicht
        </Link>
        <div className="space-x-2">
          {!isEditing && (
            <>
              <button
                onClick={handleShare}
                className="p-2 rounded-full hover:bg-gray-100"
                title="Teilen"
              >
                <Share className="w-5 h-5" />
              </button>
              <button
                onClick={handlePrint}
                className="p-2 rounded-full hover:bg-gray-100"
                title="Drucken"
              >
                <Printer className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 rounded-full hover:bg-gray-100"
                title="Bearbeiten"
              >
                <Edit2 className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="relative h-64 md:h-96">
          {isEditing ? (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center relative">
              {editedRecipe?.image ? (
                <>
                  <img
                    src={editedRecipe.image}
                    alt={editedRecipe.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => setEditedRecipe({ ...editedRecipe, image: null })}
                    className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <label className="cursor-pointer flex flex-col items-center">
                  <Upload className="w-12 h-12 text-gray-400 mb-2" />
                  <span className="text-gray-500">Bild hochladen</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
              )}
            </div>
          ) : (
            recipe.image ? (
              <img
                src={recipe.image}
                alt={recipe.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <ChefHat className="w-16 h-16 text-gray-400" />
              </div>
            )
          )}
        </div>

        <div className="p-6 md:p-8">
          {/* Title and Meta */}
          <div className="mb-8">
            {isEditing ? (
              <>
                <input
                  type="text"
                  value={editedRecipe?.name || ''}
                  onChange={(e) => editedRecipe && setEditedRecipe({
                    ...editedRecipe,
                    name: e.target.value
                  })}
                  className="text-3xl font-bold w-full p-2 border rounded-lg mb-4"
                  placeholder="Rezeptname"
                />
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <input
                    type="number"
                    value={editedRecipe?.preparation_time || ''}
                    onChange={(e) => editedRecipe && setEditedRecipe({
                      ...editedRecipe,
                      preparation_time: e.target.value ? parseInt(e.target.value) : null
                    })}
                    className="w-20 p-2 border rounded-lg"
                    placeholder="Zeit"
                    min="1"
                  />
                  <span className="text-gray-500">Minuten</span>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold mb-4">{recipe.name}</h1>
                {recipe.preparation_time && (
                  <div className="flex items-center text-gray-500">
                    <Clock className="w-5 h-5 mr-2" />
                    <span>{recipe.preparation_time} Minuten</span>
                  </div>
                )}
              </>
            )}
            {recipe.tags && recipe.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {recipe.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Ingredients */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Zutaten</h2>
            {isEditing && (
              <div className="flex gap-4 mb-4">
                <input
                  type="number"
                  value={newIngredient.amount}
                  onChange={(e) => setNewIngredient({
                    ...newIngredient,
                    amount: parseFloat(e.target.value)
                  })}
                  className="w-24 p-2 border rounded-lg"
                  min="0"
                  step="0.1"
                />
                <select
                  value={newIngredient.unit}
                  onChange={(e) => setNewIngredient({
                    ...newIngredient,
                    unit: e.target.value as typeof units[number]
                  })}
                  className="w-24 p-2 border rounded-lg"
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
                  className="flex-1 p-2 border rounded-lg"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddIngredient()}
                />
                <button
                  onClick={handleAddIngredient}
                  className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            )}
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(isEditing ? editedRecipe : recipe).ingredients.map((ingredient, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between py-2 border-b"
                >
                  <span>{ingredient.name}</span>
                  <div className="flex items-center">
                    <span className="text-gray-600">
                      {ingredient.amount} {ingredient.unit}
                    </span>
                    {isEditing && (
                      <button
                        onClick={() => handleRemoveIngredient(index)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Zubereitung</h2>
            {isEditing ? (
              <textarea
                value={editedRecipe?.recipe || ''}
                onChange={(e) => editedRecipe && setEditedRecipe({
                  ...editedRecipe,
                  recipe: e.target.value
                })}
                className="w-full h-64 p-4 border rounded-lg"
                placeholder="Beschreibe die Zubereitung..."
              />
            ) : (
              <div className="prose max-w-none">
                {recipe.recipe.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      {isEditing && (
        <div className="fixed bottom-8 right-8 flex gap-4">
          <button
            onClick={() => {
              setEditedRecipe(recipe);
              setIsEditing(false);
            }}
            className="px-6 py-3 bg-gray-500 text-white rounded-full shadow-lg hover:bg-gray-600"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center px-6 py-3 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 disabled:opacity-50"
          >
            <Save className="w-5 h-5 mr-2" />
            {saving ? 'Wird gespeichert...' : 'Speichern'}
          </button>
        </div>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          button, a[href="/gerichte"] {
            display: none;
          }
          .shadow-lg {
            box-shadow: none;
          }
        }
      `}</style>
    </div>
  );
};

export default TagesgerichtView;