import type { Config } from 'drizzle-kit';

export default {
  schema: './lib/db.ts',
  out: './lib/migrations',
  driver: 'pg',
  strict: true,
  verbose: true,
  dbCredentials: {
    connectionString: process.env.POSTGRES_URL!
  }
} satisfies Config; 