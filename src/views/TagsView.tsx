import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Tag {
  id: string;
  name: string;
  color: string;
  recipe_count: {
    count: number;
  };
}

const TagsView: React.FC = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTag, setNewTag] = useState({ name: '', color: '#22c55e' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select(`
          *,
          recipe_count: recipes(count)
        `);

      if (error) throw error;
      setTags(data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error loading tags:', err);
      setError('Fehler beim Laden der Tags');
      setLoading(false);
    }
  };

  const handleAddTag = async () => {
    if (!newTag.name.trim()) {
      toast.error('Bitte gib einen Namen für den Tag ein');
      return;
    }

    try {
      const { error } = await supabase
        .from('tags')
        .insert({
          name: newTag.name.trim(),
          color: newTag.color
        });

      if (error) throw error;

      toast.success('Tag wurde erstellt');
      setNewTag({ name: '', color: '#22c55e' });
      loadTags();
    } catch (err) {
      console.error('Error creating tag:', err);
      toast.error('Fehler beim Erstellen des Tags');
    }
  };

  const handleDeleteTag = async (id: string) => {
    if (!confirm('Möchtest du diesen Tag wirklich löschen?')) return;

    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Tag wurde gelöscht');
      loadTags();
    } catch (err) {
      console.error('Error deleting tag:', err);
      toast.error('Fehler beim Löschen des Tags');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Laden...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Tags verwalten</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="Neuer Tag"
            value={newTag.name}
            onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <input
            type="color"
            value={newTag.color}
            onChange={(e) => setNewTag({ ...newTag, color: e.target.value })}
            className="w-12 h-10 rounded border cursor-pointer"
          />
          <button
            onClick={handleAddTag}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Hinzufügen
          </button>
        </div>

        <div className="space-y-2">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="font-medium">{tag.name}</span>
                <span className="text-sm text-gray-500">
                  {tag.recipe_count.count} Rezepte
                </span>
              </div>
              <button
                onClick={() => handleDeleteTag(tag.id)}
                className="text-red-500 hover:text-red-700"
                title="Tag löschen"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}

          {tags.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Noch keine Tags vorhanden
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TagsView;