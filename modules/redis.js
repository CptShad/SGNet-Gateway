const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
let redisClient;

const initRedis = async () => {
    return new Promise((resolve, reject) => {
        try {
            redisClient = new Redis(REDIS_URL);

            // Listen for Redis connection events
            redisClient.on('ready', () => {
                console.log('[Redis] Ready to go.');
                resolve(); // Resolve when Redis is ready
            });

            redisClient.on('error', (err) => {
                if (err.code === "ECONNREFUSED") {
                    console.error(`[Redis] Connection Error: ${err.name}: ${err.message}`);
                    reject(new Error(`[Redis] Connection Error: ${err.message}`));
                } else {
                    console.error('[Redis] Error: ', err.message || "Unexpected Error");
                    reject(new Error(err.message || "Unexpected Error"));
                }
            });

            redisClient.on('end', () => {
                console.warn('[Redis] Connection closed');
            });

        }
        catch (error) {
            console.error('[Redis] Failed to initialize:', error);
            reject(error); // Reject if there's an issue initializing Redis
        }
    });
};


const getRedisClient = () => {
    if (!redisClient) {
        throw new Error('[Redis] Redis client not initialized');
    }
    return redisClient;
};

const enqueueTask = async (task) => {
    try {
        return await getRedisClient().rpush('llm_tasks', JSON.stringify(task));
    }
    catch (error) {
        console.error('[Redis] Failed to enqueue task:', error);
        throw error; // Propagate the error for handling upstream
    }
};

const getResult = async (taskId, timeout) => {
    const subscriber = new Redis(REDIS_URL);

    return new Promise((resolve, reject) => {
        const startTime = Date.now();

        // Set up the timeout mechanism
        const timeoutId = setTimeout(async () => {
            try {
                await subscriber.unsubscribe(`result:${taskId}`);
            } 
            catch (err) {
                console.error('[Redis] Error unsubscribing after timeout:', err);
            }
            reject(new Error('Timeout: No result received within the given time.'));
        }, timeout);

        // Subscribe to the result channel for the specific taskId
        subscriber.subscribe(`result:${taskId}`, (err, count) => {
            if (err) {
                console.error('[Redis] Subscription error:', err);
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

                    // Unsubscribe from the channel after receiving the message
                    await subscriber.unsubscribe(`result:${taskId}`);

                    // Quit the Redis client
                    await subscriber.quit();

                    // Resolve the promise with the received result
                    resolve(result);
                } 
                catch (err) {
                    console.error('[Redis] Error processing message:', err);
                    reject(err);
                }
            }
        });
    });
};

const subscribeToResults = async (taskId, callback) => {
    const subscriber = new Redis(REDIS_URL);
    await subscriber.subscribe(`result:${taskId}`);
    subscriber.on('message', (channel, message) => {
        callback(JSON.parse(message));
    });
}

module.exports = {
    initRedis: initRedis,
    getRedisClient: getRedisClient,
    enqueueTask: enqueueTask,
    getResult: getResult,
    subscribeToResults: subscribeToResults
};