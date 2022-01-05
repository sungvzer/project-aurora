import dotenv from 'dotenv';
import { existsSync } from 'fs';

dotenv.config();
if (existsSync('.env')) {
    dotenv.config({ path: '.env' });
}

type ApplicationEnvironment = 'Production' | 'Development';

export const ENVIRONMENT: ApplicationEnvironment =
    process.env.NODE_ENV === 'PROD' ? 'Production' : 'Development';
