
// Mathy utils
// function qr(x: number, d:number) : [number, number] {
// 	// assumes d > 0
// 	// find q, r st. ( x = q * d + r ) with q positive int, and 0 <= r < d
// 	let [q, r] = [x / d, x % d];
// 	return [Math.floor(q), r >= 0 ? r : d + r]; 
// }
// 

function clamp<Type>(min: Type, x: Type, max: Type) {
	if (x < min) return min;
	else if (x > max) return max;
	else return x;
}

// function sign(x : number) {
// 	return Number(x > 0) - Number(x < 0);
// }

export interface Game {
	type: 'classic' | 'wall';

	update(time? : number) : Game;
	updateScores(time? : number) : {finish: boolean, winner?: WhichPlayer};

	minTimeToPoint(from?: number) : number;

	packet(timestamp? : number, fields? : string[]) : {timestamp: number};
	pushPacket(packet:  { timestamp: number} ) : void;

	setMotion(who: WhichPlayer, mo: MotionType, when?: number) : void;
}

export function makeGame(
	{type, args = null} : {type : 'classic' | 'wall', args?: any},
	startTime: number = Date.now(),
) { // TODO ctor args?
	if (type === 'classic') {
		return new ClassicGame(startTime);
	} else {
		console.log('In make: type', type, 'args', args, 'time', startTime);
		if (args)
			return new WallGame(startTime, args);
		else
			return new WallGame(startTime);
	}
}

// Pong Logic
export enum MotionType  { Up = -1, Still = 0, Down = 1 }; // -1, 1 convenient as mult factor for direction
export const PONG = { // Parameters for PONG game
	width: 300,
	height: 200,
	fps: 60,
	get msFrame() { return 1000 / this.fps; },
	margin: 20,
	//
	playerSpeed: 4, // pixels per frame
	ballXSpeed: 2,
	ballMaxYSpeed: 4, // determines angle when edge of paddle is hit
	//
	ballSize: 4,
	get paddleWidth() { return this.ballSize },
	paddleHeight: 20,
	//
	get player1X() { return this.margin; },
	get player2X() {
		return this.width - this.margin - this.paddleWidth;
	},
	//
	winScore: 11,
	//
	startDelay: 3000,
	newBallDelay: 500,
}

// export const PONG = { // Parameters for PONG game
// 	width: 20,
// 	height: 11,
// 	fps: 1,
// 	get msFrame() { return 1000 / this.fps; },
// 	margin: 1,
// 	//
// 	playerSpeed: 1, // pixels per frame
// 	ballXSpeed: 1,
// 	ballMaxYSpeed: 3, // determines angle when edge of paddle is hit
// 	//
// 	ballSize: 1,
// 	get paddleWidth() { return this.ballSize },
// 	paddleHeight: 5,
// 	//
// 	get player1X() { return this.margin; },
// 	get player2X() {
// 		return this.width - this.margin - this.paddleWidth;
// 	},
// 	winScore: 11,
// }

export class Player {
	constructor(
		public x: number,
		public y: number,
		public dy: number = 0,
		public score: number = 0,
	) {}
}

export class Ball {
	constructor(
		public x: number,
		public y: number,
		public dx: number = 0,
		public dy: number = 0,
	) {}
}
	
export enum WhichPlayer { P1 = -1, P2 = 1 } // -1, 1 convenient as mult factor for direction
export class ClassicGame implements Game {
	public player1: Player;
	public player2: Player;
	private _ball: Ball = new Ball(0,0);
	private _ballEntryTime = 1;
	get ball(): Ball | null {
		return (this._ballEntryTime >= this._lastUpdate)? null : this._ball;
	}

	get type(): 'classic' { return 'classic' };

	constructor(private _lastUpdate: number = Date.now()) {
		let paddleY = Math.trunc((PONG.height - PONG.paddleHeight) / 2);
	 	this.player1 = new Player(PONG.player1X, paddleY);
	 	this.player2 = new Player(PONG.player2X, paddleY);
		this.newBall(WhichPlayer.P1, this._lastUpdate, PONG.startDelay);
	}

