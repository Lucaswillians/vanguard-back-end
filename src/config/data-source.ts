import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';


// dotenv.config({ path: '.env.local' }); 
dotenv.config({ path: '.env' }); 

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: ['src/**/*.entity.{ts,js}'],
  migrations: ['src/database/migrations/*.{ts,js}'],
});
