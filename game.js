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
  const TICK_MS = 100;
  const BEST_KEY = "snake-best-score";

  const KEY_TO_DIR = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    w: { x: 0, y: -1 },
    W: { x: 0, y: -1 },
    s: { x: 0, y: 1 },
    S: { x: 0, y: 1 },
    a: { x: -1, y: 0 },
    A: { x: -1, y: 0 },
    d: { x: 1, y: 0 },
    D: { x: 1, y: 0 },
  };

  let snake = [];
  let direction = { x: 1, y: 0 };
  let pendingDirection = { x: 1, y: 0 };
  let food = { x: 14, y: 8 };
  let score = 0;
  let best = Number(localStorage.getItem(BEST_KEY) || 0);
  let running = false;
  let tickTimer = null;

  bestEl.textContent = String(best);
  canvas.tabIndex = 0;

  function cellsEqual(a, b) {
    return a.x === b.x && a.y === b.y;
  }

  function isOpposite(a, b) {
    return a.x === -b.x && a.y === -b.y;
  }

  function randomCell() {
    return {
      x: Math.floor(Math.random() * GRID),
      y: Math.floor(Math.random() * GRID),
    };
  }

  function spawnFood() {
    let next;
    do {
      next = randomCell();
    } while (snake.some((segment) => cellsEqual(segment, next)));
    food = next;
  }

  function stopLoop() {
    if (tickTimer !== null) {
      clearInterval(tickTimer);
      tickTimer = null;
    }
  }

  function startLoop() {
    stopLoop();
    tickTimer = setInterval(tick, TICK_MS);
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
    overlay.setAttribute("aria-hidden", "true");
  }

  function showOverlay({ kicker, title, text, button }) {
    overlayKicker.textContent = kicker;
    overlayTitle.textContent = title;
    overlayText.textContent = text;
    restartBtn.textContent = button;
    overlay.classList.remove("hidden");
    overlay.setAttribute("aria-hidden", "false");
  }

  function resetBoardIdle() {
    const startX = Math.floor(GRID / 2);
    const startY = Math.floor(GRID / 2);
    snake = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY },
    ];
    direction = { x: 1, y: 0 };
    pendingDirection = { x: 1, y: 0 };
    food = { x: 14, y: 8 };
    score = 0;
    scoreEl.textContent = "0";
    drawBoard();
  }

  function startGame(initialDir) {
    const startX = Math.floor(GRID / 2);
    const startY = Math.floor(GRID / 2);
    snake = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY },
    ];
    // Default move right. Ignore Left at spawn — that would instantly hit the body.
    if (initialDir && !(initialDir.x === -1 && initialDir.y === 0)) {
      direction = { ...initialDir };
      pendingDirection = { ...initialDir };
    } else {
      direction = { x: 1, y: 0 };
      pendingDirection = { x: 1, y: 0 };
    }
    score = 0;
    scoreEl.textContent = "0";
    running = true;
    spawnFood();
    hideOverlay();
    canvas.focus({ preventScroll: true });
    drawBoard();
    startLoop();
  }

  function endGame() {
    running = false;
    stopLoop();
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
        ? "New best! Click Play Again or press Space / R."
        : "Hit a wall or yourself. Click Play Again, or press Space / R.",
      button: "Play Again",
    });
    drawBoard();
  }

  function tick() {
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

    drawBoard();
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

    ctx.fillStyle = "rgba(148, 163, 184, 0.035)";
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        if ((x + y) % 2 === 0) {
          ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
        }
      }
    }

    if (!food || !snake.length) return;

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

    snake.forEach((segment, index) => {
      const pad = index === 0 ? 2.5 : 3.5;
      const x = segment.x * CELL + pad;
      const y = segment.y * CELL + pad;
      const size = CELL - pad * 2;
      const t = index / Math.max(snake.length - 1, 1);
      const g = Math.floor(180 + (1 - t) * 50);
      const b = Math.floor(140 + (1 - t) * 40);

      ctx.fillStyle = index === 0 ? "#6ee7b7" : `rgb(52, ${g}, ${b})`;
      ctx.shadowColor =
        index === 0 ? "rgba(110, 231, 183, 0.55)" : "rgba(52, 211, 153, 0.2)";
      ctx.shadowBlur = index === 0 ? 14 : 6;
      drawRoundedRect(x, y, size, size, index === 0 ? 8 : 6);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    const head = snake[0];
    const cx = head.x * CELL + CELL / 2;
    const cy = head.y * CELL + CELL / 2;
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

  function onKeyDown(event) {
    const key = event.key;

    if (key === " " || key === "Spacebar" || key === "r" || key === "R") {
      event.preventDefault();
      startGame();
      return;
    }

    const nextDir = KEY_TO_DIR[key];
    if (!nextDir) return;

    event.preventDefault();

    if (!running) {
      startGame(nextDir);
      return;
    }

    if (!isOpposite(nextDir, direction)) {
      pendingDirection = { ...nextDir };
    }
  }

  restartBtn.addEventListener("click", (event) => {
    event.preventDefault();
    startGame();
  });

  window.addEventListener("keydown", onKeyDown);
  canvas.addEventListener("keydown", onKeyDown);

  // Clicking the board focuses it so keys always reach the game
  canvas.addEventListener("click", () => {
    canvas.focus({ preventScroll: true });
    if (!running && !overlay.classList.contains("hidden") === false) {
      // no-op; start is via button
    }
  });

  document.addEventListener("click", (event) => {
    if (event.target === restartBtn) return;
    if (!running && overlay.classList.contains("hidden")) {
      canvas.focus({ preventScroll: true });
    }
  });

  resetBoardIdle();
  showOverlay({
    kicker: "Ready",
    title: "Snake",
    text: "Click Start Game (or press Space). The snake moves on its own — then steer with arrows or WASD.",
    button: "Start Game",
  });
})();
