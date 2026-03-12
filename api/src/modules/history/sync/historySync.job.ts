import cron from "node-cron"
import { startHistorySync } from "./historySync.service"

export function startHistorySyncJob() {
	cron.schedule("0 * * * *", async () => {
		console.log("Running history sync")
		await startHistorySync("cron")
	})
}
