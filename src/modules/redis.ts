import Redis from 'ioredis';
import { logger } from '../utils/logger.js';
import { ChatRedisTaskData, GenerateRedisTaskData } from '../types/types.d.js';
import config from '../config/config.js';

const REDIS_IP = config.redis_ip || 'localhost:6379';

let redisClient: Redis;

/**
 * Iniatialize Redis Client
 * @returns {Promise<void>}
 */
async function initRedis(): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		try {
			redisClient = createNewConnection();

			redisClient.on('connect', () => {
				logger.info('[Redis] Connecting...');
			});

			// Listen for Redis connection events
			redisClient.on('ready', () => {
				logger.log('[Redis] Ready to go.');
				resolve(); // Resolve when Redis is ready
			});

			redisClient.on('error', (err: any) => {
				if (err?.code === 'ECONNREFUSED') {
					logger.error(`[Redis] Connection Error: ${err?.name}: ${err?.message}`);
					reject(new Error(`[Redis] Connection Error: ${err?.message}`));
				} else {
					logger.error(`[Redis] Error: ${err.message ?? 'Unexpected Error'}`);
					reject(new Error(err.message || 'Unexpected Error'));
				}
			});

			redisClient.on('end', () => {
				logger.warn('[Redis] Connection closed');
			});

		}
		catch (error: any) {
			logger.error(`[Redis] Failed to initialize: ${error?.message}`);
			reject(error); // Reject if there's an issue initializing Redis
		}
	});
}

/**
 * Get redis client instance.
 * @returns {Redis} Redis client instance
 */
async function getRedisClient(): Promise<Redis> {
	if (!redisClient) {
		throw new Error('[Redis] Redis client not initialized');
	}
	return redisClient;
}

/**
 * Enqueues message to Redis list
 * - List name: 'llm_tasks'
 * - Message is JSON stringify of task
 * @param {*} task 
 * @returns {Promise<number>} The length of the list after the push operation
 */
async function enqueueTask(task: GenerateRedisTaskData | ChatRedisTaskData): Promise<number> {
	try {
		const client = await getRedisClient();
		const key = `${config.redis_namespace}:${config.redis_set}`;
		return await client.rpush(key, JSON.stringify(task));
	}
	catch (error: any) {
		logger.error(`[Redis] Failed to enqueue task: ${error?.message}`);
		throw error;
	}
}

/**
 * Gets result from redis for given task id
 * - Waits for timeout amount for results from redis
 * - Subscribes to result channel for given task id
 * - Closes subscriber when result is received or timeout occurs
 * @param {String} taskId task id
 * @param {Number} timeout timeout
 * @returns {Object|null} result
 */
async function getResult(taskId: string, timeout: number): Promise<object | null> {
	const subscriber = createNewConnection();

	return new Promise((resolve, reject) => {
		const startTime = Date.now();

		// Set up the timeout mechanism
		const timeoutId = setTimeout(async () => {
			try {
				await subscriber.unsubscribe(`result:${taskId}`);
			}
			catch (err: any) {
				logger.error(`[Redis] Error unsubscribing after timeout: ${err?.message}`);
			}
			reject(new Error('Timeout: No result received within the given time.'));
		}, timeout);

		// Subscribe to the result channel for the specific taskId
		subscriber.subscribe(`result:${taskId}`, (err) => {
			if (err) {
				logger.error(`[Redis] Subscription error: ${err?.message}`);
				reject(err);
			}
		});

		// Listen for messages on the channel
		subscriber.on('message', async (channel, message) => {
			if (channel === `result:${taskId}`) {
				try {
					const result = JSON.parse(message);

					// Clear the timeout since we received the message
					clearTimeout(timeoutId);

					await closeSubscriber(taskId, subscriber);
					logger.info(`Finished processing for task ${taskId} in time ${Date.now() - startTime}`);

					// Resolve the promise with the received result
					resolve(result);
				}
				catch (err: any) {
					logger.error(`[Redis] Error processing message: ${err?.message}`);
					reject(err);
				}
			}
		});
	});
}

/**
 * Subscribe to result for given task id.
 * Returns results to callback
 * - Used for stream responses
 * - Closes subscriber once 'END_OF_STREAM' is reeived
 * @param {String} taskId task id
 * @param {Function} callback callback function
 */

async function subscribeToResults(taskId: string, callback: (message: string) => void): Promise<void> {
	const subscriber = createNewConnection();

	// Subscribe to the result channel for the specific taskId
	subscriber.subscribe(`result:${taskId}`, (err) => {
		if (err) {
			logger.error(`[Redis] Subscription error: ${err?.message}`);
			throw err;
		}
	});

	// Listen for messages on the channel
	subscriber.on('message', (channel, message) => {
		// // Unsubscribe and quit from the channel after receiving the message
		if (message === 'END_OF_STREAM') closeSubscriber(taskId, subscriber);

		// Send stream messages to the callback
		callback(JSON.parse(message));
	});
}

/**
 * Closes Redis subscriber connection for give task id
 * @param {String} taskId task id
 * @param {Redis} subscriber 
 */
async function closeSubscriber(taskId: string, subscriber: Redis): Promise<void> {
	logger.log(`[Redis] Closing subscriber for taskId ${taskId}`);
	await subscriber.unsubscribe(`result:${taskId}`);
	await subscriber.quit();
}

/**
 * Create new redis connection
 * @returns {Promise<Redis>}
 */
function createNewConnection(): Redis {
	const [host, port] = REDIS_IP.split(':');
	return new Redis({
		host,
		port: parseInt(port, 10),
	});
}

export {
	initRedis,
	getRedisClient,
	enqueueTask,
	getResult,
	subscribeToResults,
};