	_updateHelper(frames: number) {
		let handleWallCollisions = () => {
			if (!this.ball) return;
			while(true) {
				if (this.ball.y < 0) {
					this.ball.y *= -1;
					this.ball.dy *= -1;
				} else if (this.ball.y > PONG.height - PONG.ballSize) {
					let dy = this.ball.y - (PONG.height - PONG.ballSize);
					this.ball.y -= 2 * dy;
					this.ball.dy *= -1;
				} else {
					break;
				}
			}
		}

		if (frames === 0) return;

		this.player1.y += frames * this.player1.dy;
		this.player1.y = clamp(0, this.player1.y, PONG.height - PONG.paddleHeight);
		this.player2.y += frames * this.player2.dy;
		this.player2.y = clamp(0, this.player2.y, PONG.height - PONG.paddleHeight);

		if (this.ball) {
			this.ball.x += frames * this.ball.dx;
			this.ball.y += frames * this.ball.dy;
			handleWallCollisions();
		}

		return this;
	}

	update( time = Date.now()) {
		let totalFrames = Math.floor( (time - this._lastUpdate) / PONG.msFrame );
		// maybe throw if negative
		this._lastUpdate += totalFrames * PONG.msFrame;
		let framesToBall = Math.ceil( (this._ballEntryTime - this._lastUpdate) / PONG.msFrame);

		if (0 < framesToBall && framesToBall <= totalFrames) {
			this._updateHelper(framesToBall); 
			totalFrames -= framesToBall;
		}

		let handlePaddleCollision = () => {
			if (!this.ball) return;

			let which = (this.ball.dx < 0) ? WhichPlayer.P1 : WhichPlayer.P2;
			if ((this.player(which).y - PONG.ballSize < this.ball.y)
					&& (this.ball.y < (this.player(which).y + PONG.paddleHeight)) ) 
			{
				this.ball.dx *= -1; 

				let dx = 0;
				if (which === WhichPlayer.P1) 
					dx = this.ball.x - (this.player1.x + PONG.paddleWidth);
				else 
					dx = this.ball.x - (this.player2.x - PONG.ballSize);
				this.ball.x -= 2 * dx;

				let newDyRatio = 
					(this.ball.y - (this.player(which).y - PONG.ballSize + 1)) /
					(PONG.paddleHeight - 1 + PONG.ballSize - 1);
				newDyRatio = 2.01 * (newDyRatio - 0.5); // [0, 1] -> [-1, 1]
				this.ball.dy = Math.trunc(PONG.ballMaxYSpeed * newDyRatio);

				this.ball.y += Math.floor( this.ball.dy * (Math.abs(dx) / PONG.ballXSpeed) );
			}
		}

		if (this.ball) {
			let ballPassed = false; 
			while (!ballPassed) {
				ballPassed = ballPassed || this.ball.x <= this.player1.x - PONG.ballSize;
				ballPassed = ballPassed || this.ball.x >= this.player2.x + PONG.paddleWidth;
				if (ballPassed) break;

				let distXToPaddle = 0;
				if (this.ball.dx < 0) // going left
					distXToPaddle = (this.player1.x + PONG.paddleWidth - 1) - this.ball.x;
				else
					distXToPaddle = (this.player2.x) - (this.ball.x + PONG.ballSize - 1);
				let framesToCross = Math.ceil(distXToPaddle / this.ball.dx)
				framesToCross = Math.max(1, framesToCross);
				if (framesToCross > totalFrames)
					break;

				this._updateHelper(framesToCross);
				totalFrames -= framesToCross;
				handlePaddleCollision();

			}
		}
		this._updateHelper(totalFrames);

		return this;
	}

	player(which: WhichPlayer): Player {
		return (which === WhichPlayer.P1) ? this.player1 : this.player2;
	}

	packet(
		timestamp: number | null = null,
		fields = ['player1', 'player2', '_ball', '_ballEntryTime']
	) : {timestamp: number} 
	{
		if (timestamp)
			this.update(timestamp);
		timestamp = timestamp || this._lastUpdate;

		let packet: any = {timestamp};
		for (let key of fields) {
				if (key in this) // check types make sense ('as any')
					packet[key] = (this as any)[key];
		}
		return packet;
	}

	pushPacket(packet: {timestamp: number}) {
		this._lastUpdate = packet.timestamp;
		const allowedFields = ['player1', 'player2', '_ball', '_ballEntryTime'];
		for (let key of allowedFields) {
			if (key in packet) {
				(this as any)[key] = (packet as any)[key];
			}
		}
		this.update();
	}

	newBall(to: WhichPlayer, when: number | null = null, delay = PONG.newBallDelay) {
		if (when)
			this.update(when);

		this._ballEntryTime = this._lastUpdate + delay;

		this._ball = new Ball(0, 0);
		this._ball.x = Math.floor((PONG.width - PONG.ballSize) / 2);
		this._ball.y = Math.floor(Math.random() * (PONG.height - PONG.ballSize));
		this._ball.dx = Number(to) * PONG.ballXSpeed;
		this._ball.dy = Math.ceil(PONG.ballMaxYSpeed / 2);
		if (Math.random() < 0.5) this._ball.dy *= -1;
	}

	updateScores(when: number | null = null) {
		// TODO bad name for this function...
		// more like "if scores should change do so and create new ball"
		if (!this.ball) return {finish: false};
		if (when)
			this.update(when);

		let scorer: WhichPlayer | null = null;

		if (this.ball.x + PONG.ballSize - 1 < 0) {
			scorer = WhichPlayer.P2;
		} else if ( this.ball.x >= PONG.width ) {
			scorer = WhichPlayer.P1;
		}

		if (scorer) {
			if (++this.player(scorer).score >= PONG.winScore)
				return { finish: true, winner: scorer };
// 			this.newBall( -1 * scorer );
			this.newBall( scorer ); // TESTING
		}
		return {finish: false};
	}

	minTimeToPoint(from = Date.now()) {
		if (!this.ball) return -1;
		let offset = 50;
		let time = this._lastUpdate;
		if (this.ball.dx < 0) 
			time += (-PONG.ballSize - this.ball.x) / this.ball.dx * PONG.msFrame;
		else 
			time += (PONG.width - this.ball.x) / this.ball.dx * PONG.msFrame;
		return time + offset - from;
	}

	setMotion(who: WhichPlayer, mo: MotionType, when: number | null = null) {
		if (when)
			this.update(when);
		this.player(who).dy = PONG.playerSpeed * Number(mo);
	}
	
	timeToBall(from = Date.now()) {
		return this._ballEntryTime - from;
	}
}

export const WALL_PONG = {
	width: 3.0, // arbitrary float units
	height: 2.0,
	margin: 0.15,

	playerSpeed: 1.4, // u per second
	ballXSpeed: 1.0,
	ballMaxYSpeed: 1.5, // must be higher than `playerSpeed`
	
	ballSize: 0.04,
	get paddleWidth() { return this.ballSize },
	paddleHeight: 0.20,

	winScore: 11,
	startDelay: 3.0,
	newBallDelay: 0.5,
}

// class Segment {
// 	x: number;
// 	y: number;
// 	size: number;
// 	vertical: boolean;
// 	get horizontal() { return !this.vertical }
// 	set horizontal(val) { this.vertical = !val }
// 
// 	constructor({x, y, size, vertical}: {x: number, y: number, size: number, vertical: boolean}) 
// 	{
// 		this.x = x;
// 		this.y = y;
// 		this.size = size;
// 		this.vertical = vertical;
// 	}
// }

class Rectangle {
	x: number;
	y: number;
	w: number;
	h: number;

	constructor({x, y, w, h}: {x: number, y: number, w: number, h: number}) 
	{
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
	}
}

