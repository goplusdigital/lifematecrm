// /lib/db.ts
import { Pool } from 'pg'

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.SUPABASE_POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false,
  },
})