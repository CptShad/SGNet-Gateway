const Redis = require('ioredis');
const dotenv = require('dotenv');
const { logger } = require("../utils/logger.js");

dotenv.config({ path: `${__dirname}/../.env` });
const REDIS_IP = process.env.REDIS_IP || 'localhost:6379';

/**
 * @type {Redis.Redis}
 */
let redisClient;

/**
 * Iniatialize Redis Client
 * @returns 
 */
const initRedis = async () => {
    return new Promise((resolve, reject) => {
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

            redisClient.on('error', (err) => {
                if (err.code === "ECONNREFUSED") {
                    logger.error(`[Redis] Connection Error: ${err.name}: ${err.message}`);
                    reject(new Error(`[Redis] Connection Error: ${err.message}`));
                } else {
                    logger.error('[Redis] Error: ', err.message || "Unexpected Error");
                    reject(new Error(err.message || "Unexpected Error"));
                }
            });

            redisClient.on('end', () => {
                logger.warn('[Redis] Connection closed');
            });

        }
        catch (error) {
            logger.error('[Redis] Failed to initialize:', error);
            reject(error); // Reject if there's an issue initializing Redis
        }
    });
};


/**
 * Get redis client instance.
 * @returns {Redis.Redis} Redis client instance
 */
const getRedisClient = () => {
    if (!redisClient) {
        throw new Error('[Redis] Redis client not initialized');
    }
    return redisClient;
};

/**
 * Enqueues message to Redis list
 * - List name: 'llm_tasks'
 * - Message is JSON stringify of task
 * @param {*} task 
 * @returns 
 */
const enqueueTask = async (task) => {
    try {
        return await getRedisClient().rpush('llm_tasks', JSON.stringify(task));
    }
    catch (error) {
        logger.error('[Redis] Failed to enqueue task:', error);
        throw error; // Propagate the error for handling upstream
    }
};

/**
 * Gets result from redis for given task id
 * - Waits for timeout amount for results from redis
 * - Subscribes to result channel for given task id
 * - Closes subscriber when result is received or timeout occurs
 * @param {String} taskId task id
 * @param {Number} timeout timeout
 * @returns {Object|null} result
 */
const getResult = async (taskId, timeout) => {
    /**
     * @type {Redis.Redis}
     */
    const subscriber = createNewConnection();

    return new Promise((resolve, reject) => {
        const startTime = Date.now();

        // Set up the timeout mechanism
        const timeoutId = setTimeout(async () => {
            try {
                await subscriber.unsubscribe(`result:${taskId}`);
            }
            catch (err) {
                logger.error('[Redis] Error unsubscribing after timeout:', err);
            }
            reject(new Error('Timeout: No result received within the given time.'));
        }, timeout);

        // Subscribe to the result channel for the specific taskId
        subscriber.subscribe(`result:${taskId}`, (err, count) => {
            if (err) {
                logger.error('[Redis] Subscription error:', err);
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

                    closeSubscriber(taskId, subscriber);

                    // Resolve the promise with the received result
                    resolve(result);
                }
                catch (err) {
                    logger.error('[Redis] Error processing message:', err);
                    reject(err);
                }
            }
        });
    });
};

/**
 * Subscribe to result for given task id.
 * Returns results to callback
 * - Used for stream responses
 * - Closes subscriber once 'END_OF_STREAM' is reeived
 * @param {*} taskId 
 * @param {*} callback 
 */
const subscribeToResults = async (taskId, callback) => {
    /**
     * @type {Redis.Redis}
     */
    const subscriber = createNewConnection();

    // Subscribe to the result channel for the specific taskId
    subscriber.subscribe(`result:${taskId}`, (err, count) => {
        if (err) {
            logger.error('[Redis] Subscription error:', err);
            reject(err);
        }
    });

    // Listen for messages on the channel
    subscriber.on('message', (channel, message) => {
        // // Unsubscribe and quit from the channel after receiving the message
        if (message === 'END_OF_STREAM') closeSubscriber(taskId, subscriber);

        // Send stream messages to the callback
        callback(JSON.parse(message));
    });
};

/**
 * Closes Redis subscriber connection for give task id
 * @param {*} taskId task id
 * @param {Redis.Redis} subscriber 
 */
const closeSubscriber = async (taskId, subscriber) => {
    logger.log(`[Redis] Closing subscriber for taskId ${taskId}`);
    await subscriber.unsubscribe(`result:${taskId}`);
    await subscriber.quit();
};

/**
 * Create new redis connection
 * @returns {Redis.Redis}
 */
const createNewConnection = () => {
    return new Redis({
        host: REDIS_IP.split(':')[0],
        port: REDIS_IP.split(':')[1]
    });
}

module.exports = {
    initRedis: initRedis,
    getRedisClient: getRedisClient,
    enqueueTask: enqueueTask,
    getResult: getResult,
    subscribeToResults: subscribeToResults
};