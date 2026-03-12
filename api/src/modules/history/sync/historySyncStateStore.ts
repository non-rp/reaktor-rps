import { prisma } from "../../../db/prisma"
import type { HistorySyncState, HistorySyncSummary } from "./historySyncTypes"

const HISTORY_SYNC_ID = "history"
const SYNC_LOCK_STALE_MS = 15 * 60 * 1000

let warnedAboutMissingCursorModel = false

type SyncStateRecord = Awaited<ReturnType<typeof ensureSyncState>>

export async function getHistorySyncState(): Promise<HistorySyncState> {
	const state = await ensureSyncState()
	return mapSyncState(state)
}

export async function acquireHistorySyncLock(
	triggerSource: string,
	hasLiveWorkerInThisProcess: boolean
): Promise<{
	started: boolean
	state: SyncStateRecord
}> {
	const state = await ensureSyncState()
	const now = new Date()
	const heartbeatAgeMs = state.lastHeartbeatAt
		? now.getTime() - state.lastHeartbeatAt.getTime()
		: Number.POSITIVE_INFINITY
	const shouldRecoverStaleLock =
		state.isRunning &&
		(!hasLiveWorkerInThisProcess || heartbeatAgeMs >= SYNC_LOCK_STALE_MS)

	if (state.isRunning && !shouldRecoverStaleLock) {
		console.log(`History sync already running, last heartbeat ${heartbeatAgeMs}ms ago`)
		return {
			started: false,
			state
		}
	}

	if (shouldRecoverStaleLock) {
		console.warn(
			`Recovering stale history sync lock, last heartbeat ${heartbeatAgeMs}ms ago`
		)
	}

	const updatedState = await prisma.syncState.update({
		where: { id: HISTORY_SYNC_ID },
		data: {
			isRunning: true,
			triggerSource,
			lastError: null,
			lastStartedAt: now,
			lastHeartbeatAt: now,
			pagesProcessed: 0,
			matchesFetched: 0,
			matchesCreated: 0,
			matchesUpdated: 0,
			invalidMatches: 0
		}
	})

	return {
		started: true,
		state: updatedState
	}
}

export async function markHistorySyncFailed(message: string): Promise<void> {
	await prisma.syncState.update({
		where: { id: HISTORY_SYNC_ID },
		data: {
			isRunning: false,
			lastError: message
		}
	})
}

export async function touchHistorySyncHeartbeat(nextCursor: string | null): Promise<void> {
	await prisma.syncState.update({
		where: { id: HISTORY_SYNC_ID },
		data: {
			nextCursor,
			lastHeartbeatAt: new Date()
		}
	})
}

export async function updateHistorySyncProgress(
	summary: HistorySyncSummary,
	nextCursor: string | null
): Promise<void> {
	await prisma.syncState.update({
		where: { id: HISTORY_SYNC_ID },
		data: {
			nextCursor,
			lastHeartbeatAt: new Date(),
			pagesProcessed: summary.pagesProcessed,
			matchesFetched: summary.matchesFetched,
			matchesCreated: summary.matchesCreated,
			matchesUpdated: summary.matchesUpdated,
			invalidMatches: summary.invalidMatches
		}
	})
}

export async function completeHistorySync(
	triggerSource: string,
	summary: HistorySyncSummary
): Promise<HistorySyncState> {
	await prisma.syncState.update({
		where: { id: HISTORY_SYNC_ID },
		data: {
			nextCursor: null,
			isRunning: false,
			triggerSource,
			lastError: null,
			lastCompletedAt: new Date(),
			lastHeartbeatAt: new Date(),
			pagesProcessed: summary.pagesProcessed,
			matchesFetched: summary.matchesFetched,
			matchesCreated: summary.matchesCreated,
			matchesUpdated: summary.matchesUpdated,
			invalidMatches: summary.invalidMatches
		}
	})

	return getHistorySyncState()
}

export async function hasSeenHistoryCursor(cursor: string): Promise<boolean> {
	const syncedHistoryCursor = getSyncedHistoryCursorDelegate()

	if (!syncedHistoryCursor) {
		return false
	}

	const existingCursor = await syncedHistoryCursor.findUnique({
		where: { cursor },
		select: { cursor: true }
	})

	return Boolean(existingCursor)
}

export async function rememberHistoryCursor(cursor: string | null): Promise<void> {
	if (!cursor) {
		return
	}

	const syncedHistoryCursor = getSyncedHistoryCursorDelegate()

	if (!syncedHistoryCursor) {
		return
	}

	await syncedHistoryCursor.upsert({
		where: { cursor },
		update: {},
		create: { cursor }
	})
}

async function ensureSyncState() {
	return prisma.syncState.upsert({
		where: { id: HISTORY_SYNC_ID },
		update: {},
		create: {
			id: HISTORY_SYNC_ID
		}
	})
}

function getSyncedHistoryCursorDelegate():
	| {
		findUnique: (args: { where: { cursor: string }, select: { cursor: true } }) => Promise<{ cursor: string } | null>
		upsert: (args: { where: { cursor: string }, update: {}, create: { cursor: string } }) => Promise<unknown>
	}
	| null {
	const delegate = (prisma as typeof prisma & {
		syncedHistoryCursor?: {
			findUnique: (args: { where: { cursor: string }, select: { cursor: true } }) => Promise<{ cursor: string } | null>
			upsert: (args: { where: { cursor: string }, update: {}, create: { cursor: string } }) => Promise<unknown>
		}
	}).syncedHistoryCursor

	if (!delegate && !warnedAboutMissingCursorModel) {
		warnedAboutMissingCursorModel = true
		console.warn("Prisma client does not expose syncedHistoryCursor; restart the API after prisma generate/migrate")
	}

	return delegate ?? null
}

function mapSyncState(state: SyncStateRecord): HistorySyncState {
	return {
		nextCursor: state.nextCursor,
		isRunning: state.isRunning,
		triggerSource: state.triggerSource,
		lastError: state.lastError,
		lastStartedAt: state.lastStartedAt?.toISOString() ?? null,
		lastCompletedAt: state.lastCompletedAt?.toISOString() ?? null,
		lastHeartbeatAt: state.lastHeartbeatAt?.toISOString() ?? null,
		pagesProcessed: state.pagesProcessed,
		matchesFetched: state.matchesFetched,
		matchesCreated: state.matchesCreated,
		matchesUpdated: state.matchesUpdated,
		invalidMatches: state.invalidMatches
	}
}
