export type RawPlayedMove = string;

export type RawGameResult = {
    type: 'GAME_RESULT';
	gameId: string;
	time: number | string;
	playerA: {
		name: string;
		played: RawPlayedMove;
	};
	playerB: {
		name: string;
		played: RawPlayedMove;
	};
}

export type RawHistoryResponse = {
    data: RawGameResult[];
	cursor?: string;
}
