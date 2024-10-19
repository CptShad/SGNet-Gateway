import { Elysia } from 'elysia';

import * as gatewayController from '../controller/gateway.controller';

export default (app: Elysia): void => {
	app.post('/api/generate', gatewayController.generateResponse);
	app.post('/api/chat', gatewayController.chatResponse);
	app.get('/api/tags', gatewayController.getOllamaTags);
	app.get('/api/ps', gatewayController.getOllamaRunningModels);
};
