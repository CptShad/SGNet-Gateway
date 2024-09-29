import { v4 as uuidv4 } from 'uuid';
import { enqueueTask, getResult, subscribeToResults } from '../modules/redis.js';

export default (app) => {
    app.post('/generate', async ({ body, set }) => {
        try {
            const { provider, model, prompt } = body;
            const taskId = uuidv4();

            // Enqueue task
            await enqueueTask({ taskId, provider, model, prompt });

            // Wait for result (with timeout)
            const result = await getResult(taskId, process.env.TASK_TIMEOUT || 30000);

            if (result) {
                return JSON.parse(result); // Return result as JSON
            }
            else {
                set.status = 504; // Set 504 status for timeout
                return 'Task timed out';
            }
        }
        catch (error) {
            set.status = 500; // Set 500 status for errors
            return `Error: ${error.message}`;
        }
    });

    app.post('api/generate', async ({ body, set }) => {
        try {
            const taskId = uuidv4();

            // Enqueue task
            await enqueueTask({ taskId, ...body });

            // Set up SSE stream
            const stream = new ReadableStream({
                async start(controller) {
                    await subscribeToResults(taskId, (message) => {
                        if (message === 'END_OF_STREAM') {
                            controller.close();
                        } else {
                            controller.enqueue(`data: ${JSON.stringify(message)}\n\n`);
                        }
                    });
                }
            });

            return new Response(stream, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                },
            });
        } 
        catch (error) {
            return new Response(`Error: ${error.message}`, { status: 500 });
        }
    });
};
