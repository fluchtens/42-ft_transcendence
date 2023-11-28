
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

// Pong Logic
export enum MotionType  { Up = -1, Still = 0, Down = 1 }; // -1, 1 convenient as mult factor for direction
export const PONG = { // Parameters for PONG game
	width: 200,
	height: 150,
	fps: 30,
	get msFrame() { return 1000 / this.fps; },
	margin: 20,
	//
	playerSpeed: 6, // pixels per frame
	ballXSpeed: 3,
	ballMaxYSpeed: 6, // determines angle when edge of paddle is hit
	//
	ballSize: 2,
	get paddleWidth() { return this.ballSize },
	paddleHeight: 14,
	//
	get player1X() { return this.margin; },
	get player2X() {
		return this.width - this.margin - this.paddleWidth;
	},
	winScore: 11,
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
export class GameState {
	public player1: Player;
	public player2: Player;
	public ball: Ball | null = null;

	constructor(private _lastUpdate: number = Date.now()/*, public ball: Ball = new Ball(0,0)*/) {
		let paddleY = Math.trunc((PONG.height - PONG.paddleHeight) / 2);
	 	this.player1 = new Player(PONG.player1X, paddleY);
	 	this.player2 = new Player(PONG.player2X, paddleY);
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

		let handlePaddleCollision = () => {
			if (!this.ball) return false;

			let which = (this.ball.dx < 0) ? WhichPlayer.P1 : WhichPlayer.P2;
			if ((this.player(which).y - PONG.ballSize < this.ball.y)
					&& (this.ball.y < (this.player(which).y + PONG.paddleHeight)) ) 
				// TODO seems like the bottom is 1 too short? why
				// maybe it's not? test better
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
// 				console.log('ratio', newDyRatio, 'dy', this.ball.dy);

				return true;
			}

			return false;
		}

		if (this.ball) {
			let ballPassed = false; 
			ballPassed = ballPassed || this.ball.x < this.player1.x + PONG.paddleWidth;
			ballPassed = ballPassed || this.ball.x > this.player2.x - PONG.ballSize;
			while (!ballPassed) {
				let distXToPaddle = 0;
				if (this.ball.dx < 0) // going left
					distXToPaddle = (this.player1.x + PONG.paddleWidth - 1) - this.ball.x;
				else
					distXToPaddle = (this.player2.x) - (this.ball.x + PONG.ballSize - 1);
				let framesToCross = Math.ceil(distXToPaddle / this.ball.dx)
// 				console.log(`dist: ${distXToPaddle}, frames: ${framesToCross}`);
				if (framesToCross > totalFrames)
					break;

				this._updateHelper(framesToCross);
				totalFrames -= framesToCross;

				ballPassed = !handlePaddleCollision();
			}
		}
		this._updateHelper(totalFrames);

		return this;
	}


	player(which: WhichPlayer): Player {
		return (which === WhichPlayer.P1) ? this.player1 : this.player2;
	}

	packet(timestamp: number | null = null, fields = ['player1', 'player2', 'ball']): {timestamp: number} {
		if (timestamp)
			this.update(timestamp);
		timestamp = timestamp || this._lastUpdate;

		let packet: any = {timestamp};
		for (let key of fields) {
				if (key in this) // check types make sense ('as any')
					packet[key] = (this as any)[key];
		}
		console.log('made packet', packet);
		return packet;
	}

	pushPacket(packet: {timestamp: number}) {
		console.log('got packet:', packet);
		console.log('pre:', this);
		this._lastUpdate = packet.timestamp;
		const allowedFields = ['player1', 'player2', 'ball'];
		for (let key of allowedFields) {
			if (key in packet) {
				(this as any)[key] = (packet as any)[key];
			}
		}
		this.update();
		console.log('post:', this);
	}

	newBall(to: WhichPlayer, when: number | null = null) {
		if (when)
			this.update(when);

		this.ball = new Ball(0, 0);
		this.ball.x = Math.floor((PONG.width - PONG.ballSize) / 2);
		this.ball.y = Math.floor(Math.random() * (PONG.height - PONG.ballSize));
		this.ball.dx = Number(to) * PONG.ballXSpeed;
		this.ball.dy = PONG.ballMaxYSpeed;
		if (Math.random() < 0.5) this.ball.dy *= -1;
		return this.ball;
	}

	updateScores(when: number | null = null) {
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

	// TODO setMotion
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
// 				console.log('paddle Hit', this);
// 				this.ball.dy = Math.floor(PONG.ballMaxYSpeed * ( 2*relBallY/(hitRange - 1) - 1));
// 				this.ball.dx *= -1;
// 				//
// 				if (which === WhichPlayer.P1)
// 					[, this.ball.x] = mirrorCut(this.ball.x, PONG.player1X + PONG.paddleWidth, 1);
// 				else
// 					[, this.ball.x] = mirrorCut(this.ball.x, PONG.player2X - PONG.ballSize, -1);
// 				console.log('post hit', this);
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

