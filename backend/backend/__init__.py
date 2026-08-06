# PyMySQL is only needed for local MySQL development.
# In production (Vercel + Supabase PostgreSQL) it is not installed, so
# guard the import so the app still boots with psycopg2.
try:
    import pymysql

    pymysql.install_as_MySQLdb()
except ImportError:
    pass
