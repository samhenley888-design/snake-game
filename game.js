(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const overlay = document.getElementById("overlay");
  const overlayKicker = document.getElementById("overlay-kicker");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayText = document.getElementById("overlay-text");
  const restartBtn = document.getElementById("restart-btn");

  const GRID = 20;
  const CELL = canvas.width / GRID;
  const TICK_MS = 110;
  const BEST_KEY = "snake-best-score";

  const DIRS = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    w: { x: 0, y: -1 },
    s: { x: 0, y: 1 },
    a: { x: -1, y: 0 },
    d: { x: 1, y: 0 },
    W: { x: 0, y: -1 },
    S: { x: 0, y: 1 },
    A: { x: -1, y: 0 },
    D: { x: 1, y: 0 },
  };

  let snake;
  let direction;
  let pendingDirection;
  let food;
  let score;
  let best = Number(localStorage.getItem(BEST_KEY) || 0);
  let running = false;
  let gameOver = false;
  let lastTick = 0;
  let rafId = null;

  bestEl.textContent = String(best);

  function randomCell() {
    return {
      x: Math.floor(Math.random() * GRID),
      y: Math.floor(Math.random() * GRID),
    };
  }

  function cellsEqual(a, b) {
    return a.x === b.x && a.y === b.y;
  }

  function spawnFood() {
    let next;
    do {
      next = randomCell();
    } while (snake.some((segment) => cellsEqual(segment, next)));
    food = next;
  }

  function resetGame() {
    const startX = Math.floor(GRID / 2);
    const startY = Math.floor(GRID / 2);
    snake = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY },
    ];
    direction = { x: 1, y: 0 };
    pendingDirection = { ...direction };
    score = 0;
    scoreEl.textContent = "0";
    gameOver = false;
    running = true;
    spawnFood();
    hideOverlay();
    lastTick = 0;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(loop);
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
  }

  function showOverlay({ kicker, title, text, button }) {
    overlayKicker.textContent = kicker;
    overlayTitle.textContent = title;
    overlayText.textContent = text;
    restartBtn.textContent = button;
    overlay.classList.remove("hidden");
  }

  function endGame() {
    running = false;
    gameOver = true;
    const isNewBest = score > best;
    if (isNewBest) {
      best = score;
      localStorage.setItem(BEST_KEY, String(best));
      bestEl.textContent = String(best);
    }
    showOverlay({
      kicker: "Game Over",
      title: score > 0 ? `Score ${score}` : "Ouch!",
      text: isNewBest
        ? "New best score! Press restart to play again."
        : "You hit a wall or yourself. Press Space, R, or the button to try again.",
      button: "Play Again",
    });
  }

  function queueOpposite(a, b) {
    return a.x === -b.x && a.y === -b.y;
  }

  function step() {
    if (!running) return;

    if (!isOpposite(pendingDirection, direction)) {
      direction = pendingDirection;
    }

    const head = snake[0];
    const next = {
      x: head.x + direction.x,
      y: head.y + direction.y,
    };

    if (next.x < 0 || next.y < 0 || next.x >= GRID || next.y >= GRID) {
      endGame();
      return;
    }

    if (snake.some((segment) => cellsEqual(segment, next))) {
      endGame();
      return;
    }

    snake.unshift(next);

    if (cellsEqual(next, food)) {
      score += 1;
      scoreEl.textContent = String(score);
      spawnFood();
    } else {
      snake.pop();
    }
  }

  function drawRoundedRect(x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Subtle vignette grid accents
    ctx.fillStyle = "rgba(148, 163, 184, 0.035)";
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        if ((x + y) % 2 === 0) {
          ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
        }
      }
    }

    // Food glow
    const fx = food.x * CELL + CELL / 2;
    const fy = food.y * CELL + CELL / 2;
    const foodGlow = ctx.createRadialGradient(fx, fy, 2, fx, fy, CELL);
    foodGlow.addColorStop(0, "rgba(251, 191, 36, 0.85)");
    foodGlow.addColorStop(0.45, "rgba(251, 191, 36, 0.35)");
    foodGlow.addColorStop(1, "rgba(251, 191, 36, 0)");
    ctx.fillStyle = foodGlow;
    ctx.beginPath();
    ctx.arc(fx, fy, CELL, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fbbf24";
    ctx.shadowColor = "rgba(251, 191, 36, 0.7)";
    ctx.shadowBlur = 12;
    drawRoundedRect(food.x * CELL + 4, food.y * CELL + 4, CELL - 8, CELL - 8, 8);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Snake
    snake.forEach((segment, index) => {
      const pad = index === 0 ? 2.5 : 3.5;
      const x = segment.x * CELL + pad;
      const y = segment.y * CELL + pad;
      const size = CELL - pad * 2;
      const t = index / Math.max(snake.length - 1, 1);
      const g = Math.floor(180 + (1 - t) * 50);
      const b = Math.floor(140 + (1 - t) * 40);

      ctx.fillStyle = index === 0 ? "#6ee7b7" : `rgb(52, ${g}, ${b})`;
      ctx.shadowColor = index === 0 ? "rgba(110, 231, 183, 0.55)" : "rgba(52, 211, 153, 0.2)";
      ctx.shadowBlur = index === 0 ? 14 : 6;
      drawRoundedRect(x, y, size, size, index === 0 ? 8 : 6);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // Eyes on head
    if (snake.length) {
      const head = snake[0];
      const cx = head.x * CELL + CELL / 2;
      const cy = head.y * CELL + CELL / 2;
      const eyeOffset = 4.5;
      let left = { x: cx - 4, y: cy - 3 };
      let right = { x: cx + 4, y: cy - 3 };

      if (direction.x === 1) {
        left = { x: cx + 2, y: cy - 4 };
        right = { x: cx + 2, y: cy + 4 };
      } else if (direction.x === -1) {
        left = { x: cx - 2, y: cy - 4 };
        right = { x: cx - 2, y: cy + 4 };
      } else if (direction.y === 1) {
        left = { x: cx - 4, y: cy + 2 };
        right = { x: cx + 4, y: cy + 2 };
      }

      ctx.fillStyle = "#042f2e";
      ctx.beginPath();
      ctx.arc(left.x, left.y, 2.2, 0, Math.PI * 2);
      ctx.arc(right.x, right.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function loop(timestamp) {
    if (!running) {
      drawBoard();
      return;
    }

    if (!lastTick) lastTick = timestamp;
    const elapsed = timestamp - lastTick;
    if (elapsed >= TICK_MS) {
      lastTick = timestamp;
      step();
    }

    drawBoard();
    if (running) {
      rafId = requestAnimationFrame(loop);
    } else {
      drawBoard();
    }
  }

  function handleRestart() {
    resetGame();
  }

  window.addEventListener("keydown", (event) => {
    const key = event.key;

    if (key === " " || key === "Spacebar" || key === "r" || key === "R") {
      event.preventDefault();
      handleRestart();
      return;
    }

    const nextDir = DIRS[key];
    if (!nextDir) return;

    event.preventDefault();
    if (!running && !gameOver) {
      // Allow first move from start screen if desired — still require start
      return;
    }
    if (!running) return;

    if (!isOpposite(nextDir, direction)) {
      pendingDirection = nextDir;
    }
  });

  restartBtn.addEventListener("click", handleRestart);

  // Initial idle board
  snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ];
  direction = { x: 1, y: 0 };
  pendingDirection = { ...direction };
  food = { x: 14, y: 8 };
  score = 0;
  drawBoard();
})();
