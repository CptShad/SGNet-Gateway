/**
 * Dynamically imports routes present in the folder /routes
 */
import fs from 'fs';
import path from 'path';

export async function loadRoutes(app) {
    const routeFiles = fs.readdirSync(__dirname).filter(file => file !== 'index.js' && file.endsWith('.js'));

    for (const file of routeFiles) {
        const route = await import(`./${file}`);
        if (typeof route.default === 'function') {
            route.default(app); // Register the route with the Elysia app
        }
    }
}
