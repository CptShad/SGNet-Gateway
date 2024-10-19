/**
 * Dynamically imports routes present in the folder /routes
 */
import fs from 'fs';
import { logger } from '../utils/logger.js';
import { Elysia } from 'elysia';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Dynamically loads routes present in /routes folder
 * @param {*} app 
 */
export async function loadRoutes(app: Elysia): Promise<void> {
	try {
		const routeFiles = fs.readdirSync(__dirname).filter(file => file !== 'index.ts' && file.endsWith('.ts'));
		logger.info(`Route files: [${routeFiles}]`);
		for (const file of routeFiles) {
			logger.info(`Loading Routes in: ${file}`);
			const route = await import(`./${file}`);
			if (typeof route.default === 'function') {
				route.default(app); // Register the route with the Elysia app
			}
		}
	}
	catch (error: any) {
		logger.error(`Error while loading routes: ${error.message}`);
	}
}
