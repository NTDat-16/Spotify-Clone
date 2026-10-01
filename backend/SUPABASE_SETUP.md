# Supabase PostgreSQL for the Django API

The Django application connects through `DATABASE_URL`; it does not use the
Supabase JavaScript client and no Supabase service-role key belongs in the
frontend. The deployed backend is the only component that needs the database
password.

## 1. Create the database

1. In Supabase, create a PostgreSQL project and save its database password.
2. In **Connect**, copy the PostgreSQL **pooler** connection string. For Vercel
   serverless functions, use the transaction pooler (port `6543`) and keep
   `sslmode=require`.
3. In the backend Vercel project, add the variables from `.env.example` for
   the **Production** environment. Use the real `DATABASE_URL`, a generated
   `DJANGO_SECRET_KEY`, the backend host, and the frontend's exact HTTPS origin.
4. Redeploy after saving variables. Vercel only applies changed environment
   variables to new deployments.

## 2. Create the Django schema

From a machine with the production `DATABASE_URL` exported, run:

```bash
cd backend
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py check --deploy
```

`migrate` creates the schema defined by `app/migrations`; do not run it during
every request or Vercel function invocation.

## 3. About `data.sql`

`data.sql` is a MariaDB dump of an older API schema (`songs.title`,
`albums.title`, text `artist`, and `users`). The current Django app expects
tables such as `songs.name`, `artists`, `albums.artist_id`, and `taikhoan`.
It cannot be imported directly into PostgreSQL/Supabase without a data mapping.

For production data, first migrate the Django schema with `manage.py migrate`.
Then import or write a one-off migration that maps old fields, for example
`songs.title -> songs.name` and creates `artists` before connecting songs and
albums through `artist_id`. Take a backup of the MariaDB source before doing
that import.
