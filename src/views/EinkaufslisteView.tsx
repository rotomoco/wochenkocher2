import React, { useState, useEffect } from 'react';
import { Plus, Minus, Share, Printer, PlusCircle, Check, X } from 'lucide-react';
import { Recipe, Ingredient } from '../types';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface CombinedIngredient extends Ingredient {
  id: string;
  purchased: boolean;
}

interface CustomIngredient {
  id: string;
  name: string;
  amount: number;
  unit: 'g' | 'kg' | 'Stk' | 'TL' | 'EL' | 'ml' | 'l' | 'Prise' | 'Bund' | 'Packung';
  purchased: boolean;
}

const EinkaufslisteView: React.FC = () => {
  const [ingredients, setIngredients] = useState<CombinedIngredient[]>([]);
  const [customIngredients, setCustomIngredients] = useState<CustomIngredient[]>([]);
  const [newIngredient, setNewIngredient] = useState('');
  const [newAmount, setNewAmount] = useState<number>(1);
  const [newUnit, setNewUnit] = useState<'g' | 'kg' | 'Stk' | 'TL' | 'EL' | 'ml' | 'l' | 'Prise' | 'Bund' | 'Packung'>('Stk');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const units = ['g', 'kg', 'Stk', 'TL', 'EL', 'ml', 'l', 'Prise', 'Bund', 'Packung'] as const;

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    try {
      // Get the current week plan
      const { data: weekPlans, error: weekPlanError } = await supabase
        .from('week_plans')
        .select('*')
        .order('week_start', { ascending: false })
        .limit(1);

      if (weekPlanError) throw weekPlanError;
      if (!weekPlans || weekPlans.length === 0) {
        setIngredients([]);
        setLoading(false);
        return;
      }

      // Get all meals for this week plan
      const { data: meals, error: mealsError } = await supabase
        .from('week_plan_meals')
        .select(`
          recipes (
            id,
            name,
            ingredients (
              amount,
              unit,
              name
            )
          )
        `)
        .eq('week_plan_id', weekPlans[0].id);

      if (mealsError) throw mealsError;

      // Combine and sum up ingredients
      const combinedIngredients: { [key: string]: CombinedIngredient } = {};

      meals?.forEach(meal => {
        if (meal.recipes?.ingredients) {
          meal.recipes.ingredients.forEach(ingredient => {
            const key = `${ingredient.name}-${ingredient.unit}`;
            if (combinedIngredients[key]) {
              combinedIngredients[key].amount += ingredient.amount;
            } else {
              combinedIngredients[key] = {
                ...ingredient,
                id: crypto.randomUUID(),
                purchased: false
              };
            }
          });
        }
      });

      setIngredients(Object.values(combinedIngredients));
      setLoading(false);
    } catch (err) {
      console.error('Error fetching ingredients:', err);
      setError('Fehler beim Laden der Einkaufsliste');
      setLoading(false);
    }
  };

  const adjustAmount = (id: string, increment: boolean) => {
    setIngredients(prev => 
      prev.map(ing => 
        ing.id === id 
          ? { ...ing, amount: increment ? ing.amount + 1 : Math.max(0, ing.amount - 1) }
          : ing
      )
    );
  };

  const adjustCustomAmount = (id: string, increment: boolean) => {
    setCustomIngredients(prev => 
      prev.map(ing => 
        ing.id === id 
          ? { ...ing, amount: increment ? ing.amount + 1 : Math.max(0, ing.amount - 1) }
          : ing
      )
    );
  };

  const togglePurchased = (id: string, isCustom: boolean) => {
    if (isCustom) {
      setCustomIngredients(prev =>
        prev.map(ing =>
          ing.id === id ? { ...ing, purchased: !ing.purchased } : ing
        )
      );
    } else {
      setIngredients(prev =>
        prev.map(ing =>
          ing.id === id ? { ...ing, purchased: !ing.purchased } : ing
        )
      );
    }
  };

  const addCustomIngredient = () => {
    if (!newIngredient.trim()) return;

    const newItem: CustomIngredient = {
      id: crypto.randomUUID(),
      name: newIngredient.trim(),
      amount: newAmount,
      unit: newUnit,
      purchased: false
    };

    setCustomIngredients(prev => [...prev, newItem]);
    setNewIngredient('');
    setNewAmount(1);
    setNewUnit('Stk');
    toast.success('Zutat hinzugefügt');
  };

  const handleShare = async () => {
    const text = [...ingredients, ...customIngredients]
      .map(ing => `${ing.purchased ? '✓' : '○'} ${ing.amount} ${ing.unit} ${ing.name}`)
      .join('\n');

    try {
      await navigator.share({
        title: 'Einkaufsliste',
        text: text
      });
    } catch (err) {
      navigator.clipboard.writeText(text);
      toast.success('Einkaufsliste in die Zwischenablage kopiert!');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const renderIngredientList = (items: (CombinedIngredient | CustomIngredient)[], isCustom: boolean) => {
    const unpurchasedItems = items.filter(item => !item.purchased);
    const purchasedItems = items.filter(item => item.purchased);

    return (
      <>
        {/* Unpurchased Items */}
        <div className="mb-6">
          <h3 className="font-medium mb-3 text-gray-700">Noch zu kaufen</h3>
          {unpurchasedItems.length > 0 ? (
            <ul className="space-y-2">
              {unpurchasedItems.map(item => (
                <li key={item.id} className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => togglePurchased(item.id, isCustom)}
                      className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center"
                    />
                    <span>{item.amount} {item.unit} {item.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => isCustom ? adjustCustomAmount(item.id, false) : adjustAmount(item.id, false)}
                      className="p-1 rounded-full hover:bg-gray-100"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => isCustom ? adjustCustomAmount(item.id, true) : adjustAmount(item.id, true)}
                      className="p-1 rounded-full hover:bg-gray-100"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center py-2">Keine Zutaten</p>
          )}
        </div>

        {/* Purchased Items */}
        {purchasedItems.length > 0 && (
          <div>
            <h3 className="font-medium mb-3 text-gray-700">Bereits gekauft</h3>
            <ul className="space-y-2">
              {purchasedItems.map(item => (
                <li key={item.id} className="flex items-center justify-between py-2 border-b bg-green-50">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => togglePurchased(item.id, isCustom)}
                      className="w-6 h-6 rounded-full border-2 border-green-500 bg-green-500 flex items-center justify-center"
                    >
                      <Check className="w-4 h-4 text-white" />
                    </button>
                    <span className="line-through text-gray-500">
                      {item.amount} {item.unit} {item.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => isCustom ? adjustCustomAmount(item.id, false) : adjustAmount(item.id, false)}
                      className="p-1 rounded-full hover:bg-gray-100"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => isCustom ? adjustCustomAmount(item.id, true) : adjustAmount(item.id, true)}
                      className="p-1 rounded-full hover:bg-gray-100"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </>
    );
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Laden...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Einkaufsliste</h1>
        <div className="space-x-2">
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
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Zutaten aus dem Wochenplan */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold mb-4">Zutaten aus dem Wochenplan</h2>
          {ingredients.length > 0 ? (
            renderIngredientList(ingredients, false)
          ) : (
            <p className="text-gray-500 text-center py-4">
              Keine Zutaten im aktuellen Wochenplan
            </p>
          )}
        </div>

        {/* Zusätzliche Zutaten */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold mb-4">Zusätzliche Zutaten</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="number"
              value={newAmount}
              onChange={(e) => setNewAmount(parseFloat(e.target.value))}
              className="w-20 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              min="0"
              step="0.1"
            />
            <select
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value as typeof units[number])}
              className="w-24 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {units.map(unit => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
            <input
              type="text"
              value={newIngredient}
              onChange={(e) => setNewIngredient(e.target.value)}
              placeholder="Neue Zutat hinzufügen"
              className="flex-1 p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              onKeyPress={(e) => e.key === 'Enter' && addCustomIngredient()}
            />
            <button
              onClick={addCustomIngredient}
              className="px-4 py-2 bg-green-600 text-white rounded-r-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <PlusCircle className="w-5 h-5" />
            </button>
          </div>
          {renderIngredientList(customIngredients, true)}
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          button, input {
            display: none;
          }
          .shadow {
            box-shadow: none;
          }
          .border-b {
            border-bottom: 1px solid #e5e7eb;
          }
          .purchased {
            color: #6B7280;
            text-decoration: line-through;
          }
        }
      `}</style>
    </div>
  );
};

export default EinkaufslisteView;