const { v4 } = require('uuid');
const { enqueueTask, getResult, subscribeToResults } = require('../modules/redis.js');
const { generateStreamReader } = require('../utils/utils.js');

const generateResponse = async ({ body, set }) => {
    const { provider, model, prompt, stream } = body;
    const taskId = v4();
    
    try {
        console.log(`Received req in generateResponse for provider ${provider} model ${model} prompt ${JSON.stringify(prompt).slice(0, 500)}`
            + ` stream ${stream ? true : false} and taskId ${taskId}`);

        // Enqueue task
        const type = "generate";
        await enqueueTask({ taskId, type, ...body }); 
        console.log(`Enqueued generate task with taskId ${taskId}`);

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
            console.log(`Successfully fetched generate result for task with taskId ${taskId}`);

            if (result) {
                return result; // Return result as JSON
            }
            else {
                set.status = 504; // Set 504 status for timeout
                return 'Task timed out';
            }
        }
    }
    catch (error) {
        console.log(`Error in generateResponse for taskId ${taskId} stream ${stream || false}: ${error?.message}`);
        set.status = 500; // Set 500 status for errors
        return `Error: ${error.message}`;
    }
};


const chatResponse = async ({ body, set }) => {
    const { provider, model, prompt, messages, stream } = body;
    const taskId = v4();
    
    try {
        console.log(`Received req in chatResponse for provider ${provider} model ${model} prompt ${prompt ? JSON.stringify(prompt).slice(0, 500) : ""}`
            + ` messages lengths ${messages?.length} stream ${stream || false} and taskId ${taskId}`);

        // Enqueue task
        const type = "chat";
        await enqueueTask({ taskId, provider, type, model, prompt, messages, stream });
        console.log(`Enqueued chat task with taskId ${taskId}`);

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
            console.log(`Successfully fetched chat result for task with taskId ${taskId}`);

            if (result) {
                return result // Return result as JSON
            }
            else {
                set.status = 504; // Set 504 status for timeout
                return 'Task timed out';
            }
        }
    }
    catch (error) {
        console.log(`Error in chatResponse for taskId ${taskId} stream ${stream || false}: ${error?.message}`);
        set.status = 500; // Set 500 status for errors
        return `Error: ${error.message}`;
    }
};

module.exports = {
    generateResponse: generateResponse,
    chatResponse: chatResponse
};