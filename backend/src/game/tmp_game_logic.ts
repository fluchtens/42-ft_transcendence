
// Mathy utils
function qr(x: number, d:number) : [number, number] {
	// assumes d > 0
	// find q, r st. ( x = q * d + r ) with q positive int, and 0 <= r < d
	let [q, r] = [x / d, x % d];
	return [Math.floor(q), r >= 0 ? r : d + r]; 
}

function clamp<Type>(min: Type, x: Type, max: Type) {
	if (x < min) return min;
	else if (x > max) return max;
	else return x;
}

function sign(x : number) {
	return Number(x > 0) - Number(x < 0);
}

// Pong Logic
export enum MotionType  { Up = -1, Still = 0, Down = 1 }; // -1, 1 convenint as mult factor for direction
export const PONG = { // Parameters for PONG game
	width: 500,
	height: 250,
	fps: 60,
	margin: 25,
	startDelay: 3000, // ms before first ball (do countdown?)
	//
	playerSpeed: 1, // pixels per frame
	ballXSpeed: 1,
	ballMaxYSpeed: 2, // determines angle when edge of paddle is hit
	//
	ballSize: 10,
	get paddleWidth() { return this.ballSize },
	paddleHeight: 50,
	//
	get player1X() { return this.margin; },
	get player2X() {
		return this.width - 1 - this.margin - this.paddleWidth;
	},
}


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
	
export enum WhichPlayer { P1 = -1, P2 = 1 } // -1, 1 convenint as mult factor for direction
export class GameState {
	public player1: Player;
	public player2: Player;
	public ball: Ball | null = null;

	constructor(private _lastUpdate: number = Date.now()/*, public ball: Ball = new Ball(0,0)*/) {
		let paddleY = Math.trunc((PONG.height - PONG.paddleHeight) / 2);
	 	this.player1 = new Player(PONG.player1X, paddleY);
	 	this.player2 = new Player(PONG.player2X, paddleY);
	}

	update(time = Date.now()) { 
		function mirrorCut(x: number, cut: number, sign: number) : [boolean, number] {
			if ( sign * x < sign * cut)
				return [true, 2 * cut - x];
			else
				return [false, x];
		}
		//
		let handleWallCollision = () => {
			let collision = false;
			if (! this.ball ) return ;
			//
			do {
				[collision, this.ball.y] = mirrorCut(this.ball.y, 0, 1); // top wall
				if (!collision)
					[collision, this.ball.y] = mirrorCut(this.ball.y, PONG.height - PONG.ballSize, -1); // bottom wall
				//
				if (collision)
					this.ball.dy *= -1;
			} while ( collision );
		}
		//
		let updateHelper = (frames: number) => {
			let [H, h] = [PONG.height, PONG.paddleHeight];
			this.player1.y = clamp(0, this.player1.y + frames * this.player1.dy, H - h);
			this.player2.y = clamp(0, this.player2.y + frames * this.player2.dy, H - h);
			//
			if (this.ball) {
				this.ball.x += frames * this.ball.dx;
				this.ball.y += frames * this.ball.dy;
			}
			//
			handleWallCollision();
			totalFrames -= frames;
		}
		//
		let handlePaddleCollision = () => {
			if (! this.ball) return;
			//
			const which = (this.ball.dx < 0) ? WhichPlayer.P1 : WhichPlayer.P2;
			const relBallY = this.ball.y - (this.player(which).y - PONG.ballSize + 1);
			const hitRange = PONG.paddleHeight + PONG.ballSize - 1;
			if ( 0 <= relBallY && relBallY < hitRange) {
				console.log('paddle Hit', this);
				this.ball.dy = Math.floor(PONG.ballMaxYSpeed * ( 2*relBallY/(hitRange - 1) - 1));
				this.ball.dx *= -1;
				//
				if (which === WhichPlayer.P1)
					[, this.ball.x] = mirrorCut(this.ball.x, PONG.player1X + PONG.paddleWidth, 1);
				else
					[, this.ball.x] = mirrorCut(this.ball.x, PONG.player2X - PONG.ballSize, -1);
				console.log('post hit', this);
			}
			// TODO secondary collision (ie with the edge)
		}
		//
		// Make so positions etc, happen as whole number of pixels:
		let elapsed = time - this._lastUpdate;
		let [totalFrames, rem] = qr(elapsed, 1000 / PONG.fps); // get number of frames elapsed
		this._lastUpdate += elapsed - rem; // pretend we're on 
																			 // the exact timestamp of the previous frame
		//
		const maxIter = 20; 
		for (let i = 0; i < maxIter; ++i) { 
			if (!this.ball) break;
			if ( !( PONG.player1X + PONG.paddleWidth <= this.ball.x 
						 && this.ball.x <= PONG.player2X - PONG.ballSize))
			{ break; } // already passed the goal

			let dist = (this.ball.dx < 0)? // signed distance to "goal"
					(this.ball.x - (PONG.player1X + PONG.paddleWidth)) :
					(this.ball.x - (PONG.player2X - PONG.ballSize));
			let crossTime = Math.ceil( -dist / this.ball.dx ); // time (in frames) when the ball 
																											// will cross the goal/hit the paddle
			if (crossTime >= totalFrames)
				break;

			updateHelper(crossTime);
			handlePaddleCollision();
		}
		updateHelper(totalFrames);
	}

	player(which: WhichPlayer): Player {
		return (which === WhichPlayer.P1) ? this.player1 : this.player2;
	}

	newBall(to: WhichPlayer, when: number = Date.now()) {
		this.ball = new Ball(0, 0);
		this.ball.x = Math.floor((PONG.width + PONG.ballSize) / 2);
		this.ball.y = Math.floor(Math.random() * (PONG.height - PONG.ballSize));
		this.ball.dx = Number(to) * PONG.ballXSpeed;
		this.ball.dy = PONG.ballMaxYSpeed;
		if (Math.random() < 0.5) this.ball.dy *= -1;
		return this.ball;
	}
}

