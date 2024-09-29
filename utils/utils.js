const { subscribeToResults } = require('../modules/redis.js');

const generateStreamReader = async (params) => {
    const { taskId } = params;
    // Set up SSE stream
    let streamLength = 0;
    const stream = new ReadableStream({
        async start(controller) {
            await subscribeToResults(taskId, (message) => {
                if (message === 'END_OF_STREAM') {
                    console.log(`Stream end for task with taskId ${taskId} and response length ${streamLength}`);
                    controller.close();
                }
                else {
                    // Add to response stream
                    streamLength++;
                    console.log(`Stream response ${streamLength} for task with taskId ${taskId}`);
                    controller.enqueue(`data: ${JSON.stringify(message)}\n\n`);
                }
            });
        }
    });
    console.log(`Successfully created redis stream reader for task id ${taskId}`);
    return stream;
};

module.exports = {
    generateStreamReader: generateStreamReader
}