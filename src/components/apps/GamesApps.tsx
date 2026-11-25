import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  RotateCcw,
  Trophy,
} from 'lucide-react';
import { PhoneOSController } from '../../os/usePhoneOS';

/* ---------------- 1. SNAKE GAME ---------------- */
export const SnakeGame: React.FC<{ os: PhoneOSController }> = ({ os }) => {
  const GRID = 16;
  const [snake, setSnake] = useState<[number, number][]>([
    [8, 8],
    [7, 8],
    [6, 8],
  ]);
  const [food, setFood] = useState<[number, number]>([12, 8]);
  const [dir, setDir] = useState<[number, number]>([1, 0]);
  const dirRef = useRef<[number, number]>([1, 0]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const best = os.state.gameHighScores.game_snake ?? 0;

  const changeDir = useCallback((nx: number, ny: number) => {
    const [cx, cy] = dirRef.current;
    if (cx + nx === 0 && cy + ny === 0) return;
    dirRef.current = [nx, ny];
    setDir([nx, ny]);
  }, []);

  const reset = () => {
    setSnake([
      [8, 8],
      [7, 8],
      [6, 8],
    ]);
    setFood([12, 8]);
    dirRef.current = [1, 0];
    setDir([1, 0]);
    setScore(0);
    setGameOver(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') changeDir(0, -1);
      if (e.key === 'ArrowDown') changeDir(0, 1);
      if (e.key === 'ArrowLeft') changeDir(-1, 0);
      if (e.key === 'ArrowRight') changeDir(1, 0);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [changeDir]);

  useEffect(() => {
    if (gameOver) return;
    const speed = Math.max(85, 165 - Math.floor(score / 30) * 10);
    const id = window.setInterval(() => {
      setSnake((prev) => {
        const [hx, hy] = prev[0];
        const [dx, dy] = dirRef.current;
        const nx = hx + dx;
        const ny = hy + dy;
        if (
          nx < 0 ||
          nx >= GRID ||
          ny < 0 ||
          ny >= GRID ||
          prev.some(([sx, sy]) => sx === nx && sy === ny)
        ) {
          setGameOver(true);
          return prev;
        }
        const nextSnake: [number, number][] = [[nx, ny], ...prev];
        if (nx === food[0] && ny === food[1]) {
          const nextScore = score + 10;
          setScore(nextScore);
          os.updateHighScore('game_snake', nextScore);
          let fx = Math.floor(Math.random() * GRID);
          let fy = Math.floor(Math.random() * GRID);
          while (nextSnake.some(([sx, sy]) => sx === fx && sy === fy)) {
            fx = Math.floor(Math.random() * GRID);
            fy = Math.floor(Math.random() * GRID);
          }
          setFood([fx, fy]);
        } else {
          nextSnake.pop();
        }
        return nextSnake;
      });
    }, speed);
    return () => window.clearInterval(id);
  }, [food, gameOver, score, os]);

  return (
    <div className="h-full bg-slate-950 text-white flex flex-col items-center justify-between p-4">
      <div className="w-full flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-emerald-400">Neon Serpent</h1>
          <p className="text-[11px] text-slate-400 font-mono">
            Score {score} · Best {Math.max(best, score)}
          </p>
        </div>
        <button onClick={reset} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700" aria-label="Restart">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      <div
        className="w-full max-w-[310px] aspect-square bg-slate-900 rounded-xl border border-slate-800 grid relative overflow-hidden"
        style={{ gridTemplateColumns: `repeat(${GRID}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: GRID * GRID }).map((_, idx) => {
          const x = idx % GRID;
          const y = Math.floor(idx / GRID);
          const isHead = snake[0][0] === x && snake[0][1] === y;
          const isBody = snake.slice(1).some(([sx, sy]) => sx === x && sy === y);
          const isFood = food[0] === x && food[1] === y;
          return (
            <div
              key={idx}
              className={`border-[0.5px] border-slate-950/30 ${
                isHead
                  ? 'bg-emerald-300 rounded-sm'
                  : isBody
                    ? 'bg-emerald-500/80 rounded-[2px]'
                    : isFood
                      ? 'bg-rose-500 rounded-full scale-75'
                      : ''
              }`}
            />
          );
        })}

        {gameOver && (
          <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-2">
            <p className="text-lg font-bold text-rose-400">Game Over</p>
            <p className="text-xs font-mono">Score: {score}</p>
            <button onClick={reset} className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold">
              Play Again
            </button>
          </div>
        )}
      </div>

      {/* Touch D-Pad */}
      <div className="grid grid-cols-3 gap-2 w-40 pb-2">
        <div />
        <button
          onClick={() => changeDir(0, -1)}
          className={`h-11 rounded-xl flex items-center justify-center ${dir[1] === -1 ? 'bg-emerald-600' : 'bg-slate-800'}`}
          aria-label="Up"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
        <div />
        <button
          onClick={() => changeDir(-1, 0)}
          className={`h-11 rounded-xl flex items-center justify-center ${dir[0] === -1 ? 'bg-emerald-600' : 'bg-slate-800'}`}
          aria-label="Left"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => changeDir(0, 1)}
          className={`h-11 rounded-xl flex items-center justify-center ${dir[1] === 1 ? 'bg-emerald-600' : 'bg-slate-800'}`}
          aria-label="Down"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
        <button
          onClick={() => changeDir(1, 0)}
          className={`h-11 rounded-xl flex items-center justify-center ${dir[0] === 1 ? 'bg-emerald-600' : 'bg-slate-800'}`}
          aria-label="Right"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

/* ---------------- 2. FLAPPY BIRD-STYLE GAME ---------------- */
export const FlappyGame: React.FC<{ os: PhoneOSController }> = ({ os }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({
    birdY: 200,
    vel: 0,
    pipes: [{ x: 340, gapY: 180, passed: false }],
    score: 0,
    started: false,
    over: false,
  });
  const [uiScore, setUiScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);

  const best = os.state.gameHighScores.game_flappy ?? 0;

  const flap = useCallback(() => {
    const s = stateRef.current;
    if (s.over) {
      s.birdY = 200;
      s.vel = -5.5;
      s.pipes = [{ x: 340, gapY: 190, passed: false }];
      s.score = 0;
      s.started = true;
      s.over = false;
      setUiScore(0);
      setGameOver(false);
      setStarted(true);
      return;
    }
    s.started = true;
    s.vel = -5.8;
    setStarted(true);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'ArrowUp') {
        e.preventDefault();
        flap();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flap]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const loop = () => {
      const s = stateRef.current;
      const W = canvas.width;
      const H = canvas.height;

      if (s.started && !s.over) {
        s.vel += 0.28;
        s.birdY += s.vel;

        for (const p of s.pipes) {
          p.x -= 2.3;
          if (!p.passed && p.x + 44 < 76) {
            p.passed = true;
            s.score += 1;
            setUiScore(s.score);
            os.updateHighScore('game_flappy', s.score);
          }
          // Collision
          const birdX = 76;
          const r = 12;
          if (birdX + r > p.x && birdX - r < p.x + 44) {
            if (s.birdY - r < p.gapY - 58 || s.birdY + r > p.gapY + 58) {
              s.over = true;
              setGameOver(true);
            }
          }
        }
        if (s.pipes[s.pipes.length - 1].x < W - 165) {
          s.pipes.push({
            x: W + 20,
            gapY: 110 + Math.random() * (H - 220),
            passed: false,
          });
        }
        if (s.pipes[0].x < -60) s.pipes.shift();
        if (s.birdY > H - 14 || s.birdY < 14) {
          s.over = true;
          setGameOver(true);
        }
      }

      // Draw
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#0c4a6e');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Pipes
      for (const p of s.pipes) {
        ctx.fillStyle = '#10b981';
        ctx.fillRect(p.x, 0, 44, p.gapY - 58);
        ctx.fillRect(p.x, p.gapY + 58, 44, H - (p.gapY + 58));
      }

      // Bird
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(76, s.birdY, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(81, s.birdY - 3, 2.5, 0, Math.PI * 2);
      ctx.fill();

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [os]);

  return (
    <div className="h-full bg-slate-950 text-white flex flex-col p-3">
      <div className="flex items-center justify-between px-1 pb-2">
        <h1 className="text-base font-bold text-sky-400">Sky Hopper</h1>
        <span className="text-xs font-mono tabular-nums">
          Score {uiScore} · Best {Math.max(best, uiScore)}
        </span>
      </div>
      <div
        onClick={flap}
        className="flex-1 relative rounded-2xl overflow-hidden border border-slate-800 cursor-pointer"
      >
        <canvas ref={canvasRef} width={340} height={540} className="w-full h-full block" />
        {(!started || gameOver) && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center p-4 pointer-events-none">
            <p className="text-xl font-bold">{gameOver ? 'Crash!' : 'Sky Hopper'}</p>
            <p className="text-xs text-slate-200 mt-1">Tap screen or press Space to fly</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------------- 3. TIC-TAC-TOE GAME ---------------- */
export const TicTacToeGame: React.FC<{ os: PhoneOSController }> = ({ os }) => {
  const [board, setBoard] = useState<(null | 'X' | 'O')[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<'X' | 'O'>('X');
  const [vsAI, setVsAI] = useState(true);
  const [wins, setWins] = useState({ X: 0, O: 0 });

  const checkWinner = (b: (null | 'X' | 'O')[]) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (const [a, c, d] of lines) {
      if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
    }
    return b.every(Boolean) ? 'Draw' : null;
  };

  const winner = checkWinner(board);

  const makeMove = (idx: number) => {
    if (board[idx] || winner) return;
    const next = [...board];
    next[idx] = turn;
    setBoard(next);

    const w = checkWinner(next);
    if (w === 'X' || w === 'O') {
      setWins((prev) => ({ ...prev, [w]: prev[w] + 1 }));
      if (w === 'X') os.updateHighScore('game_tictactoe', wins.X + 1);
      return;
    }
    if (w === 'Draw') return;

    if (vsAI && turn === 'X') {
      window.setTimeout(() => {
        const empty = next.map((v, i) => (v === null ? i : -1)).filter((i) => i !== -1);
        if (empty.length === 0) return;
        // Try winning or blocking move
        let pick = empty[Math.floor(Math.random() * empty.length)];
        for (const candidate of empty) {
          const copy = [...next];
          copy[candidate] = 'O';
          if (checkWinner(copy) === 'O') {
            pick = candidate;
            break;
          }
          copy[candidate] = 'X';
          if (checkWinner(copy) === 'X') {
            pick = candidate;
          }
        }
        const aiBoard = [...next];
        aiBoard[pick] = 'O';
        setBoard(aiBoard);
        const w2 = checkWinner(aiBoard);
        if (w2 === 'O') setWins((prev) => ({ ...prev, O: prev.O + 1 }));
      }, 250);
    } else {
      setTurn(turn === 'X' ? 'O' : 'X');
    }
  };

  const reset = () => {
    setBoard(Array(9).fill(null));
    setTurn('X');
  };

  return (
    <div className="h-full bg-slate-950 text-white flex flex-col justify-between p-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-violet-400">Tic-Tac-Toe</h1>
        <button
          onClick={() => {
            setVsAI((v) => !v);
            reset();
          }}
          className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-medium"
        >
          {vsAI ? 'vs AI' : '2 Players'}
        </button>
      </div>

      <div className="flex justify-around text-center bg-slate-900 rounded-2xl p-3">
        <div>
          <p className="text-xs text-sky-400 font-semibold">Player X</p>
          <p className="text-xl font-mono font-bold">{wins.X}</p>
        </div>
        <div>
          <p className="text-xs text-amber-400 font-semibold">{vsAI ? 'AI (O)' : 'Player O'}</p>
          <p className="text-xl font-mono font-bold">{wins.O}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5 my-auto">
        {board.map((cell, idx) => (
          <button
            key={idx}
            onClick={() => makeMove(idx)}
            className="aspect-square rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-3xl font-bold flex items-center justify-center active:scale-95 transition"
          >
            <span className={cell === 'X' ? 'text-sky-400' : 'text-amber-400'}>{cell}</span>
          </button>
        ))}
      </div>

      <div className="text-center space-y-2">
        <p className="text-xs text-slate-300 h-4">
          {winner ? (winner === 'Draw' ? 'Draw Match!' : `${winner} Wins!`) : `Turn: ${turn}`}
        </p>
        <button
          onClick={reset}
          className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-semibold"
        >
          New Round
        </button>
      </div>
    </div>
  );
};

/* ---------------- 4. CHESS GAME ---------------- */
type Piece = { type: 'p' | 'r' | 'n' | 'b' | 'q' | 'k'; color: 'w' | 'b' };

const UNICODE_CHESS: Record<string, string> = {
  wp: '♙',
  wr: '♖',
  wn: '♘',
  wb: '♗',
  wq: '♕',
  wk: '♔',
  bp: '♟',
  br: '♜',
  bn: '♞',
  bb: '♝',
  bq: '♛',
  bk: '♚',
};

function createInitialChessBoard(): (Piece | null)[][] {
  const back: Piece['type'][] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  return [
    back.map((t) => ({ type: t, color: 'b' })),
    Array.from({ length: 8 }, () => ({ type: 'p', color: 'b' })),
    Array(8).fill(null),
    Array(8).fill(null),
    Array(8).fill(null),
    Array(8).fill(null),
    Array.from({ length: 8 }, () => ({ type: 'p', color: 'w' })),
    back.map((t) => ({ type: t, color: 'w' })),
  ];
}

function getPseudoMoves(board: (Piece | null)[][], r: number, c: number): [number, number][] {
  const piece = board[r][c];
  if (!piece) return [];
  const moves: [number, number][] = [];
  const inBounds = (rr: number, cc: number) => rr >= 0 && rr < 8 && cc >= 0 && cc < 8;

  const slide = (dirs: [number, number][]) => {
    for (const [dr, dc] of dirs) {
      let nr = r + dr;
      let nc = c + dc;
      while (inBounds(nr, nc)) {
        const target = board[nr][nc];
        if (!target) {
          moves.push([nr, nc]);
        } else {
          if (target.color !== piece.color) moves.push([nr, nc]);
          break;
        }
        nr += dr;
        nc += dc;
      }
    }
  };

  if (piece.type === 'p') {
    const dir = piece.color === 'w' ? -1 : 1;
    const startRow = piece.color === 'w' ? 6 : 1;
    if (inBounds(r + dir, c) && !board[r + dir][c]) {
      moves.push([r + dir, c]);
      if (r === startRow && !board[r + dir * 2][c]) {
        moves.push([r + dir * 2, c]);
      }
    }
    for (const dc of [-1, 1]) {
      if (inBounds(r + dir, c + dc)) {
        const t = board[r + dir][c + dc];
        if (t && t.color !== piece.color) moves.push([r + dir, c + dc]);
      }
    }
  } else if (piece.type === 'r') {
    slide([[1, 0], [-1, 0], [0, 1], [0, -1]]);
  } else if (piece.type === 'b') {
    slide([[1, 1], [1, -1], [-1, 1], [-1, -1]]);
  } else if (piece.type === 'q') {
    slide([[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]);
  } else if (piece.type === 'n') {
    for (const [dr, dc] of [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]]) {
      const nr = r + dr;
      const nc = c + dc;
      if (inBounds(nr, nc) && board[nr][nc]?.color !== piece.color) moves.push([nr, nc]);
    }
  } else if (piece.type === 'k') {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (inBounds(nr, nc) && board[nr][nc]?.color !== piece.color) moves.push([nr, nc]);
      }
    }
  }
  return moves;
}

export const ChessGame: React.FC<{ os: PhoneOSController }> = ({ os }) => {
  const [board, setBoard] = useState<(Piece | null)[][]>(createInitialChessBoard);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [turn, setTurn] = useState<'w' | 'b'>('w');
  const [capturedW, setCapturedW] = useState<string[]>([]);
  const [capturedB, setCapturedB] = useState<string[]>([]);
  const [winner, setWinner] = useState<string | null>(null);

  const validMoves = selected ? getPseudoMoves(board, selected[0], selected[1]) : [];

  const applyMove = (b: (Piece | null)[][], fr: number, fc: number, tr: number, tc: number) => {
    const next = b.map((row) => [...row]);
    const moving = next[fr][fc]!;
    const target = next[tr][tc];
    if (target) {
      const sym = UNICODE_CHESS[target.color + target.type];
      if (target.color === 'b') setCapturedW((c) => [...c, sym]);
      else setCapturedB((c) => [...c, sym]);
      if (target.type === 'k') {
        setWinner(moving.color === 'w' ? 'White Wins!' : 'Black AI Wins!');
        if (moving.color === 'w') os.updateHighScore('game_chess', 1);
      }
    }
    next[tr][tc] =
      moving.type === 'p' && (tr === 0 || tr === 7)
        ? { type: 'q', color: moving.color }
        : moving;
    next[fr][fc] = null;
    return next;
  };

  const handleSquare = (r: number, c: number) => {
    if (winner || turn !== 'w') return;
    if (selected) {
      const isValid = validMoves.some(([mr, mc]) => mr === r && mc === c);
      if (isValid) {
        const nextBoard = applyMove(board, selected[0], selected[1], r, c);
        setBoard(nextBoard);
        setSelected(null);
        if (!nextBoard.flat().some((p) => p?.type === 'k' && p.color === 'b')) return;
        setTurn('b');

        // Simple smart AI black move
        window.setTimeout(() => {
          const allMoves: { fr: number; fc: number; tr: number; tc: number; score: number }[] = [];
          const valMap = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };
          for (let rr = 0; rr < 8; rr++) {
            for (let cc = 0; cc < 8; cc++) {
              if (nextBoard[rr][cc]?.color === 'b') {
                for (const [tr, tc] of getPseudoMoves(nextBoard, rr, cc)) {
                  const target = nextBoard[tr][tc];
                  allMoves.push({
                    fr: rr,
                    fc: cc,
                    tr,
                    tc,
                    score: (target ? valMap[target.type] * 10 : 0) + Math.random(),
                  });
                }
              }
            }
          }
          if (allMoves.length > 0) {
            allMoves.sort((a, b) => b.score - a.score);
            const bestMove = allMoves[0];
            setBoard((curr) => applyMove(curr, bestMove.fr, bestMove.fc, bestMove.tr, bestMove.tc));
          }
          setTurn('w');
        }, 320);
        return;
      }
    }
    if (board[r][c]?.color === 'w') {
      setSelected([r, c]);
    } else {
      setSelected(null);
    }
  };

  const reset = () => {
    setBoard(createInitialChessBoard());
    setSelected(null);
    setTurn('w');
    setCapturedW([]);
    setCapturedB([]);
    setWinner(null);
  };

  return (
    <div className="h-full bg-stone-950 text-white flex flex-col justify-between p-3.5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-amber-300">Grandmaster Chess</h1>
          <p className="text-[11px] text-stone-400">
            {winner || (turn === 'w' ? 'Your move (White)' : 'AI thinking...')}
          </p>
        </div>
        <button onClick={reset} className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700" aria-label="Reset chess">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      <div className="h-5 text-sm text-stone-300 truncate">{capturedB.join(' ')}</div>

      <div className="w-full aspect-square grid grid-cols-8 rounded-xl overflow-hidden border border-stone-700">
        {board.map((row, r) =>
          row.map((piece, c) => {
            const darkSq = (r + c) % 2 === 1;
            const isSel = selected?.[0] === r && selected?.[1] === c;
            const isHint = validMoves.some(([mr, mc]) => mr === r && mc === c);
            return (
              <button
                key={`${r}-${c}`}
                onClick={() => handleSquare(r, c)}
                className={`relative flex items-center justify-center text-2xl leading-none select-none ${
                  isSel
                    ? 'bg-amber-500/70'
                    : darkSq
                      ? 'bg-stone-700'
                      : 'bg-stone-300'
                }`}
              >
                {piece && (
                  <span className={piece.color === 'w' ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]' : 'text-stone-950'}>
                    {UNICODE_CHESS[piece.color + piece.type]}
                  </span>
                )}
                {isHint && (
                  <span className="absolute w-2.5 h-2.5 rounded-full bg-emerald-400/80 pointer-events-none" />
                )}
              </button>
            );
          }),
        )}
      </div>

      <div className="h-5 text-sm text-stone-300 truncate">{capturedW.join(' ')}</div>
    </div>
  );
};

/* ---------------- 5. RACING GAME ---------------- */
export const RacingGame: React.FC<{ os: PhoneOSController }> = ({ os }) => {
  const [lane, setLane] = useState(1); // 0, 1, 2
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const laneRef = useRef(1);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const best = os.state.gameHighScores.game_racing ?? 0;

  const setPlayerLane = (l: number) => {
    const clamped = Math.max(0, Math.min(2, l));
    laneRef.current = clamped;
    setLane(clamped);
  };

  const reset = () => {
    setScore(0);
    setOver(false);
    setPlayerLane(1);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setPlayerLane(laneRef.current - 1);
      if (e.key === 'ArrowRight') setPlayerLane(laneRef.current + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (over) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const lanesX = [72, 160, 248];
    const obstacles: { lane: number; y: number; color: string }[] = [
      { lane: 0, y: -60, color: '#38bdf8' },
      { lane: 2, y: -240, color: '#fbbf24' },
    ];
    let roadOffset = 0;
    let pts = 0;
    let raf = 0;

    const tick = () => {
      const speed = 3.8 + Math.min(4.5, pts / 120);
      roadOffset = (roadOffset + speed) % 40;
      pts += 0.25;
      const intScore = Math.floor(pts);
      setScore(intScore);
      os.updateHighScore('game_racing', intScore);

      // Update obstacles
      for (const ob of obstacles) {
        ob.y += speed * 0.92;
        if (ob.y > canvas.height + 50) {
          ob.y = -70 - Math.random() * 120;
          ob.lane = Math.floor(Math.random() * 3);
        }
        // Collision check
        if (ob.lane === laneRef.current && ob.y > 350 && ob.y < 435) {
          setOver(true);
          return;
        }
      }

      // Draw road
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(28, 0, 264, canvas.height);

      // Lane dividers
      ctx.strokeStyle = '#64748b';
      ctx.setLineDash([20, 20]);
      ctx.lineDashOffset = -roadOffset;
      ctx.lineWidth = 3;
      [116, 204].forEach((lx) => {
        ctx.beginPath();
        ctx.moveTo(lx, 0);
        ctx.lineTo(lx, canvas.height);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // Draw obstacles
      for (const ob of obstacles) {
        const cx = lanesX[ob.lane];
        ctx.fillStyle = ob.color;
        ctx.beginPath();
        ctx.roundRect(cx - 20, ob.y, 40, 62, 8);
        ctx.fill();
      }

      // Player car
      const px = lanesX[laneRef.current];
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.roundRect(px - 20, 380, 40, 66, 8);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(px - 15, 382, 9, 5);
      ctx.fillRect(px + 6, 382, 9, 5);

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [over, os]);

  return (
    <div className="h-full bg-slate-950 text-white flex flex-col justify-between p-3">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-base font-bold text-red-400">Apex Velocity</h1>
        <span className="text-xs font-mono tabular-nums">
          {score}m · Best {Math.max(best, score)}m
        </span>
      </div>

      <div className="relative rounded-2xl overflow-hidden border border-slate-800 my-2 flex-1">
        <canvas ref={canvasRef} width={320} height={470} className="w-full h-full block" />
        {over && (
          <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-2">
            <p className="text-lg font-bold text-red-400">Crash!</p>
            <p className="text-xs font-mono">Distance: {score}m</p>
            <button onClick={reset} className="px-4 py-2 rounded-xl bg-red-600 text-xs font-semibold">
              Race Again
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setPlayerLane(lane - 1)}
          className="py-3 rounded-xl bg-slate-800 active:bg-slate-700 font-semibold text-xs flex items-center justify-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Steer Left
        </button>
        <button
          onClick={() => setPlayerLane(lane + 1)}
          className="py-3 rounded-xl bg-slate-800 active:bg-slate-700 font-semibold text-xs flex items-center justify-center gap-1"
        >
          Steer Right <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/* ---------------- 6. 2048 PUZZLE GAME ---------------- */
export const Game2048: React.FC<{ os: PhoneOSController }> = ({ os }) => {
  const spawn = (b: number[][]) => {
    const empty: [number, number][] = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) if (b[r][c] === 0) empty.push([r, c]);
    }
    if (empty.length === 0) return b;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    const copy = b.map((row) => [...row]);
    copy[r][c] = Math.random() < 0.9 ? 2 : 4;
    return copy;
  };

  const initGrid = () => spawn(spawn(Array.from({ length: 4 }, () => Array(4).fill(0))));

  const [grid, setGrid] = useState<number[][]>(initGrid);
  const [score, setScore] = useState(0);
  const best = os.state.gameHighScores.game_2048 ?? 0;

  const slideRow = (row: number[]): { next: number[]; gained: number } => {
    const filtered = row.filter((v) => v !== 0);
    let gained = 0;
    for (let i = 0; i < filtered.length - 1; i++) {
      if (filtered[i] === filtered[i + 1]) {
        filtered[i] *= 2;
        gained += filtered[i];
        filtered[i + 1] = 0;
      }
    }
    const merged = filtered.filter((v) => v !== 0);
    while (merged.length < 4) merged.push(0);
    return { next: merged, gained };
  };

  const move = useCallback(
    (dir: 'left' | 'right' | 'up' | 'down') => {
      setGrid((prev) => {
        let g = prev.map((r) => [...r]);
        let gainedTotal = 0;
        const rotate = (m: number[][]) => m[0].map((_, c) => m.map((r) => r[c]).reverse());

        if (dir === 'up') g = rotate(rotate(rotate(g)));
        if (dir === 'right') g = g.map((r) => [...r].reverse());
        if (dir === 'down') g = rotate(g);

        g = g.map((r) => {
          const { next, gained } = slideRow(r);
          gainedTotal += gained;
          return next;
        });

        if (dir === 'up') g = rotate(g);
        if (dir === 'right') g = g.map((r) => [...r].reverse());
        if (dir === 'down') g = rotate(rotate(rotate(g)));

        const changed = JSON.stringify(g) !== JSON.stringify(prev);
        if (!changed) return prev;
        const nextScore = score + gainedTotal;
        setScore(nextScore);
        os.updateHighScore('game_2048', nextScore);
        return spawn(g);
      });
    },
    [score, os],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') move('left');
      if (e.key === 'ArrowRight') move('right');
      if (e.key === 'ArrowUp') move('up');
      if (e.key === 'ArrowDown') move('down');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [move]);

  const tileColor = (v: number) => {
    if (v === 0) return 'bg-slate-800/70 text-transparent';
    if (v <= 4) return 'bg-slate-700 text-white';
    if (v <= 16) return 'bg-amber-600 text-white';
    if (v <= 64) return 'bg-orange-600 text-white';
    if (v <= 256) return 'bg-rose-600 text-white';
    return 'bg-emerald-500 text-slate-950';
  };

  return (
    <div className="h-full bg-slate-950 text-white flex flex-col justify-between p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-amber-400">2048</h1>
          <p className="text-[11px] font-mono text-slate-400">
            Score {score} · Best {Math.max(best, score)}
          </p>
        </div>
        <button
          onClick={() => {
            setGrid(initGrid());
            setScore(0);
          }}
          className="p-2 rounded-lg bg-slate-800"
          aria-label="Restart 2048"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 bg-slate-900 p-2.5 rounded-2xl border border-slate-800">
        {grid.flat().map((v, i) => (
          <div
            key={i}
            className={`aspect-square rounded-xl flex items-center justify-center text-lg font-bold font-mono tabular-nums transition ${tileColor(v)}`}
          >
            {v || ''}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 w-40 mx-auto pb-2">
        <div />
        <button onClick={() => move('up')} className="h-11 rounded-xl bg-slate-800 flex items-center justify-center">
          <ArrowUp className="w-5 h-5" />
        </button>
        <div />
        <button onClick={() => move('left')} className="h-11 rounded-xl bg-slate-800 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button onClick={() => move('down')} className="h-11 rounded-xl bg-slate-800 flex items-center justify-center">
          <ArrowDown className="w-5 h-5" />
        </button>
        <button onClick={() => move('right')} className="h-11 rounded-xl bg-slate-800 flex items-center justify-center">
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

/* ---------------- 7. PRISM BREAKER (ARCADE) ---------------- */
export const BrickBreakerGame: React.FC<{ os: PhoneOSController }> = ({ os }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const paddleXRef = useRef(130);
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const best = os.state.gameHighScores.game_brick ?? 0;

  const restart = () => {
    setScore(0);
    setStatus('playing');
  };

  useEffect(() => {
    if (status !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    let bx = W / 2;
    let by = H - 70;
    let dx = 2.8;
    let dy = -3.1;
    let pts = 0;

    const cols = 6;
    const rows = 4;
    const colors = ['#ec4899', '#a855f7', '#38bdf8', '#10b981'];
    const bricks = Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => ({
        x: 16 + c * 49,
        y: 36 + r * 24,
        alive: true,
        color: colors[r],
      })),
    ).flat();

    let raf = 0;
    const loop = () => {
      bx += dx;
      by += dy;

      if (bx < 8 || bx > W - 8) dx = -dx;
      if (by < 8) dy = -dy;

      // Paddle collision
      const px = paddleXRef.current;
      if (by >= H - 34 && by <= H - 22 && bx >= px && bx <= px + 72 && dy > 0) {
        dy = -dy;
        const hitOffset = (bx - (px + 36)) / 36;
        dx = hitOffset * 4.2;
      }

      if (by > H + 10) {
        setStatus('lost');
        return;
      }

      let remaining = 0;
      for (const b of bricks) {
        if (!b.alive) continue;
        remaining++;
        if (bx > b.x && bx < b.x + 44 && by > b.y && by < b.y + 16) {
          b.alive = false;
          dy = -dy;
          pts += 15;
          setScore(pts);
          os.updateHighScore('game_brick', pts);
        }
      }
      if (remaining === 0) {
        setStatus('won');
        return;
      }

      ctx.fillStyle = '#090b12';
      ctx.fillRect(0, 0, W, H);

      for (const b of bricks) {
        if (!b.alive) continue;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.roundRect(b.x, b.y, 44, 15, 4);
        ctx.fill();
      }

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(px, H - 28, 72, 10, 5);
      ctx.fill();

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(bx, by, 7, 0, Math.PI * 2);
      ctx.fill();

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [status, os]);

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 320;
    paddleXRef.current = Math.max(0, Math.min(248, x - 36));
  };

  return (
    <div className="h-full bg-slate-950 text-white flex flex-col justify-between p-3">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-base font-bold text-fuchsia-400">Prism Breaker</h1>
        <span className="text-xs font-mono flex items-center gap-1">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          {score} · Best {Math.max(best, score)}
        </span>
      </div>

      <div className="relative flex-1 rounded-2xl overflow-hidden border border-slate-800 my-2">
        <canvas
          ref={canvasRef}
          width={320}
          height={480}
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerMove}
          className="w-full h-full block touch-none"
        />
        {status !== 'playing' && (
          <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-2">
            <p className="text-lg font-bold">{status === 'won' ? 'Stage Cleared!' : 'Game Over'}</p>
            <p className="text-xs font-mono">Score: {score}</p>
            <button onClick={restart} className="px-4 py-2 rounded-xl bg-fuchsia-600 text-xs font-semibold">
              Play Again
            </button>
          </div>
        )}
      </div>

      <p className="text-[11px] text-center text-slate-400 pb-1">
        Move cursor or drag across screen to steer paddle
      </p>
    </div>
  );
};
