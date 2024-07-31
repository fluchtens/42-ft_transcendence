function clamp<Type>(min: Type, x: Type, max: Type) {
  if (x < min) return min;
  else if (x > max) return max;
  else return x;
}

export interface Game {
  type: 'classic' | 'wall';

  update(time?: number): Game;
  updateScores(time?: number): { finish: boolean; winner?: WhichPlayer };

  minTimeToPoint(from?: number): number;

  packet(timestamp?: number, fields?: string[]): { timestamp: number };
  pushPacket(packet: { timestamp: number }): void;

  setMotion(who: WhichPlayer, mo: MotionType, when?: number): void;
}

export function makeGame(
  { type, args = null }: { type: 'classic' | 'wall'; args?: any },
  startTime: number = Date.now(),
) {
  if (type === 'classic') {
    return new ClassicGame(startTime);
  } else {
    if (args) return new WallGame(startTime, args);
    else return new WallGame(startTime);
  }
}

// Pong Logic
export enum MotionType {
  Up = -1,
  Still = 0,
  Down = 1,
} // -1, 1 convenient as mult factor for direction

export enum WhichPlayer {
  P1 = -1,
  P2 = 1,
} // -1, 1 convenient as mult factor for direction

export const WALL_PONG = {
  width: 3.0, // arbitrary float units
  height: 2.0,
  margin: 0.15,

  playerSpeed: 1.8, // u per second
  ballXSpeed: 1.0,
  //   ballXSpeed: 0.03,
  ballMaxYSpeed: 2.0, // MUST be higher than `playerSpeed`

  ballSize: 0.04,
  get paddleWidth() {
    return this.ballSize;
  },
  paddleHeight: 0.2,

  winScore: 5,
  startDelay: 3000, // ms
  newBallDelay: 500, // ms
};

class Rectangle {
  x: number;
  y: number;
  w: number;
  h: number;

  constructor({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
  }
}

type Impact = {
  t: number;
  hit: Rectangle | MovingRectangle;
  vertical: boolean;
};

function timeToImpactStill(projectile: MovingRectangle, target: Rectangle) {
  type Rect = Rectangle | MovingRectangle;
  function top(rect: Rect) {
    return rect.y;
  }
  function bottom(rect: Rect) {
    return rect.y + rect.h;
  }
  function left(rect: Rect) {
    return rect.x;
  }
  function right(rect: Rect) {
    return rect.x + rect.w;
  }

  let ret: Impact[] = [];

  let tY: number | null = null;
  if (projectile.dy != 0) {
    let targetY = projectile.dy > 0 ? top(target) : bottom(target);
    let projY = projectile.dy > 0 ? bottom(projectile) : top(projectile);

    tY = (targetY - projY) / projectile.dy;
    let tmpProj = new MovingRectangle(projectile);
    move(tmpProj, tY);
    if (
      tY >= 0 &&
      right(tmpProj) >= left(target) &&
      left(tmpProj) <= right(target)
    ) {
      ret.push({ t: tY, hit: target, vertical: false });
    }
  }

  let tX: number | null = null;
  if (projectile.dx != 0) {
    let targetX = projectile.dx > 0 ? left(target) : right(target);
    let projX = projectile.dx > 0 ? right(projectile) : left(projectile);

    tX = (targetX - projX) / projectile.dx;
    let tmpProj = new MovingRectangle(projectile);
    move(tmpProj, tX);
    if (
      tX > 0 &&
      bottom(tmpProj) >= top(target) &&
      top(tmpProj) <= bottom(target)
    ) {
      ret.push({ t: tX, hit: target, vertical: true });
    }
  }

  return ret;
}

function timeToImpact(
  projectile: MovingRectangle,
  target: Rectangle | MovingRectangle,
) {
  if ('dx' in target) {
    // compute "in reference frame of target"
    let tmpTarget = new Rectangle(target);
    let tmpProj = new MovingRectangle(projectile);

    tmpProj.dx -= target.dx;
    tmpProj.dy -= target.dy;

    return timeToImpactStill(tmpProj, tmpTarget).map(({ t, vertical }) => ({
      t,
      hit: target,
      vertical,
    }));
  } else {
    return timeToImpactStill(projectile, target);
  }
}

class MovingRectangle extends Rectangle {
  constructor({
    x,
    y,
    w,
    h,
    dx = 0,
    dy = 0,
  }: {
    x: number;
    y: number;
    w: number;
    h: number;
    dx?: number;
    dy?: number;
  }) {
    super({ x, y, w, h });
    this.dx = dx;
    this.dy = dy;
  }

