import React, { useState, useEffect } from 'react';
import { Bell, Moon, Sun, Plus, Trash2, X } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import { Settings } from '../types';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { requestNotificationPermission, scheduleNotifications } from '../lib/notifications';

interface Tag {
  id: string;
  name: string;
  color: string;
  recipe_count: {
    count: number;
  };
}

interface Unit {
  id: string;
  name: string;
  recipe_count: number;
}

const EinstellungenView: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    weeklyPlanningNotification: false,
    dailyRecipeNotification: false,
    shoppingListNotification: false,
    darkMode: false,
    primaryColor: '#22c55e'
  });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tags state
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTag, setNewTag] = useState({ name: '', color: '#22c55e' });

  // Units state
  const [units, setUnits] = useState<Unit[]>([]);
  const [newUnit, setNewUnit] = useState('');

  const weekDays = [
    { value: 0, label: 'Sonntag' },
    { value: 1, label: 'Montag' },
    { value: 2, label: 'Dienstag' },
    { value: 3, label: 'Mittwoch' },
    { value: 4, label: 'Donnerstag' },
    { value: 5, label: 'Freitag' },
    { value: 6, label: 'Samstag' }
  ];

  useEffect(() => {
    loadSettings();
    loadTags();
    loadUnits();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found, create default settings
          const defaultSettings = {
            id: 1,
            weekly_planning_notification: false,
            daily_recipe_notification: false,
            shopping_list_notification: false,
            dark_mode: false,
            primary_color: '#22c55e'
          };

          const { error: insertError } = await supabase
            .from('settings')
            .insert(defaultSettings);

          if (insertError) throw insertError;

          setSettings({
            weeklyPlanningNotification: defaultSettings.weekly_planning_notification,
            dailyRecipeNotification: defaultSettings.daily_recipe_notification,
            shoppingListNotification: defaultSettings.shopping_list_notification,
            darkMode: defaultSettings.dark_mode,
            primaryColor: defaultSettings.primary_color
          });
        } else {
          throw error;
        }
      } else if (data) {
        setSettings({
          weeklyPlanningNotification: data.weekly_planning_notification,
          dailyRecipeNotification: data.daily_recipe_notification,
          shoppingListNotification: data.shopping_list_notification,
          darkMode: data.dark_mode,
          primaryColor: data.primary_color
        });
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading settings:', err);
      setError('Fehler beim Laden der Einstellungen');
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: Settings) => {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          id: 1,
          weekly_planning_notification: newSettings.weeklyPlanningNotification,
          daily_recipe_notification: newSettings.dailyRecipeNotification,
          shopping_list_notification: newSettings.shoppingListNotification,
          dark_mode: newSettings.darkMode,
          primary_color: newSettings.primaryColor
        });

      if (error) throw error;

      setSettings(newSettings);
      toast.success('Einstellungen wurden gespeichert');
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error('Fehler beim Speichern der Einstellungen');
    }
  };

  const loadTags = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select(`
          *,
          recipe_count: recipe_tags(count)
        `);

      if (error) throw error;
      setTags(data || []);
    } catch (err) {
      console.error('Error loading tags:', err);
      toast.error('Fehler beim Laden der Tags');
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

  const loadUnits = async () => {
    try {
      const { data, error } = await supabase
        .from('units')
        .select(`
          *,
          recipe_count: get_unit_recipe_count
        `);

      if (error) throw error;
      setUnits(data || []);
    } catch (err) {
      console.error('Error loading units:', err);
      toast.error('Fehler beim Laden der Einheiten');
    }
  };

  const handleAddUnit = async () => {
    if (!newUnit.trim()) {
      toast.error('Bitte gib einen Namen für die Einheit ein');
      return;
    }

    try {
      const { error } = await supabase
        .from('units')
        .insert({ name: newUnit.trim() });

      if (error) throw error;

      toast.success('Einheit wurde erstellt');
      setNewUnit('');
      loadUnits();
    } catch (err) {
      console.error('Error creating unit:', err);
      toast.error('Fehler beim Erstellen der Einheit');
    }
  };

  const handleDeleteUnit = async (id: string) => {
    if (!confirm('Möchtest du diese Einheit wirklich löschen?')) return;

    try {
      const { error } = await supabase
        .from('units')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Einheit wurde gelöscht');
      loadUnits();
    } catch (err) {
      console.error('Error deleting unit:', err);
      toast.error('Fehler beim Löschen der Einheit');
    }
  };

  const handleTimeChange = async (setting: string, value: string) => {
    try {
      const { error } = await supabase
        .from('settings')
        .update({ [setting]: value })
        .eq('id', 1);

      if (error) throw error;
      
      loadSettings();
      scheduleNotifications();
      toast.success('Benachrichtigungszeit wurde aktualisiert');
    } catch (err) {
      console.error('Error updating notification time:', err);
      toast.error('Fehler beim Aktualisieren der Benachrichtigungszeit');
    }
  };

  const handleDayChange = async (setting: string, value: number) => {
    try {
      const { error } = await supabase
        .from('settings')
        .update({ [setting]: value })
        .eq('id', 1);

      if (error) throw error;
      
      loadSettings();
      scheduleNotifications();
      toast.success('Benachrichtigungstag wurde aktualisiert');
    } catch (err) {
      console.error('Error updating notification day:', err);
      toast.error('Fehler beim Aktualisieren des Benachrichtigungstags');
    }
  };

  const handleToggleNotification = async (setting: keyof Settings) => {
    if (
      (setting === 'weeklyPlanningNotification' ||
        setting === 'dailyRecipeNotification' ||
        setting === 'shoppingListNotification') &&
      !settings[setting]
    ) {
      const permissionGranted = await requestNotificationPermission();
      if (!permissionGranted) {
        toast.error('Benachrichtigungen wurden nicht erlaubt');
        return;
      }
    }

    const newSettings = { ...settings, [setting]: !settings[setting] };
    await saveSettings(newSettings);
    
    if (newSettings[setting]) {
      scheduleNotifications();
    }
  };

  const handleToggle = (setting: keyof Settings) => {
    const newSettings = { ...settings, [setting]: !settings[setting] };
    saveSettings(newSettings);
  };

  const handleColorChange = (color: string) => {
    const newSettings = { ...settings, primaryColor: color };
    saveSettings(newSettings);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Laden...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Einstellungen</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Benachrichtigungen */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Benachrichtigungen</h2>
          <div className="space-y-6">
            {/* Weekly Planning Notification */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bell className="w-5 h-5 text-gray-500" />
                  <span>Wochenplanung</span>
                </div>
                <button
                  onClick={() => handleToggleNotification('weeklyPlanningNotification')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.weeklyPlanningNotification ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.weeklyPlanningNotification ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              {settings.weeklyPlanningNotification && (
                <div className="flex gap-4 items-center pl-8">
                  <select
                    value={settings.weeklyPlanningDay}
                    onChange={(e) => handleDayChange('weekly_planning_day', Number(e.target.value))}
                    className="p-2 border rounded-lg"
                  >
                    {weekDays.map(day => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="time"
                    value={settings.weeklyPlanningTime}
                    onChange={(e) => handleTimeChange('weekly_planning_time', e.target.value)}
                    className="p-2 border rounded-lg"
                  />
                </div>
              )}
            </div>

            {/* Daily Recipe Notification */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bell className="w-5 h-5 text-gray-500" />
                  <span>Tagesgericht</span>
                </div>
                <button
                  onClick={() => handleToggleNotification('dailyRecipeNotification')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.dailyRecipeNotification ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.dailyRecipeNotification ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              {settings.dailyRecipeNotification && (
                <div className="flex gap-4 items-center pl-8">
                  <input
                    type="time"
                    value={settings.dailyRecipeTime}
                    onChange={(e) => handleTimeChange('daily_recipe_time', e.target.value)}
                    className="p-2 border rounded-lg"
                  />
                </div>
              )}
            </div>

            {/* Shopping List Notification */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bell className="w-5 h-5 text-gray-500" />
                  <span>Einkaufsliste</span>
                </div>
                <button
                  onClick={() => handleToggleNotification('shoppingListNotification')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.shoppingListNotification ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.shoppingListNotification ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              {settings.shoppingListNotification && (
                <div className="flex gap-4 items-center pl-8">
                  <select
                    value={settings.shoppingListDay}
                    onChange={(e) => handleDayChange('shopping_list_day', Number(e.target.value))}
                    className="p-2 border rounded-lg"
                  >
                    {weekDays.map(day => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="time"
                    value={settings.shoppingListTime}
                    onChange={(e) => handleTimeChange('shopping_list_time', e.target.value)}
                    className="p-2 border rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Erscheinungsbild */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Erscheinungsbild</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {settings.darkMode ? (
                  <Moon className="w-5 h-5 text-gray-500" />
                ) : (
                  <Sun className="w-5 h-5 text-gray-500" />
                )}
                <span>Dark Mode</span>
              </div>
              <button
                onClick={() => handleToggle('darkMode')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.darkMode ? 'bg-green-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Primärfarbe
              </label>
              <div className="relative">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="w-10 h-10 rounded-full border-2 border-gray-300"
                    style={{ backgroundColor: settings.primaryColor }}
                  />
                  <span className="text-sm text-gray-500">
                    {settings.primaryColor.toUpperCase()}
                  </span>
                </div>
                {showColorPicker && (
                  <div className="absolute z-10 mt-2">
                    <div className="p-4 bg-white rounded-lg shadow-lg">
                      <HexColorPicker
                        color={settings.primaryColor}
                        onChange={handleColorChange}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Tags verwalten</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
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

        {/* Units */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Einheiten verwalten</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Neue Einheit"
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={handleAddUnit}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                Hinzufügen
              </button>
            </div>

            <div className="space-y-2">
              {units.map((unit) => (
                <div
                  key={unit.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-medium">{unit.name}</span>
                    <span className="text-sm text-gray-500">
                      {unit.recipe_count} Rezepte
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteUnit(unit.id)}
                    className="text-red-500 hover:text-red-700"
                    title="Einheit löschen"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}

              {units.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Noch keine Einheiten vorhanden
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EinstellungenView;