let coins = Number(localStorage.getItem("crash_coins")) || 1000;
let bestScore = Number(localStorage.getItem("crash_best")) || 0;
let historyList = JSON.parse(localStorage.getItem("crash_history") || "[]");

let isPlaying = false;
let multiplier = 1;
let crashPoint = 0;
let timer = null;
let currentBet = 10;
let gameStartTime = 0;

const coinsEl = document.getElementById("coins");
const multiplierEl = document.getElementById("multiplier");
const statusEl = document.getElementById("status");
const startBtn = document.getElementById("startBtn");
const cashoutBtn = document.getElementById("cashoutBtn");
const betInput = document.getElementById("betInput");
const betShow = document.getElementById("betShow");
const profitShow = document.getElementById("profitShow");
const bestScoreEl = document.getElementById("bestScore");
const historyEl = document.getElementById("history");
const rocketEl = document.getElementById("rocket");

function saveData() {
  localStorage.setItem("crash_coins", String(coins));
  localStorage.setItem("crash_best", String(bestScore));
  localStorage.setItem("crash_history", JSON.stringify(historyList));
}

function updateUI() {
  coinsEl.textContent = coins;
  betShow.textContent = currentBet;
  bestScoreEl.textContent = bestScore;
  profitShow.textContent = isPlaying
    ? Math.floor(currentBet * multiplier)
    : 0;

  multiplierEl.textContent = multiplier.toFixed(2) + "x";

  const moveX = Math.min(300, (multiplier - 1) * 55);
  const moveY = Math.min(75, (multiplier - 1) * 18);
  rocketEl.style.transform = `translate(${moveX}px, -${moveY}px) rotate(-20deg)`;
}

function renderHistory() {
  historyEl.innerHTML = "";

  if (historyList.length === 0) {
    historyEl.innerHTML = `<div class="history-item">暂无记录</div>`;
    return;
  }

  historyList.slice(0, 8).forEach(item => {
    const div = document.createElement("div");
    div.className = "history-item";

    if (item.result === "win") {
      div.innerHTML = `
        <span>逃跑成功 ${item.multiplier}x</span>
        <strong class="win-text">+${item.profit}</strong>
      `;
    } else {
      div.innerHTML = `
        <span>爆点 ${item.multiplier}x</span>
        <strong class="lose-text">-${item.bet}</strong>
      `;
    }

    historyEl.appendChild(div);
  });
}

function changeBet(amount) {
  if (isPlaying) return;

  let value = Number(betInput.value) || 10;
  value += amount;

  if (value < 10) value = 10;
  if (value > coins) value = coins;

  currentBet = value;
  betInput.value = currentBet;
  updateUI();
}

betInput.addEventListener("input", () => {
  if (isPlaying) return;

  let value = Number(betInput.value) || 10;
  if (value < 10) value = 10;
  if (value > coins) value = coins;

  currentBet = value;
  betInput.value = currentBet;
  updateUI();
});

function generateCrashPoint() {
  const r = Math.random();

  if (r < 0.50) {
    return randomBetween(1.10, 2.00);
  }

  if (r < 0.82) {
    return randomBetween(2.00, 5.00);
  }

  if (r < 0.96) {
    return randomBetween(5.00, 12.00);
  }

  return randomBetween(12.00, 30.00);
}

function randomBetween(min, max) {
  return Number((Math.random() * (max - min) + min).toFixed(2));
}

function startGame() {
  if (isPlaying) return;

  currentBet = Number(betInput.value) || 10;

  if (currentBet < 10) {
    alert("最低下注 10 金币");
    return;
  }

  if (currentBet > coins) {
    alert("金币不足");
    return;
  }

  coins -= currentBet;
  isPlaying = true;
  multiplier = 1;
  crashPoint = generateCrashPoint();
  gameStartTime = Date.now();

  multiplierEl.className = "multiplier";
  statusEl.textContent = "飞行中...";
  startBtn.disabled = true;
  cashoutBtn.disabled = false;
  betInput.disabled = true;

  updateUI();
  saveData();

  timer = setInterval(() => {
    const elapsed = (Date.now() - gameStartTime) / 1000;

    multiplier = 1 + elapsed * 0.45 + Math.pow(elapsed, 1.35) * 0.08;
    multiplier = Number(multiplier.toFixed(2));

    updateUI();

    if (multiplier >= crashPoint) {
      boom();
    }
  }, 80);
}

function cashOut() {
  if (!isPlaying) return;

  clearInterval(timer);

  const reward = Math.floor(currentBet * multiplier);
  const profit = reward - currentBet;

  coins += reward;

  if (profit > bestScore) {
    bestScore = profit;
  }

  isPlaying = false;

  multiplierEl.className = "multiplier win";
  statusEl.textContent = `逃跑成功，获得 ${reward} 金币`;

  startBtn.disabled = false;
  cashoutBtn.disabled = true;
  betInput.disabled = false;

  historyList.unshift({
    result: "win",
    multiplier: multiplier.toFixed(2),
    bet: currentBet,
    profit: profit
  });

  historyList = historyList.slice(0, 20);

  updateUI();
  renderHistory();
  saveData();
}

function boom() {
  clearInterval(timer);

  isPlaying = false;
  multiplier = crashPoint;

  multiplierEl.className = "multiplier boom";
  statusEl.textContent = `爆点了！${crashPoint.toFixed(2)}x`;

  startBtn.disabled = false;
  cashoutBtn.disabled = true;
  betInput.disabled = false;

  historyList.unshift({
    result: "lose",
    multiplier: crashPoint.toFixed(2),
    bet: currentBet,
    profit: 0
  });

  historyList = historyList.slice(0, 20);

  updateUI();
  renderHistory();
  saveData();
}

function resetGameData() {
  if (!confirm("确定要重置金币和记录吗？")) return;

  coins = 1000;
  bestScore = 0;
  historyList = [];
  saveData();
  updateUI();
  renderHistory();
}

updateUI();
renderHistory();
