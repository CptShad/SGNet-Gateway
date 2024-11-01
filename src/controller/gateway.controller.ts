import { randomUUID } from 'crypto';
import { enqueueTask, getResult } from '../modules/redis.js';
import { generateStreamReader } from '../utils/utils.js';
import { logger } from '../utils/logger.js';
import { ChatRedisTaskData, ChatRequestBody, GenerateRedisTaskData, GenerateRequestBody } from '../types/types.d.js';
import { OLLAMA_MODELS } from '../constants/constants.js';

/**
 * Handles generate call.
 * - Enqueues task to redis queue. Task will contain all body params.
 * - Returns response with generated stream if stream is true else fetches result from redis.
 * - Adds timeout for (30s) default for non stream calls.
 * @param {Object} options - The options object containing the `body` and `set` properties.
 * @param {Object} options.body - The data body of the request.
 * @param {Object} options.set - The set property of the request. Used for response
 * @returns {*} Response result
 */
async function generateResponse({ body, set }: { body: GenerateRequestBody; set: any }): Promise<Response | string | object> {
	const { provider, model, prompt, stream } = body;
	const taskId = randomUUID();

	try {
		logger.log(`Received req in generateResponse for provider ${provider} model ${model} prompt ${JSON.stringify(prompt).slice(0, 500)}`
			+ ` stream ${stream ? true : false} and taskId ${taskId}`);

		// Enqueue task
		const type = 'generate';
		await enqueueTask({ taskId, type, ...body } as GenerateRedisTaskData);
		logger.log(`Enqueued generate task with taskId ${taskId}`);

		if (stream) {
			// If it is a stream call, Return a streaming response
			const streamReader = await generateStreamReader({ taskId });
			return new Response(streamReader as any, {
				headers: {
					'Content-Type': 'application/x-ndjson',
				},
			});
		}
		else {
			// Non streaming response. Wait for result (with timeout)
			try {
				const result = await getResult(taskId, Number(process.env.TASK_TIMEOUT || 30000));
				logger.log(`Successfully fetched generate result for task with taskId ${taskId}`);
				return new Response(JSON.stringify(result), {
					headers: { 'Content-Type': 'application/json' },
				});
			}
			catch (err: any) {
				logger.error(`Error in generateResponse for taskId ${taskId} stream ${stream || false}: ${err?.message}`);
				return new Response(JSON.stringify({ error: 'Task timed out' }), {
					headers: { 'Content-Type': 'application/json' },
				});
			}
		}
	}
	catch (error: any) {
		logger.log(`Error in generateResponse for taskId ${taskId} stream ${stream || false}: ${error?.message}`);
		set.status = 500; // Set 500 status for errors
		return new Response(JSON.stringify({ error: error?.message }), {
			headers: { 'Content-Type': 'application/json' },
		});
	}
}

/**
 * Handles chat call.
 * - Enqueues task to redis queue. Task will contain all body params
 * - Returns response with generated stream if stream is true else fetches result from redis.
 * - Adds timeout for (30s) default for non stream calls.
 * @param {Object} options - The options object containing the `body` and `set` properties.
 * @param {Object} options.body - The data body of the request.
 * @param {Object} options.set - The set property of the request. Used for response
 * @returns {Promise<Response | string | object>} Response result
 */
async function chatResponse({ body, set }: { body: ChatRequestBody; set: any }): Promise<Response | string | object> {
	const { provider, model, prompt, messages, stream } = body;
	const taskId = randomUUID();

	try {
		logger.log(`Received req in chatResponse for provider ${provider} model ${model} prompt ${prompt ? JSON.stringify(prompt).slice(0, 500) : ''}`
			+ ` messages lengths ${messages?.length} stream ${stream || false} and taskId ${taskId}`);

		// Enqueue task
		const type = 'chat';
		await enqueueTask({ taskId, type, ...body } as ChatRedisTaskData);
		logger.log(`Enqueued chat task with taskId ${taskId}`);

		if (stream) {
			// If it is a stream call, Return a streaming response
			const streamReader = await generateStreamReader({ taskId });
			return new Response(streamReader as any, {
				headers: {
					'Content-Type': 'application/x-ndjson',
				},
			});
		}
		else {
			// Non streaming response. Wait for result (with timeout)
			try {
				const result = await getResult(taskId, Number(process.env.TASK_TIMEOUT || 30000));
				logger.log(`Successfully fetched chat result for task with taskId ${taskId}`);
				return new Response(JSON.stringify(result), {
					headers: { 'Content-Type': 'application/json' },
				});
			}
			catch (err: any) {
				logger.error(`Error in chatResponse for taskId ${taskId} stream ${stream || false}: ${err?.message}`);
				set.status = 500; // Set 500 status for errors
				return new Response(JSON.stringify({ error: 'Task timed out' }), {
					headers: { 'Content-Type': 'application/json' },
				});
			}
		}
	}
	catch (error: any) {
		logger.log(`Error in chatResponse for taskId ${taskId} stream ${stream || false}: ${error?.message}`);
		set.status = 500; // Set 500 status for errors
		return new Response(JSON.stringify({ error: error?.message }), {
			headers: { 'Content-Type': 'application/json' },
		});
	}
}

/**
 * Get all tags from ollama
 * @param {Object} options.set - The set property of the request. Used for response
 * @returns 
 */
async function getOllamaTags(): Promise<Response> {
	const tags = {
		'models': OLLAMA_MODELS,
	};
	return new Response(JSON.stringify(tags), {
		headers: { 'Content-Type': 'application/json' },
	});
}

/**
 * Get all currently loaded models in ollama
 * @param {Object} options.set - The set property of the request. Used for response
 * @returns 
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getOllamaRunningModels({ set }: any): Promise<Response> {
	const tags = {
		'models': OLLAMA_MODELS,
	};
	return new Response(JSON.stringify(tags), {
		headers: { 'Content-Type': 'application/json' },
	});
}

export {
	generateResponse,
	chatResponse,
	getOllamaTags,
	getOllamaRunningModels,
};
