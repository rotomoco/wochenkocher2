import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { ChefHat, Calendar, ShoppingCart, Clock, Edit2 } from 'lucide-react';
import { WeekPlan } from '../types';
import { fetchCurrentWeekPlan } from '../lib/api';

const IndexView: React.FC = () => {
  const [weekPlan, setWeekPlan] = useState<WeekPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWeekPlan();
  }, []);

  const loadWeekPlan = async () => {
    try {
      const plan = await fetchCurrentWeekPlan();
      setWeekPlan(plan);
      setLoading(false);
    } catch (err) {
      setError('Fehler beim Laden des Wochenplans');
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Laden...</div>;
  }

  if (error) {
    return <div className="text-red-600 p-4">{error}</div>;
  }

  const today = new Date();
  const todayMeal = weekPlan?.meals.find(
    meal => format(new Date(meal.date), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
  );

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-8 text-center">Deine Woche</h1>

      {/* Heute */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-center">Heute</h2>
        {todayMeal ? (
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 bg-gray-200 rounded-lg overflow-hidden mb-4">
              {todayMeal.recipe.image ? (
                <img
                  src={todayMeal.recipe.image}
                  alt={todayMeal.recipe.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ChefHat className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </div>
            <h3 className="text-xl font-medium mb-2 text-center">{todayMeal.recipe.name}</h3>
            <div className="flex items-center text-sm text-gray-500 mb-4">
              <Clock className="w-4 h-4 mr-1" />
              <span>{todayMeal.recipe.preparation_time || 30} Min</span>
            </div>
            <div className="flex gap-4 justify-center">
              <Link
                to={`/gericht/${todayMeal.recipe.id}`}
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Zum Rezept
              </Link>
              <Link
                to={`/gericht/${todayMeal.recipe.id}`}
                className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Edit2 className="w-5 h-5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <ChefHat className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Kein Gericht für heute geplant</p>
            <Link
              to="/wochenplanung"
              className="inline-flex items-center px-6 py-3 mt-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Woche planen
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link
          to="/wochenplanung"
          className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow text-center"
        >
          <Calendar className="w-8 h-8 text-green-600 mb-3 mx-auto" />
          <h3 className="font-medium mb-2">Wochenplanung</h3>
          <p className="text-sm text-gray-500">Plane deine Mahlzeiten für die Woche</p>
        </Link>

        <Link
          to="/einkaufsliste"
          className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow text-center"
        >
          <ShoppingCart className="w-8 h-8 text-green-600 mb-3 mx-auto" />
          <h3 className="font-medium mb-2">Einkaufsliste</h3>
          <p className="text-sm text-gray-500">Verwalte deine Einkäufe</p>
        </Link>

        <Link
          to="/gerichte"
          className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow text-center"
        >
          <ChefHat className="w-8 h-8 text-green-600 mb-3 mx-auto" />
          <h3 className="font-medium mb-2">Gerichteübersicht</h3>
          <p className="text-sm text-gray-500">Entdecke neue Rezepte</p>
        </Link>
      </div>

      {/* Wochenübersicht */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-center">Diese Woche</h2>
        {weekPlan ? (
          <div className="space-y-4">
            {weekPlan.meals.map((meal) => (
              <div
                key={meal.date.toString()}
                className="flex items-center p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="w-32 font-medium text-center">
                  {format(new Date(meal.date), 'EEEE', { locale: de })}
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <Link
                    to={`/gericht/${meal.recipe.id}`}
                    className="text-green-600 hover:text-green-700"
                  >
                    {meal.recipe.name}
                  </Link>
                  <Link
                    to={`/gericht/${meal.recipe.id}`}
                    className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                    title="Rezept bearbeiten"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Keine Wochenplanung vorhanden</p>
            <Link
              to="/wochenplanung"
              className="inline-flex items-center px-6 py-3 mt-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Jetzt planen
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default IndexView;