// Common types
type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

interface BaseRequestBody {
	model: string;
	format?: 'json';
	options?: Record<string, any>;
	stream?: boolean;
	keep_alive?: string;
	provider?: string;
}

interface ToolCall {
	name: string;
	arguments: string;
}

interface Message {
	role: MessageRole;
	content: string;
	images?: string[];
	tool_calls?: ToolCall[];
}

interface Tool {
	name: string;
	description: string;
	parameters: Record<string, unknown>;
}

// Specific request bodies
export interface GenerateRequestBody extends BaseRequestBody {
	prompt?: string;
	suffix?: string;
	images?: string[];
	system?: string;
	template?: string;
	context?: string;
	raw?: boolean;
}

export interface ChatRequestBody extends BaseRequestBody {
	messages?: Message[];
	tools?: Tool[];
	prompt?: string;
}

// Redis task data interfaces
interface RedisTaskData {
	taskId: string;
	type: string;
}

export interface GenerateRedisTaskData extends GenerateRequestBody, RedisTaskData {}

export interface ChatRedisTaskData extends ChatRequestBody, RedisTaskData {}
