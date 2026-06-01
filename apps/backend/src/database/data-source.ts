import { DataSource } from 'typeorm';

/**
 * TypeORM CLI data source — used for migration generation/running.
 * Run from apps/backend/:
 *   npx typeorm migration:generate -d src/database/data-source.ts src/database/migrations/AddRelations
 */
export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  database: process.env.DATABASE_NAME || 'jssi_pos',
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
});
