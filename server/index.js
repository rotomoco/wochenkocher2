import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Initialize PostgreSQL connection pool
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

// Create tables if they don't exist
const initDb = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS recipes (
        id UUID PRIMARY KEY,
        name TEXT NOT NULL,
        recipe TEXT NOT NULL,
        image TEXT,
        tags JSONB DEFAULT '[]'
      );

      CREATE TABLE IF NOT EXISTS ingredients (
        recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
        amount DECIMAL NOT NULL,
        unit TEXT NOT NULL,
        name TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        weekly_planning_notification BOOLEAN DEFAULT FALSE,
        daily_recipe_notification BOOLEAN DEFAULT FALSE,
        shopping_list_notification BOOLEAN DEFAULT FALSE,
        dark_mode BOOLEAN DEFAULT FALSE,
        primary_color TEXT DEFAULT '#22c55e'
      );

      CREATE TABLE IF NOT EXISTS week_plans (
        id UUID PRIMARY KEY,
        week_start TIMESTAMP NOT NULL,
        week_end TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS week_plan_meals (
        week_plan_id UUID REFERENCES week_plans(id) ON DELETE CASCADE,
        day TEXT NOT NULL,
        recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
        date TIMESTAMP NOT NULL
      );
    `);
  } finally {
    client.release();
  }
};

initDb().catch(console.error);

app.get('/api/recipes', async (req, res) => {
  const client = await pool.connect();
  try {
    const { rows: recipes } = await client.query(`
      SELECT 
        r.id,
        r.name,
        r.recipe,
        r.image,
        r.tags,
        json_agg(
          json_build_object(
            'amount', i.amount,
            'unit', i.unit,
            'name', i.name
          )
        ) as ingredients
      FROM recipes r
      LEFT JOIN ingredients i ON r.id = i.recipe_id
      GROUP BY r.id
    `);

    res.json(recipes.map(recipe => ({
      ...recipe,
      ingredients: recipe.ingredients[0] === null ? [] : recipe.ingredients
    })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch recipes' });
  } finally {
    client.release();
  }
});

app.get('/api/settings', async (req, res) => {
  const client = await pool.connect();
  try {
    let { rows: [settings] } = await client.query(
      'SELECT * FROM settings WHERE id = 1'
    );
    
    if (!settings) {
      await client.query(`
        INSERT INTO settings (
          id,
          weekly_planning_notification,
          daily_recipe_notification,
          shopping_list_notification,
          dark_mode,
          primary_color
        ) VALUES (1, false, false, false, false, '#22c55e')
      `);
      
      ({ rows: [settings] } = await client.query(
        'SELECT * FROM settings WHERE id = 1'
      ));
    }

    // Convert snake_case to camelCase for frontend
    res.json({
      weeklyPlanningNotification: settings.weekly_planning_notification,
      dailyRecipeNotification: settings.daily_recipe_notification,
      shoppingListNotification: settings.shopping_list_notification,
      darkMode: settings.dark_mode,
      primaryColor: settings.primary_color
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  } finally {
    client.release();
  }
});

app.put('/api/settings', async (req, res) => {
  const client = await pool.connect();
  try {
    const settings = req.body;
    
    await client.query(`
      UPDATE settings
      SET weekly_planning_notification = $1,
          daily_recipe_notification = $2,
          shopping_list_notification = $3,
          dark_mode = $4,
          primary_color = $5
      WHERE id = 1
    `, [
      settings.weeklyPlanningNotification,
      settings.dailyRecipeNotification,
      settings.shoppingListNotification,
      settings.darkMode,
      settings.primaryColor
    ]);

    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update settings' });
  } finally {
    client.release();
  }
});

app.get('/api/weekplan/current', async (req, res) => {
  const client = await pool.connect();
  try {
    const { rows: [weekPlan] } = await client.query(`
      WITH current_plan AS (
        SELECT 
          wp.id,
          wp.week_start as "weekStart",
          wp.week_end as "weekEnd"
        FROM week_plans wp
        ORDER BY week_start DESC
        LIMIT 1
      ),
      meals AS (
        SELECT 
          wpm.week_plan_id,
          json_agg(
            json_build_object(
              'day', wpm.day,
              'date', wpm.date,
              'recipe', json_build_object(
                'id', r.id,
                'name', r.name,
                'recipe', r.recipe,
                'image', r.image,
                'tags', r.tags,
                'ingredients', (
                  SELECT json_agg(
                    json_build_object(
                      'amount', i.amount,
                      'unit', i.unit,
                      'name', i.name
                    )
                  )
                  FROM ingredients i
                  WHERE i.recipe_id = r.id
                )
              )
            )
          ) as meals
        FROM week_plan_meals wpm
        JOIN recipes r ON wpm.recipe_id = r.id
        WHERE wpm.week_plan_id = (SELECT id FROM current_plan)
        GROUP BY wpm.week_plan_id
      )
      SELECT 
        cp.*,
        COALESCE(m.meals, '[]'::json) as meals
      FROM current_plan cp
      LEFT JOIN meals m ON cp.id = m.week_plan_id
    `);

    res.json(weekPlan || null);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch week plan' });
  } finally {
    client.release();
  }
});

app.post('/api/recipes', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const recipe = req.body;
    const id = randomUUID();

    // Insert recipe
    await client.query(`
      INSERT INTO recipes (id, name, recipe, image, tags)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      id,
      recipe.name,
      recipe.recipe,
      recipe.image || null,
      JSON.stringify(recipe.tags || [])
    ]);

    // Insert ingredients
    for (const ingredient of recipe.ingredients) {
      await client.query(`
        INSERT INTO ingredients (recipe_id, amount, unit, name)
        VALUES ($1, $2, $3, $4)
      `, [id, ingredient.amount, ingredient.unit, ingredient.name]);
    }

    await client.query('COMMIT');
    res.json({ id, ...recipe });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Failed to create recipe' });
  } finally {
    client.release();
  }
});

app.post('/api/weekplan', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const weekPlan = req.body;
    const id = randomUUID();

    // Insert week plan
    await client.query(`
      INSERT INTO week_plans (id, week_start, week_end)
      VALUES ($1, $2, $3)
    `, [id, weekPlan.weekStart, weekPlan.weekEnd]);

    // Insert meals
    for (const meal of weekPlan.meals) {
      await client.query(`
        INSERT INTO week_plan_meals (week_plan_id, day, recipe_id, date)
        VALUES ($1, $2, $3, $4)
      `, [id, meal.day, meal.recipe._id, meal.date]);
    }

    await client.query('COMMIT');
    res.json({ id, ...weekPlan });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Failed to create week plan' });
  } finally {
    client.release();
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});