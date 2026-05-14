// /lib/db.ts
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_POSTGRES_URL

function shouldUseSsl(url?: string) {
  const explicit = process.env.CRM_DATABASE_SSL || process.env.DATABASE_SSL || process.env.PGSSLMODE
  if (explicit) {
    const value = explicit.toLowerCase()
    if (['0', 'false', 'disable', 'disabled', 'no'].includes(value)) return false
    if (['1', 'true', 'require', 'required', 'prefer', 'verify-ca', 'verify-full'].includes(value)) return true
  }

  if (!url) return false

  try {
    const parsed = new URL(url)
    const sslMode = parsed.searchParams.get('sslmode')?.toLowerCase()
    if (sslMode) return sslMode !== 'disable'
    return parsed.hostname.includes('supabase.co')
  } catch {
    return false
  }
}

export const pool = new Pool({
  connectionString,
  ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : false,
})
