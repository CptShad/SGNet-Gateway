const { randomUUID } = require('crypto');
const { enqueueTask, getResult } = require('../modules/redis.js');
const { generateStreamReader } = require('../utils/utils.js');
const { logger } = require("../utils/logger.js");

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
const generateResponse = async ({ body, set }) => {
    const { provider, model, prompt, stream } = body;
    const taskId = randomUUID();

    try {
        logger.log(`Received req in generateResponse for provider ${provider} model ${model} prompt ${JSON.stringify(prompt).slice(0, 500)}`
            + ` stream ${stream ? true : false} and taskId ${taskId}`);

        // Enqueue task
        const type = "generate";
        await enqueueTask({ taskId, type, ...body });
        logger.log(`Enqueued generate task with taskId ${taskId}`);

        if (stream) {
            // If it is a stream call, Return a streaming response
            const streamReader = await generateStreamReader({ taskId });
            return new Response(streamReader, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                },
            });
        }
        else {
            // Non streaming response. Wait for result (with timeout)
            const result = await getResult(taskId, process.env.TASK_TIMEOUT || 30000);
            logger.log(`Successfully fetched generate result for task with taskId ${taskId}`);

            if (result) {
                try {
                    const jsonResult = JSON.parse(result);
                    return jsonResult;
                }
                catch (err) {
                    return result;
                }
            }
            else {
                set.status = 504; // Set 504 status for timeout
                return 'Task timed out';
            }
        }
    }
    catch (error) {
        logger.log(`Error in generateResponse for taskId ${taskId} stream ${stream || false}: ${error?.message}`);
        set.status = 500; // Set 500 status for errors
        return `Error: ${error.message}`;
    }
};


/**
 * Handles chat call.
 * - Enqueues task to redis queue. Task will contain all body params
 * - Returns response with generated stream if stream is true else fetches result from redis.
 * - Adds timeout for (30s) default for non stream calls.
 * @param {Object} options - The options object containing the `body` and `set` properties.
 * @param {Object} options.body - The data body of the request.
 * @param {Object} options.set - The set property of the request. Used for response
 * @returns {*} Response result
 */
const chatResponse = async ({ body, set }) => {
    const { provider, model, prompt, messages, stream } = body;
    const taskId = v4();

    try {
        logger.log(`Received req in chatResponse for provider ${provider} model ${model} prompt ${prompt ? JSON.stringify(prompt).slice(0, 500) : ""}`
            + ` messages lengths ${messages?.length} stream ${stream || false} and taskId ${taskId}`);

        // Enqueue task
        const type = "chat";
        await enqueueTask({ taskId, provider, type, model, prompt, messages, stream });
        logger.log(`Enqueued chat task with taskId ${taskId}`);

        if (stream) {
            // If it is a stream call, Return a streaming response
            const streamReader = await generateStreamReader({ taskId });
            return new Response(streamReader, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                },
            });
        }
        else {
            // Non streaming response. Wait for result (with timeout)
            const result = await getResult(taskId, process.env.TASK_TIMEOUT || 30000);
            logger.log(`Successfully fetched chat result for task with taskId ${taskId}`);

            if (result) {
                try {
                    const jsonResult = JSON.parse(result);
                    return jsonResult;
                }
                catch (err) {
                    return result;
                }
            }
            else {
                set.status = 504; // Set 504 status for timeout
                return 'Task timed out';
            }
        }
    }
    catch (error) {
        logger.log(`Error in chatResponse for taskId ${taskId} stream ${stream || false}: ${error?.message}`);
        set.status = 500; // Set 500 status for errors
        return `Error: ${error.message}`;
    }
};

module.exports = {
    generateResponse: generateResponse,
    chatResponse: chatResponse
};