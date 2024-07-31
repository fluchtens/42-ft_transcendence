import { useGameSocket } from "@/hooks/useGameSocket";
import { useEffect, useRef, useState } from "react";
import * as gm from "../../utils/gameLogic";

const getComputedStyleProperty = (propertyName: string) => {
  return getComputedStyle(document.documentElement).getPropertyValue(propertyName).trim();
};

export const PongBoard = ({ availWidth, availHeight }: { availWidth: number; availHeight: number }) => {
  const backgroundColor = getComputedStyleProperty("--card");
  const foregroundColor = getComputedStyleProperty("--foreground");

  function drawCountdown(cx: CanvasRenderingContext2D, seconds: number, { width, height }: { width: number; height: number }, color = "#3aa043") {
    const cen = {
      x: Math.floor((width + 1) / 2),
      y: Math.floor((height + 1) / 2),
    };
    const textSize = Math.floor(height / 15);
    let saveColor = cx.fillStyle;
    cx.fillStyle = color;
    cx.textAlign = "center";
    cx.fillText(String(Math.ceil(seconds)), cen.x, cen.y + textSize / 2, textSize);

    const arcWidth = 10;
    const frac = seconds % 1;
    cx.beginPath();
    cx.arc(cen.x, cen.y, textSize, 0, frac * 2 * Math.PI, false);
    cx.arc(cen.x, cen.y, textSize + arcWidth, frac * 2 * Math.PI, 2 * Math.PI, true);
    cx.fill();
    cx.fillStyle = saveColor;
  }

  function drawWallGame(cx: CanvasRenderingContext2D, { width, height }: { width: number; height: number }) {
    function rtop(r: number): number {
      return Math.ceil((r / gm.WALL_PONG.width) * width);
    }

    let game: any = gameRef.current;
    if (!game || !cx) return;

    game.update();

    cx.fillStyle = backgroundColor;
    cx.fillRect(0, 0, width, height);

    cx.fillStyle = foregroundColor;

    let [w, h] = [rtop(gm.WALL_PONG.paddleWidth), rtop(gm.WALL_PONG.paddleHeight)];

    for (let { x, y } of game.players) {
      [x, y] = [rtop(x), rtop(y)];
      cx.fillRect(x, y, w, h);
    }

    for (let { x, y, w, h } of game.walls) {
      [x, y, w, h] = [x, y, w, h].map(rtop);
      cx.fillRect(x, y, w, h);
    }

    let textHeight = Math.floor(height / 15);
    cx.font = `${textHeight}px Monospace`;
    cx.textAlign = "left";
    cx.fillText(String(game.scores[0]), 10, textHeight);
    cx.textAlign = "right";
    cx.fillText(String(game.scores[1]), width - 10, textHeight);

    requestAnimationFrame(() => {
      drawWallGame(cx, { width, height });
    });

    let countdown = game.timeToBall() / 1000;
    if (countdown <= 0) {
      let { x, y } = game.ball;
      [x, y] = [rtop(x), rtop(y)];
      cx.fillRect(x, y, w, w);
    } else {
      drawCountdown(cx, game.timeToBall() / 1000, { width, height });
    }
  }

  const gameRef = useRef<gm.Game | null>(null);
  const socket = useGameSocket();
  const boardRef = useRef<HTMLCanvasElement | null>(null);

  let [canvasDim, setCanvasDim] = useState<[number, number]>([availWidth, availHeight]);

  useEffect(function () {
    socket.emit("syncGame", ({ type, args, packet }: { type: "classic" | "wall"; args: any; packet: any }) => {
      if (!gameRef.current) {
        gameRef.current = gm.makeGame({ type, args });
        gameRef.current.pushPacket(packet);

        let cx = boardRef.current?.getContext("2d");
        if (!cx) throw new Error("Unexpected bad state");

        {
          let aspectRatio = gm.WALL_PONG.width / gm.WALL_PONG.height;
          let [width, height] = [0, 0];
          if (availWidth >= availHeight * aspectRatio) [width, height] = [availHeight * aspectRatio, availHeight];
          else [width, height] = [availWidth, availWidth / aspectRatio];
          setCanvasDim([width, height]);
          drawWallGame(cx, { width, height });
        }

        boardRef.current?.focus();
      } else {
        gameRef.current.pushPacket(packet);
      }
    });

    socket.on("gameUpdate", (packet) => {
      if (!gameRef.current) return;

      gameRef.current.pushPacket(packet);
      gameRef.current.update();
    });

    return function cleanup() {
      gameRef.current = null;
      socket.off("gameUpdate");
    };
  }, []);

  const pressed = useRef<Set<string>>(new Set());
  function dir(): gm.MotionType {
    return Number(pressed.current.has("ArrowDown")) - Number(pressed.current.has("ArrowUp"));
  }

  function handleKeyDown(ev: any) {
    if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
      ev.preventDefault();
      if (ev.repeat) return;
      pressed.current.add(ev.key);
      socket.emit("playerMotion", dir());
    }
  }
  function handleKeyUp(ev: any) {
    if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
      ev.preventDefault();
      pressed.current.delete(ev.key);
      socket.emit("playerMotion", dir());
    }
  }

  return (
    <div className="m-auto max-screen-lg h-full flex justify-center items-center">
      <canvas
        ref={boardRef}
        width={canvasDim[0]}
        height={canvasDim[1]}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        className="outline-none border-y-8 border-y-foreground rounded"
      >
        Cannot load pong game.
      </canvas>
    </div>
  );
};
