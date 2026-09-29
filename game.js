const GRID = 20;
const CELL = 20;
const START_DELAY = 140;
const MIN_DELAY = 60;
const SPEED_STEP = 3;

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("high-score");
const finalScoreEl = document.getElementById("final-score");
const startScreen = document.getElementById("start-screen");
const pauseScreen = document.getElementById("pause-screen");
const gameOverScreen = document.getElementById("game-over-screen");
const restartButton = document.getElementById("restart-button");

const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const KEYS = {
  ArrowUp: "up", w: "up", W: "up",
  ArrowDown: "down", s: "down", S: "down",
  ArrowLeft: "left", a: "left", A: "left",
  ArrowRight: "right", d: "right", D: "right",
};

let snake, direction, inputQueue, food, score, delay, timer;
let state = "ready"; // ready | running | paused | over
let highScore = loadHighScore();
highScoreEl.textContent = highScore;

function loadHighScore() {
  try {
    return Number(localStorage.getItem("yilanEnYuksekSkor")) || 0;
  } catch (e) {
    return 0;
  }
}

function saveHighScore() {
  try {
    localStorage.setItem("yilanEnYuksekSkor", String(highScore));
  } catch (e) { /* localStorage kullanılamıyor */ }
}

function resetGame() {
  snake = [
    { x: 8, y: 10 },
    { x: 7, y: 10 },
    { x: 6, y: 10 },
  ];
  direction = "right";
  inputQueue = [];
  score = 0;
  delay = START_DELAY;
  scoreEl.textContent = score;
  placeFood();
  draw();
}

function placeFood() {
  const empty = [];
  for (let x = 0; x < GRID; x++) {
    for (let y = 0; y < GRID; y++) {
      if (!snake.some((s) => s.x === x && s.y === y)) empty.push({ x, y });
    }
  }
  if (empty.length === 0) {
    food = null; // tahta doldu
    return;
  }
  food = empty[Math.floor(Math.random() * empty.length)];
}

function startGame() {
  clearTimeout(timer);
  resetGame();
  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  pauseScreen.classList.add("hidden");
  state = "running";
  timer = setTimeout(tick, delay);
}

function togglePause() {
  if (state === "running") {
    state = "paused";
    clearTimeout(timer);
    pauseScreen.classList.remove("hidden");
  } else if (state === "paused") {
    state = "running";
    pauseScreen.classList.add("hidden");
    timer = setTimeout(tick, delay);
  }
}

function endGame() {
  state = "over";
  clearTimeout(timer);
  if (score > highScore) {
    highScore = score;
    highScoreEl.textContent = highScore;
    saveHighScore();
  }
  finalScoreEl.textContent = score;
  gameOverScreen.classList.remove("hidden");
}

function tick() {
  if (state !== "running") return;

  if (inputQueue.length > 0) direction = inputQueue.shift();

  const d = DIRECTIONS[direction];
  const head = { x: snake[0].x + d.x, y: snake[0].y + d.y };

  const hitsWall = head.x < 0 || head.y < 0 || head.x >= GRID || head.y >= GRID;
  const ate = food && head.x === food.x && head.y === food.y;

  // Kuyruk bu adımda ilerleyeceği için, yemek yenmediyse kuyruk karesi çarpışma sayılmaz.
  const body = ate ? snake : snake.slice(0, -1);
  const hitsSelf = body.some((s) => s.x === head.x && s.y === head.y);

  if (hitsWall || hitsSelf) {
    endGame();
    return;
  }

  snake.unshift(head);

  if (ate) {
    score += 1;
    scoreEl.textContent = score;
    delay = Math.max(MIN_DELAY, START_DELAY - score * SPEED_STEP);
    placeFood();
    if (!food) {
      draw();
      endGame();
      return;
    }
  } else {
    snake.pop();
  }

  draw();
  timer = setTimeout(tick, delay);
}

function drawCell(x, y, color, inset) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x * CELL + inset, y * CELL + inset, CELL - inset * 2, CELL - inset * 2, 5);
  ctx.fill();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (food) drawCell(food.x, food.y, "#f87171", 3);
  snake.forEach((s, i) => drawCell(s.x, s.y, i === 0 ? "#99f6e4" : "#2dd4bf", 1));
}

function queueDirection(name) {
  const last = inputQueue.length > 0 ? inputQueue[inputQueue.length - 1] : direction;
  const a = DIRECTIONS[name];
  const b = DIRECTIONS[last];
  const isReverse = a.x === -b.x && a.y === -b.y;
  if (name === last || isReverse) return;
  if (inputQueue.length < 2) inputQueue.push(name);
}

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    if (state === "ready" || state === "over") startGame();
    else togglePause();
    return;
  }
  const name = KEYS[e.key];
  if (name) {
    e.preventDefault();
    if (state === "running") queueDirection(name);
  }
});

restartButton.addEventListener("click", () => {
  restartButton.blur();
  startGame();
});

resetGame();
