import { Injectable } from '@nestjs/common';
import * as gm from './tmp_game_logic'

///////////////////////////////////////////////////////

@Injectable()
export class GameRouter {

	private _pendingGames: Set<string>;
	private _games: Map<string, gm.GameState>;

	constructor() {
		this._pendingGames = new Set();
		this._games = new Map();

		// tests
		this._pendingGames.add('test1');
		this._pendingGames.add('test2');
	}

	_makeId(): string {
		let id;
		do { 
			id = String(Math.random()).slice(2)
		} while ( this._pendingGames.has(id) || this._games.has(id) );
		return id;
	}

	createGame() {
		let id = this._makeId();
		this._pendingGames.add(id);
		return id;
	}

	cancelGame(id) {
		this._pendingGames.delete(id);
	}

	finishGame(id) {
		this._games.delete(id);
	}

	joinGame(id): [number, gm.GameState] {
		if (! this._pendingGames.has(id) )
			throw Error('no such game');
		//
		let now = Date.now();
		this._pendingGames.delete(id);
		this._games.set(id, new gm.GameState(now));
		return [now, this._games.get(id)];
	}

	get(id) : gm.GameState {
		let ret = this._games.get(id);
		if (!ret) 
			throw Error('no such game');
		return ret;
	}

	get pendingGames() {
		return this._pendingGames;
	}

	hasPending(id) {
		return this._pendingGames.has(id);
	}

	hasRunning(id) {
		return this._games.has(id);
	}

}
