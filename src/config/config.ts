import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../../.env');

if (!fs.existsSync(envPath)) {
	console.error(`.env file not found at ${envPath}`);
	process.exit(1);
}

const result = dotenv.config({ path: envPath });

if (result.error) {
	console.error('Error loading .env file:', result.error);
	process.exit(1);
}

const config = {
	port: process.env.PORT || 3000,
	redis_ip: process.env.REDIS_IP || '',
	task_timeout: process.env.TASK_TIMEOUT || '',
	redis_namespace: process.env.REDIS_NAMESPACE || 'sgnet',
	redis_set: process.env.REDIS_SET || 'tasks',
};

logger.info(`Config loaded: ${JSON.stringify(config)}`);

export default config;
