# WochenKocher Deployment Guide

## Prerequisites

- Node.js 18 or higher
- PostgreSQL database
- A web server (e.g., Nginx or Apache) for serving the static files

## Frontend Deployment

1. Build the frontend:
```bash
npm run build
```

This will create a `dist` folder containing the static files.

2. Configure environment variables:
Create a `.env.production` file with your production settings:
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

3. Serve the static files:
Copy the contents of the `dist` folder to your web server's public directory.

Example Nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/wochenkocher/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## Backend Deployment

1. Set up the database:
- Create a new PostgreSQL database
- Run the migration script from `supabase/migrations/20250408203344_sweet_snow.sql`

2. Configure environment variables:
Create a `.env` file on your server:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
PORT=3000
```

3. Install dependencies:
```bash
npm install
```

4. Start the server:
```bash
node server/index.js
```

For production, it's recommended to use a process manager like PM2:
```bash
npm install -g pm2
pm2 start server/index.js --name wochenkocher
```

## Database Setup

1. Create a new PostgreSQL database:
```sql
CREATE DATABASE wochenkocher;
```

2. Apply the database schema:
```bash
psql -d wochenkocher -f supabase/migrations/20250408203344_sweet_snow.sql
```

## Security Considerations

1. Always use HTTPS in production
2. Set up proper firewall rules
3. Keep Node.js and npm packages updated
4. Regularly backup your database
5. Use strong passwords for database access

## Maintenance

1. Update the application:
```bash
git pull
npm install
npm run build
pm2 restart wochenkocher
```

2. Monitor logs:
```bash
pm2 logs wochenkocher
```

3. Database backups:
```bash
pg_dump -U username dbname > backup.sql
```