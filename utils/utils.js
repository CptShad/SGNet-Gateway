const { subscribeToResults } = require('../modules/redis.js');
const { logger } = require("./logger.js");

/**
 * Generate stream reader for redis results
 * @param {*} params 
 * @returns {ReadableStream} stream reader
 */
const generateStreamReader = async (params) => {
    const { taskId } = params;
    // Set up SSE stream
    let streamLength = 0;
    const stream = new ReadableStream({
        async start(controller) {
            await subscribeToResults(taskId, (message) => {
                if (message === 'END_OF_STREAM') {
                    logger.log(`Stream end for task with taskId ${taskId} and response length ${streamLength}`);
                    controller.close();
                }
                else {
                    // Add to response stream
                    streamLength++;
                    logger.log(`Stream response ${streamLength} for task with taskId ${taskId}`);
                    controller.enqueue(`data: ${JSON.stringify(message)}\n\n`);
                }
            });
        }
    });
    logger.log(`Successfully created redis stream reader for task id ${taskId}`);
    return stream;
};

module.exports = {
    generateStreamReader: generateStreamReader
}