function positiveMin(...args) {
	let filtered = args.filter( (x) => (x >= 0));
	return (filtered.length === 0) ? -1 : Math.min(...filtered);
}

type Impact = { t: number, hit: Rectangle | MovingRectangle, vertical: boolean }

function timeToImpactStill(projectile, target) {
	function top(rect) { 
		return rect.y;
	}
	function bottom(rect) { 
		return rect.y + rect.h;
	}
	function left(rect) { 
		return rect.x;
	}
	function right(rect) { 
		return rect.x + rect.w;
	}

	let ret : Impact[] = [];

	let tY: number | null = null;
	if (projectile.dy != 0) {
		let targetY = (projectile.dy > 0) ? top(target) : bottom(target);
		let projY = (projectile.dy > 0) ? bottom(projectile) : top(projectile);

		tY = (targetY - projY) / projectile.dy;
		let tmpProj = new MovingRectangle(projectile);
		console.log('ty', tY);
		move(tmpProj, tY);
		if (tY >= 0 && right(tmpProj) >= left(target) && left(tmpProj) <= right(target)) {
			ret.push[{t: tY, hit: target, vertical: false}];
		}
	}

	let tX: number | null = null;
	if (projectile.dx != 0) {
		let targetX = (projectile.dx > 0) ? left(target) : right(target);
		let projX = (projectile.dx > 0) ? right(projectile) : left(projectile);

		tX = (targetX - projX) / projectile.dx;
		let tmpProj = new MovingRectangle(projectile);
		move(tmpProj, tX);
		if (tX > 0 && bottom(tmpProj) >= top(target) && top(tmpProj) <= bottom(target)) {
			ret.push[{t: tX, hit: target, vertical: true}];
		}
	}

	console.log('hits', ret);
	return ret;
}

function timeToImpact(projectile, target) {
	console.log('target', target, 'proj', projectile);
	if (target?.dx || target?.dy) {
		// "compute in reference frame of target"
		let tmpTarget = new Rectangle(target);
		let tmpProj = new MovingRectangle(projectile);

		tmpProj.dx -= target.dx;
		tmpProj.dy -= target.dy;

		return timeToImpactStill(tmpProj, tmpTarget)
			.map(({t, hit, vertical}) => ({t, hit: target, vertical}));
	} else {
		return timeToImpactStill(projectile, target);
	}
}

class MovingRectangle extends Rectangle {
	constructor(
		{x, y, w, h, dx = 0, dy = 0}
		: {x: number, y: number, w: number, h: number, dx?: number, dy?: number}
	) {
		super({x, y, w, h});
		this.dx = dx;
		this.dy = dy;
	} 

	dx: number;
	dy: number;
}

function move(rect, dt: number) {
	rect.x += dt * rect.dx;
	rect.y += dt * rect.dy;
}

export class WallGame {
	ball: MovingRectangle;
	players: [MovingRectangle, MovingRectangle];
	scores = [0, 0];
	mapName: string;
	walls = [];
	get type(): 'wall' { return 'wall' };
	private _lastUpdate: number;

	constructor(startTime = Date.now(), {mapName}: {mapName: string} = {mapName: 'default'}) {
		{ // Init ball
			let x = (WALL_PONG.width - WALL_PONG.ballSize) / 2;
			let y = (WALL_PONG.height - WALL_PONG.ballSize) / 2;
			let s = WALL_PONG.ballSize;

			// TESTING
			this.ball = new MovingRectangle(
				{x, y, w: s, h: s, dx: WALL_PONG.ballXSpeed, dy: WALL_PONG.ballMaxYSpeed}
			);
// 			this.ball = new MovingRectangle({x, y, w: s, h: s});
		}
		{ // Init player paddles
			let y = (WALL_PONG.height - WALL_PONG.paddleHeight) / 2;
			let w = WALL_PONG.paddleWidth;
			let h = WALL_PONG.paddleHeight;

			let x = WALL_PONG.margin;
			let p0 = new MovingRectangle({x, y, w, h});

			x = WALL_PONG.width - (WALL_PONG.margin + WALL_PONG.paddleWidth);
			let p1 = new MovingRectangle({x, y, w, h});
			this.players = [p0, p1];
		}
		this.mapName = mapName;
		console.log('ctor time', startTime);
		this._lastUpdate = startTime;

		this.walls.push(new Rectangle({x:0, y:0, w:WALL_PONG.width, h:0}));
		this.walls.push(new Rectangle({x:0, y:WALL_PONG.height, w: WALL_PONG.width, h:0}));
	}

