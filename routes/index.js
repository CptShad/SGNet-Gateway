/**
 * Dynamically imports routes present in the folder /routes
 */
import fs from 'fs';
import path from 'path';
const { logger } = require("../utils/logger.js");

/**
 * Dynamically loads routes present in /routes folder
 * @param {*} app 
 */
export async function loadRoutes(app) {
    try {
        const routeFiles = fs.readdirSync(__dirname).filter(file => file !== 'index.js' && file.endsWith('.js'));
        logger.info('Route files: ', routeFiles);
        for (const file of routeFiles) {
            console.info(`Loading Routes in: ${file}`);
            const route = require(`./${file}`);
            if (typeof route.default === 'function') {
                route.default(app); // Register the route with the Elysia app
            }
        }
    }
    catch (error) {
        logger.error('Error while loading routes: ', error);
    }
}