  dx: number;
  dy: number;
}

function move(rect: MovingRectangle, dt: number) {
  rect.x += dt * rect.dx;
  rect.y += dt * rect.dy;
}

let gMaps: Map<string, Rectangle[]> = new Map();
{
  let [W, H] = [WALL_PONG.width, WALL_PONG.height];
  let s = WALL_PONG.ballSize;
  gMaps.set('default', []);
  gMaps.set('midWall', [
    new Rectangle({ x: (W - s) / 2, y: H / 3, w: s, h: H / 3 }),
  ]);
  gMaps.set('sideWalls', [
    new Rectangle({ x: (W - s) / 2, y: 0, w: s, h: H / 4 }),
    new Rectangle({ x: (W - s) / 2, y: (3 * H) / 4, w: s, h: H / 4 }),
  ]);
  gMaps.set('corridor', [
    new Rectangle({ x: W / 4, y: H / 3, w: W / 2, h: s }),
    new Rectangle({ x: W / 4, y: (2 * H) / 3, w: W / 2, h: s }),
  ]);
}

export class WallGame {
  get maps() {
    return gMaps;
  }
  ball: MovingRectangle;
  players: [MovingRectangle, MovingRectangle];
  scores = [0, 0];
  mapName: string;
  walls: Rectangle[] = [];
  goals: Rectangle[] = [];
  get type(): 'wall' {
    return 'wall';
  }
  private _lastUpdate: number;
  private _nextBallTime: number = 0;
  private _newBallFlag = true;

  constructor(
    startTime = Date.now(),
    { mapName }: { mapName: string } = { mapName: 'default' },
  ) {
    this.mapName = mapName;
    this._lastUpdate = startTime;
    {
      let s = WALL_PONG.ballSize;
      this.ball = new MovingRectangle({ x: 0, y: 0, w: s, h: s });
      this._newBall(0, WALL_PONG.startDelay);
    }
    {
      // Init player paddles
      let y = (WALL_PONG.height - WALL_PONG.paddleHeight) / 2;
      let w = WALL_PONG.paddleWidth;
      let h = WALL_PONG.paddleHeight;

      let x = WALL_PONG.margin;
      let p0 = new MovingRectangle({ x, y, w, h });

      x = WALL_PONG.width - (WALL_PONG.margin + WALL_PONG.paddleWidth);
      let p1 = new MovingRectangle({ x, y, w, h });

      // TESTING
      // 			const eps = 0.4;
      // 			let p1 = new MovingRectangle({x, y: WALL_PONG.height - h - w - 2 * eps, w, h});
      //
      // 			this.ball = new MovingRectangle({x, y: WALL_PONG.height - w - eps, w, h: w, dx: 0, dy: 0.2});
      // 			this._nextBallTime = this._lastUpdate + 2000;
      // END TESTING

      this.players = [p0, p1];
    }
    {
      let [W, H] = [WALL_PONG.width, WALL_PONG.height];
      let s = WALL_PONG.ballSize;

      this.walls.push(new Rectangle({ x: -s, y: 0, w: W + 2 * s, h: 0 }));
      this.walls.push(new Rectangle({ x: -s, y: H, w: W + 2 * s, h: 0 }));

      let mapWalls = this.maps.get(mapName);
      if (mapWalls) {
        for (let wall of mapWalls) {
          this.walls.push(wall);
        }
      }

      this.goals.push(new Rectangle({ x: -s, y: 0, w: 0, h: H }));
      this.goals.push(new Rectangle({ x: W + s, y: 0, w: 0, h: H }));
    }
  }

  _preUpdate(dt: number, ball = true) {
    if (ball) move(this.ball, dt);
    for (let p of this.players) {
      move(p, dt);
      p.y = clamp(0, p.y, WALL_PONG.height - WALL_PONG.paddleHeight);
    }
  }

