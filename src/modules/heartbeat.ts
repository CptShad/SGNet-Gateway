import { getRedisClient } from './redis';

const HEARTBEAT_EXPIRY = 15000;  // 15 seconds heartbeat timeout (same as worker's TTL)

const getHealthStatus = async () => {
	const registeredWorkers = await getRedisClient().hgetall('workers:registered');  // Get all registered workers
	const statuses = [];

	for (const workerId in registeredWorkers) {
		const workerData = JSON.parse(registeredWorkers[workerId]);  // Parse the stored JSON string
		const isWorkerAlive = workerData.last_heartbeat_at && (Date.now() - workerData.last_heartbeat_at < HEARTBEAT_EXPIRY);

		statuses.push({
			workerId,
			created_at: new Date(workerData.created_at).toISOString(),
			last_heartbeat_at: new Date(workerData.last_heartbeat_at).toISOString(),
			status: isWorkerAlive ? 'alive' : 'down',
		});
	}

	return statuses;
};
