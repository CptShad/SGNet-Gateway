import { Elysia } from 'elysia';
import { loadRoutes } from './routes/index.js';
import { initRedis } from './modules/redis.js';
import dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: `${__dirname}/../.env` });

const PORT = process.env.PORT || 3000;

// Create the Elysia app
const app = new Elysia();

(async (): Promise<void> => {
	try {
		// Initialize Redis before starting the server
		await initRedis();

		// Dynamically load routes
		await loadRoutes(app);
		logger.info('All routes loaded.');

		// Start the Elysia server
		app.listen(PORT, () => {
			logger.log(`Server is running on http://localhost:${PORT}`);
		});

	}
	catch (error: any) {
		logger.error(`Failed to start server: ${error.message}`);
		process.exit(1); // Exit if server fails to start
	}
})();