	_preUpdate(dt) {
// 		console.log('pre update', this, 'dt', dt);
		for (let rect of [this.ball, ...this.players]) {
			move(rect, dt);
		}
		for (let p of this.players) {
			p.y = clamp(0, p.y, WALL_PONG.height - WALL_PONG.paddleHeight);
		}
// 		console.log('post update', this)
	}

	update( time: number = Date.now() ) { 
		let searchImpact = (candidate, targets, type) => {
			let t = -1;
			for (let target of targets) {
				t = positiveMin(timeToImpact(this.ball, target), t);
			}

			console.log('search', type, ':', t);
			if (t < 0) 
				return candidate;
			else if (candidate.t < 0) 
				return {t, type};
			else
				return candidate.t < t ? candidate : {t, type};
		}

// 		while (true) { TODO
		for (let i = 0; i < 10; ++i) { // prevent infinite loops if i got it wrong
			let {t: tImpact, type} = {t: -1, type: 'none'};
			({t: tImpact, type} = searchImpact({t: tImpact, type}, this.walls, 'wall'));
			({t: tImpact, type} = searchImpact({t: tImpact, type}, this.players, 'paddle'));
			console.log('found impact', tImpact, type);

// 			for (let wall of this.walls) {
// 				tImpact = positiveMin(timeToImpact(this.ball, wall), tImpact);
// // 				let t = timeToImpact(this.ball, wall);
// // 				if (t >= 0 && tImpact < 0)
// // 					tImpact = t;
// // 				else if (t >= 0)
// // 					tImpact = Math.min(t, tImpact);
// // 				console.log('t_impact', tImpact)
// 			}


			if (tImpact < 0 || tImpact * 1000 > time - this._lastUpdate ) 
				break;

			this._preUpdate(tImpact);
			if (type === 'wall') {
				this.ball.dy *= -1;
			} else if (type === 'paddle') {
				console.log('hello???', this.ball);
				this.ball.dx *= -1
				// TODO compute effects
			}
			this._lastUpdate += 1000 * tImpact;
		}

		this._preUpdate((time - this._lastUpdate) / 1000);
		this._lastUpdate = time;
		return this;
	}

	updateScores (time: number = 0): {finish: boolean, winner?: WhichPlayer}
 	{ 
		return { finish: false} 
	}

	packet(
		timestamp: number | null = null,
		fields = ['players', 'scores', 'ball', '_lastUpdate'],
	) : {timestamp: number} 
	{
		if (timestamp)
			this.update(timestamp);
		timestamp = timestamp || this._lastUpdate;

		let packet: any = {timestamp};
		for (let key of fields) {
				if (key in this) // check types make sense ('as any')
					packet[key] = (this as any)[key];
		}
		return packet;
	}

	pushPacket(packet: {timestamp: number}) {
		this._lastUpdate = packet.timestamp;
		const allowedFields = ['players', 'scores', 'ball', '_lastUpdate'];
		for (let key of allowedFields) {
			if (key in packet) {
				(this as any)[key] = (packet as any)[key];
			}
		}
		this.update();
	}

	_whichIndex(which: WhichPlayer) {
		return which === WhichPlayer.P1? 0 : 1;
	}

	setMotion(who: WhichPlayer, mo: MotionType, when : number = null) {
		if (when)
			this.update(when);
		this.players[this._whichIndex(who)].dy = WALL_PONG.playerSpeed * Number(mo);
		console.log('MOTION', this);
	};
	//

