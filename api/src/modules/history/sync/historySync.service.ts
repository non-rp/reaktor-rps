import { fetchHistory } from "../../../clients/rspApiClient"
import { upsertHistoryMatches } from "./historySyncPersistence"
import {
	acquireHistorySyncLock,
	completeHistorySync,
	getHistorySyncState,
	hasSeenHistoryCursor,
	markHistorySyncFailed,
	rememberHistoryCursor,
	touchHistorySyncHeartbeat,
	updateHistorySyncProgress
} from "./historySyncStateStore"
import type { HistorySyncState, HistorySyncSummary } from "./historySyncTypes"

let activeSyncPromise: Promise<HistorySyncState> | null = null

export type { HistorySyncState, HistorySyncSummary } from "./historySyncTypes"
export { getHistorySyncState } from "./historySyncStateStore"

export async function startHistorySync(triggerSource: string): Promise<{
	started: boolean
	state: HistorySyncState
}> {
	const acquired = await acquireHistorySyncLock(triggerSource, activeSyncPromise !== null)

	if (!acquired.started) {
		return {
			started: false,
			state: await getHistorySyncState()
		}
	}

	activeSyncPromise = runHistorySync(
		acquired.state.nextCursor ?? undefined,
		triggerSource,
		Boolean(acquired.state.lastCompletedAt) && !acquired.state.nextCursor
	)
		.catch(async (error) => {
			const message = error instanceof Error ? error.message : "Unknown history sync error"
			await markHistorySyncFailed(message)
			console.error("History sync failed", error)
			return getHistorySyncState()
		})
		.finally(() => {
			activeSyncPromise = null
		})

	console.log(
		`History sync started from ${triggerSource} at cursor ${acquired.state.nextCursor ?? "<initial>"}`
	)

	return {
		started: true,
		state: await getHistorySyncState()
	}
}

async function runHistorySync(
	startCursor: string | undefined,
	triggerSource: string,
	allowKnownHistoryShortCircuit: boolean
): Promise<HistorySyncState> {
	const summary: HistorySyncSummary = {
		pagesProcessed: 0,
		matchesFetched: 0,
		matchesCreated: 0,
		matchesUpdated: 0,
		invalidMatches: 0
	}
	const playerIdCache = new Map<string, number>()

	let cursor = startCursor
	let shouldContinue = true

	while (shouldContinue) {
		await touchHistorySyncHeartbeat(cursor ?? null)
		console.log(`History sync: fetching next page for cursor ${cursor ?? "<initial>"}`)

		const page = await fetchHistory(cursor)
		summary.pagesProcessed += 1
		summary.matchesFetched += page.data.length

		console.log(
			`History sync: page ${summary.pagesProcessed}, fetched ${page.data.length} matches`
		)

		const pageResult = await upsertHistoryMatches(page.data, playerIdCache)
		summary.invalidMatches += pageResult.invalidMatches
		summary.matchesCreated += pageResult.matchesCreated
		summary.matchesUpdated += pageResult.matchesUpdated

		const nextCursor = page.cursor ?? null
		const shouldStopAtKnownCursor =
			allowKnownHistoryShortCircuit &&
			nextCursor !== null &&
			await hasSeenHistoryCursor(nextCursor)

		await updateHistorySyncProgress(summary, nextCursor)
		await rememberHistoryCursor(nextCursor)

		if (shouldStopAtKnownCursor) {
			console.log(`History sync: reached known cursor ${nextCursor}, stopping incremental sync`)
			cursor = undefined
			shouldContinue = false
			break
		}

		if (!page.cursor) {
			cursor = undefined
			shouldContinue = false
			break
		}

		cursor = page.cursor
	}

	return completeHistorySync(triggerSource, summary)
}
