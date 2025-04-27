import { supabase } from './supabase';
import { NotificationTime } from '../types';

// Parse time string (HH:mm) to hours and minutes
function parseTime(timeStr: string): NotificationTime {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
}

// Request notification permissions
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

// Get next occurrence of a specific day and time
function getNextOccurrence(dayIndex: number, time: NotificationTime): Date {
  const now = new Date();
  const next = new Date();
  
  // Set time
  next.setHours(time.hours, time.minutes, 0, 0);
  
  // If today's occurrence has passed, move to next week
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  
  // Adjust to target day
  const daysUntilTarget = (dayIndex - next.getDay() + 7) % 7;
  next.setDate(next.getDate() + daysUntilTarget);
  
  return next;
}

// Schedule notifications based on settings
export async function scheduleNotifications() {
  if (!('Notification' in window)) return;
  
  try {
    const { data: settings } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (!settings) return;

    // Weekly planning notification
    if (settings.weekly_planning_notification) {
      const time = parseTime(settings.weekly_planning_time);
      const nextOccurrence = getNextOccurrence(settings.weekly_planning_day, time);

      if (nextOccurrence > new Date()) {
        setTimeout(() => {
          new Notification('Wochenplanung', {
            body: 'Zeit für deine Wochenplanung!',
            icon: '/logo.png'
          });
          scheduleNotifications(); // Reschedule for next week
        }, nextOccurrence.getTime() - new Date().getTime());
      }
    }

    // Daily recipe notification
    if (settings.daily_recipe_notification) {
      const time = parseTime(settings.daily_recipe_time);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(time.hours, time.minutes, 0, 0);

      setTimeout(() => {
        checkAndSendDailyRecipeNotification();
        scheduleNotifications(); // Reschedule for next day
      }, tomorrow.getTime() - new Date().getTime());
    }

    // Shopping list notification
    if (settings.shopping_list_notification) {
      const time = parseTime(settings.shopping_list_time);
      const nextOccurrence = getNextOccurrence(settings.shopping_list_day, time);

      if (nextOccurrence > new Date()) {
        setTimeout(() => {
          new Notification('Einkaufsliste', {
            body: 'Vergiss nicht deine Einkäufe für die Woche!',
            icon: '/logo.png'
          });
          scheduleNotifications(); // Reschedule for next week
        }, nextOccurrence.getTime() - new Date().getTime());
      }
    }
  } catch (error) {
    console.error('Error scheduling notifications:', error);
  }
}

// Check and send daily recipe notification
async function checkAndSendDailyRecipeNotification() {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: meal } = await supabase
      .from('week_plan_meals')
      .select('recipes(name)')
      .eq('date', today)
      .single();

    if (meal?.recipes?.name) {
      new Notification('Heutiges Gericht', {
        body: `Heute kochst du: ${meal.recipes.name}`,
        icon: '/logo.png'
      });
    }
  } catch (error) {
    console.error('Error sending daily recipe notification:', error);
  }
}