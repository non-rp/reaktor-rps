import cron from "node-cron"
import { startHistorySync } from "./historySync.service"

export function startHistorySyncJob() {
	if (process.env.HISTORY_SYNC_CRON_ENABLED !== "true") {
		console.log("History sync cron is disabled")
		return
	}

	cron.schedule("0 * * * *", async () => {
		console.log("Running history sync")
		await startHistorySync("cron")
	})
}
