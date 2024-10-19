import { subscribeToResults } from '../modules/redis.js';
import { logger } from './logger.js';

/**
 * Generate stream reader for redis results
 * @param {*} params 
 * @returns {Promise<ReadableStream<string>>} stream reader
 */
async function generateStreamReader (params: { taskId: string }): Promise<ReadableStream<string>> {
	const { taskId } = params;
	// Set up SSE stream
	let streamLength = 0;
	const stream = new ReadableStream({
		async start(controller): Promise<void> {
			await subscribeToResults(taskId, (message: string | Record<string, unknown>) => {
				if (message === 'END_OF_STREAM') {
					logger.log(`Stream end for task with taskId ${taskId} and response length ${streamLength}`);
					controller.close();
				}
				else {
					// Add to response stream
					streamLength++;
					logger.log(`Stream response ${streamLength} for task with taskId ${taskId}`);

					// Stream the message as a valid JSON object followed by a newline delimiter
					const jsonChunk = JSON.stringify(message) + '\n';

					// Convert to Uint8Array (byte array) to avoid encoding issues
					const chunkBytes = new Uint8Array(Buffer.from(jsonChunk));

					// Enqueue the byte chunk to the stream
					controller.enqueue(chunkBytes);
				}
			});
		},
	});
	logger.log(`Successfully created redis stream reader for task id ${taskId}`);
	return stream;
}

export {
	generateStreamReader,
};
