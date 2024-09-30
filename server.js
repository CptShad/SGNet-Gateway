import { Elysia } from 'elysia';
import { loadRoutes } from './routes/index.js';
import { initRedis } from './modules/redis.js';
import dotenv from 'dotenv';
const { logger } = require("./utils/logger.js");

// Load environment variables from .env file
dotenv.config({ path: `${__dirname}/.env` });

const PORT = process.env.PORT || 3000;

// Create the Elysia app
const app = new Elysia();

(async () => {
    try {
        // Initialize Redis before starting the server
        await initRedis();

        // Dynamically load routes
        await loadRoutes(app);

        // Start the Elysia server
        app.listen(PORT, () => {
            logger.log(`Server is running on http://localhost:${PORT}`);
        });

    } 
	catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1); // Exit if server fails to start
    }
})();