  update(time: number = Date.now()) {
    let searchImpact = (
      candidate: null | { impact: Impact; type: string },
      targets: Array<Rectangle | MovingRectangle>,
      type: string,
    ) => {
      let impacts: Impact[] = [];
      for (let target of targets) {
        impacts.splice(impacts.length, 0, ...timeToImpact(this.ball, target));
      }
      if (impacts.length === 0) {
        return candidate;
      } else {
        let best = impacts.sort(({ t: t1 }, { t: t2 }) => t1 - t2)[0];
        if (!candidate) return { impact: best, type };
        else
          return best.t < candidate.impact.t
            ? { impact: best, type }
            : candidate;
      }
    };

    const BOUNCE_LIMIT = 200;
    for (let i = 0; true; ++i) {
      if (this._nextBallTime > this._lastUpdate) {
        if (time > this._nextBallTime) {
          this._preUpdate(
            (this._nextBallTime - this._lastUpdate) / 1000,
            false,
          );
          this._lastUpdate = this._nextBallTime;
        } else {
          this._preUpdate((time - this._lastUpdate) / 1000, false);
          this._lastUpdate = time;
          return this;
        }
      }

      let foundImpact = searchImpact(null, this.walls, 'wall');
      foundImpact = searchImpact(foundImpact, this.players, 'paddle');
      foundImpact = searchImpact(foundImpact, this.goals, 'goals');
      if (!foundImpact || i >= BOUNCE_LIMIT) {
        this.ball.dy = 0;
        {
          let [H, s] = [WALL_PONG.height, WALL_PONG.ballSize];
          let eps = 1e-6;
          this.ball.y = clamp(eps, this.ball.y, H - s - eps);
        }
        let t = 0.05 + (foundImpact ? foundImpact.impact.t : 0);
        this._preUpdate(t);
        this._lastUpdate += 1000 * t;
        i = 0;
        continue;
      }

      let { impact, type } = foundImpact;
      let { t, hit, vertical } = impact;
      if (t < 0 || t * 1000 > time - this._lastUpdate) {
        break;
      }

      this._preUpdate(t);
      this._lastUpdate += 1000 * t;
      if (type === 'wall') {
        if (vertical) this.ball.dx *= -1;
        else this.ball.dy *= -1;
      } else if (type === 'paddle') {
        let sign = hit.x > WALL_PONG.width / 2 ? -1 : 1;
        this.ball.dx = sign * WALL_PONG.ballXSpeed;
        let ratio =
          (this.ball.y - (hit.y - this.ball.h)) / (hit.h + this.ball.h);
        ratio = 2 * (ratio - 0.5); // 0,1 -> -1, 1
        this.ball.dy = ratio * WALL_PONG.ballMaxYSpeed;
      } else if (type === 'goals') {
        let index: 0 | 1 = hit.x < 0 ? 1 : 0;
        ++this.scores[index];
        this._newBall(index);
      }
    }

    this._preUpdate((time - this._lastUpdate) / 1000);
    this._lastUpdate = time;
    return this;
  }

  _newBall(to: 0 | 1, delay = WALL_PONG.newBallDelay) {
    const eps = 1e-6;
    this.ball.x = (WALL_PONG.width - WALL_PONG.ballSize) / 2;
    this.ball.y =
      eps + Math.random() * (WALL_PONG.height - WALL_PONG.ballSize - eps);
    this.ball.dx = (to === 0 ? -1 : 1) * WALL_PONG.ballXSpeed;
    this.ball.dy = WALL_PONG.ballMaxYSpeed / 2;
    this._nextBallTime = this._lastUpdate + delay;
    if (Math.random() < 0.5) this.ball.dy *= -1;
  }

  updateScores(time: number | null = null): {
    finish: boolean;
    winner?: WhichPlayer;
  } {
    if (time) this.update(time);

    if (this.scores[0] >= 5) return { finish: true, winner: WhichPlayer.P1 };
    else if (this.scores[1] >= 5)
      return { finish: true, winner: WhichPlayer.P2 };
    else return { finish: false };
  }

  packet(
    timestamp: number | null = null,
    fields = ['players', 'scores', 'ball', '_lastUpdate', '_nextBallTime'],
  ): { timestamp: number } {
    if (timestamp) this.update(timestamp);
    timestamp = timestamp || this._lastUpdate;

    let packet: any = { timestamp };
    for (let key of fields) {
      if (key in this)
        // check types make sense ('as any')
        packet[key] = (this as any)[key];
    }
    return packet;
  }

  pushPacket(packet: { timestamp: number }) {
    this._lastUpdate = packet.timestamp;
    const allowedFields = [
      'players',
      'scores',
      'ball',
      '_lastUpdate',
      '_nextBallTime',
    ];
    for (let key of allowedFields) {
      if (key in packet) {
        (this as any)[key] = (packet as any)[key];
      }
    }
    this.update();
  }

  setMotion(who: WhichPlayer, mo: MotionType, when: number | null = null) {
    function whichIndex(which: WhichPlayer) {
      return which === WhichPlayer.P1 ? 0 : 1;
    }

    if (when) this.update(when);
    this.players[whichIndex(who)].dy = WALL_PONG.playerSpeed * Number(mo);
  }

  minTimeToPoint(from: number = Date.now()) {
    let offset = 50;
    let time = this._lastUpdate;
    if (this._nextBallTime > time) {
      if (this._newBallFlag) {
        this._newBallFlag = false;
        return offset;
      } else {
        return offset + (this._nextBallTime - from);
      }
    }
    time += Math.min(
      Math.abs(((this.goals[0].x - this.ball.x) / this.ball.dx) * 1000),
      Math.abs(
        ((this.goals[1].x - (this.ball.x + this.ball.w)) / this.ball.dx) * 1000,
      ),
    );
    return time + offset - from;
  }

  timeToBall(from = Date.now()) {
    return this._nextBallTime - from;
  }
}

export class ClassicGame extends WallGame {
  constructor(startTime = Date.now()) {
    super(startTime, { mapName: 'default' });
  }
}