	minTimeToPoint(from: number = 0) { return 10000};
	timeToBall() { return 0; }
}



// 	update(time = Date.now()) { 
// 		function mirrorCut(x: number, cut: number, sign: number) : [boolean, number] {
// 			if ( sign * x < sign * cut)
// 				return [true, 2 * cut - x];
// 			else
// 				return [false, x];
// 		}
// 		//
// 		let handleWallCollision = () => {
// 			let collision = false;
// 			if (! this.ball ) return ;
// 			//
// 			do {
// 				[collision, this.ball.y] = mirrorCut(this.ball.y, 0, 1); // top wall
// 				if (!collision)
// 					[collision, this.ball.y] = mirrorCut(this.ball.y, PONG.height - PONG.ballSize, -1); // bottom wall
// 				//
// 				if (collision)
// 					this.ball.dy *= -1;
// 			} while ( collision );
// 		}
// 		//
// 		let updateHelper = (frames: number) => {
// 			let [H, h] = [PONG.height, PONG.paddleHeight];
// 			this.player1.y = clamp(0, this.player1.y + frames * this.player1.dy, H - h);
// 			this.player2.y = clamp(0, this.player2.y + frames * this.player2.dy, H - h);
// 			//
// 			if (this.ball) {
// 				this.ball.x += frames * this.ball.dx;
// 				this.ball.y += frames * this.ball.dy;
// 			}
// 			//
// 			handleWallCollision();
// 			totalFrames -= frames;
// 		}
// 		//
// 		let handlePaddleCollision = () => {
// 			if (! this.ball) return;
// 			//
// 			const which = (this.ball.dx < 0) ? WhichPlayer.P1 : WhichPlayer.P2;
// 			const relBallY = this.ball.y - (this.player(which).y - PONG.ballSize + 1);
// 			const hitRange = PONG.paddleHeight + PONG.ballSize - 1;
// 			if ( 0 <= relBallY && relBallY < hitRange) {
// 				this.ball.dy = Math.floor(PONG.ballMaxYSpeed * ( 2*relBallY/(hitRange - 1) - 1));
// 				this.ball.dx *= -1;
// 				//
// 				if (which === WhichPlayer.P1)
// 					[, this.ball.x] = mirrorCut(this.ball.x, PONG.player1X + PONG.paddleWidth, 1);
// 				else
// 					[, this.ball.x] = mirrorCut(this.ball.x, PONG.player2X - PONG.ballSize, -1);
// 			}
// 			// TODO secondary collision (ie with the edge)
// 		}
// 		//
// 		// Make so positions etc, happen as whole number of pixels:
// 		let elapsed = time - this._lastUpdate;
// 		let [totalFrames, rem] = qr(elapsed, 1000 / PONG.fps); // get number of frames elapsed
// 		this._lastUpdate += elapsed - rem; // pretend we're on 
// 																			 // the exact timestamp of the previous frame
// 		//
// 		const maxIter = 20; 
// 		for (let i = 0; i < maxIter; ++i) { 
// 			if (!this.ball) break;
// 			if ( !( PONG.player1X + PONG.paddleWidth <= this.ball.x 
// 						 && this.ball.x <= PONG.player2X - PONG.ballSize))
// 			{ break; } // already passed the goal
// 
// 			let dist = (this.ball.dx < 0)? // signed distance to "goal"
// 					(this.ball.x - (PONG.player1X + PONG.paddleWidth)) :
// 					(this.ball.x - (PONG.player2X - PONG.ballSize));
// 			let crossTime = Math.ceil( -dist / this.ball.dx ); // time (in frames) when the ball 
// 																											// will cross the goal/hit the paddle
// 			if (crossTime >= totalFrames)
// 				break;
// 
// 			updateHelper(crossTime);
// 			handlePaddleCollision();
// 		}
// 		updateHelper(totalFrames);
// 	}

