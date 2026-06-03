let currentPlayer = null;
let currentRankType = "today";

let players = JSON.parse(localStorage.getItem("crash_v2_players") || "{}");
let records = JSON.parse(localStorage.getItem("crash_v2_records") || "[]");

let isPlaying = false;
let multiplier = 1;
let crashPoint = 0;
let timer = null;
let currentBet = 10;
let gameStartTime = 0;

const loginCard = document.getElementById("loginCard");
const playerBar = document.getElementById("playerBar");
const tabs = document.getElementById("tabs");

const nicknameInput = document.getElementById("nicknameInput");
const playerNameEl = document.getElementById("playerName");
const inviteCodeEl = document.getElementById("inviteCode");

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
const rankingListEl = document.getElementById("rankingList");
const rocketEl = document.getElementById("rocket");

const gameTab = document.getElementById("gameTab");
const rankTab = document.getElementById("rankTab");
const recordTab = document.getElementById("recordTab");

const gameTabBtn = document.getElementById("gameTabBtn");
const rankTabBtn = document.getElementById("rankTabBtn");
const recordTabBtn = document.getElementById("recordTabBtn");

const todayRankBtn = document.getElementById("todayRankBtn");
const allRankBtn = document.getElementById("allRankBtn");

const adminModal = document.getElementById("adminModal");
const adminPlayerCount = document.getElementById("adminPlayerCount");
const adminRecordCount = document.getElementById("adminRecordCount");

function saveData() {
  localStorage.setItem("crash_v2_players", JSON.stringify(players));
  localStorage.setItem("crash_v2_records", JSON.stringify(records));

  if (currentPlayer) {
    localStorage.setItem("crash_v2_current_player", currentPlayer.id);
  }
}

function makePlayerId(name) {
  return "P" + btoa(unescape(encodeURIComponent(name)))
    .replace(/=/g, "")
    .replace(/\+/g, "")
    .replace(/\//g, "")
    .slice(0, 10);
}

function makeInviteCode(playerId) {
  return playerId.slice(0, 6).toUpperCase();
}

function loginPlayer() {
  const nickname = nicknameInput.value.trim();

  if (!nickname) {
    alert("请输入玩家昵称");
    return;
  }

  if (nickname.length < 2) {
    alert("昵称至少 2 个字");
    return;
  }

  const id = makePlayerId(nickname);

  if (!players[id]) {
    players[id] = {
      id,
      nickname,
      coins: 1000,
      bestScore: 0,
      totalWin: 0,
      totalLose: 0,
      games: 0,
      createdAt: Date.now()
    };
  }

  currentPlayer = players[id];

  saveData();
  enterGame();
}

function logoutPlayer() {
  if (isPlaying) {
    alert("游戏进行中，不能切换玩家");
    return;
  }

  currentPlayer = null;
  localStorage.removeItem("crash_v2_current_player");

  loginCard.classList.remove("hidden");
  playerBar.classList.add("hidden");
  tabs.classList.add("hidden");

  showTab("game");

  nicknameInput.value = "";
  updateUI();
}

function autoLogin() {
  const savedId = localStorage.getItem("crash_v2_current_player");

  if (savedId && players[savedId]) {
    currentPlayer = players[savedId];
    enterGame();
  } else {
    loginCard.classList.remove("hidden");
    playerBar.classList.add("hidden");
    tabs.classList.add("hidden");
  }
}

function enterGame() {
  loginCard.classList.add("hidden");
  playerBar.classList.remove("hidden");
  tabs.classList.remove("hidden");

  playerNameEl.textContent = currentPlayer.nickname;
  inviteCodeEl.textContent = makeInviteCode(currentPlayer.id);

  updateUI();
  renderHistory();
  renderRanking();
}

function showTab(tab) {
  gameTab.classList.add("hidden");
  rankTab.classList.add("hidden");
  recordTab.classList.add("hidden");

  gameTabBtn.classList.remove("active");
  rankTabBtn.classList.remove("active");
  recordTabBtn.classList.remove("active");

  if (tab === "game") {
    gameTab.classList.remove("hidden");
    gameTabBtn.classList.add("active");
  }

  if (tab === "rank") {
    rankTab.classList.remove("hidden");
    rankTabBtn.classList.add("active");
    renderRanking();
  }

  if (tab === "record") {
    recordTab.classList.remove("hidden");
    recordTabBtn.classList.add("active");
    renderHistory();
  }
}

function switchRank(type) {
  currentRankType = type;

  todayRankBtn.classList.remove("active");
  allRankBtn.classList.remove("active");

  if (type === "today") {
    todayRankBtn.classList.add("active");
  } else {
    allRankBtn.classList.add("active");
  }

  renderRanking();
}

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function updateUI() {
  const coins = currentPlayer ? currentPlayer.coins : 1000;
  const best = currentPlayer ? currentPlayer.bestScore : 0;

  coinsEl.textContent = coins;
  betShow.textContent = currentBet;
  bestScoreEl.textContent = best;

  profitShow.textContent = isPlaying
    ? Math.floor(currentBet * multiplier)
    : 0;

  multiplierEl.textContent = multiplier.toFixed(2) + "x";

  const moveX = Math.min(330, (multiplier - 1) * 58);
  const moveY = Math.min(78, (multiplier - 1) * 18);

  rocketEl.style.transform = `translate(${moveX}px, -${moveY}px) rotate(-20deg)`;
}

function changeBet(amount) {
  if (isPlaying) return;
  if (!currentPlayer) {
    alert("请先登录");
    return;
  }

  let value = Number(betInput.value) || 10;
  value += amount;

  if (value < 10) value = 10;
  if (value > currentPlayer.coins) value = currentPlayer.coins;

  currentBet = value;
  betInput.value = currentBet;

  updateUI();
}

betInput.addEventListener("input", () => {
  if (isPlaying) return;
  if (!currentPlayer) return;

  let value = Number(betInput.value) || 10;

  if (value < 10) value = 10;
  if (value > currentPlayer.coins) value = currentPlayer.coins;

  currentBet = value;
  betInput.value = currentBet;

  updateUI();
});

function generateCrashPoint() {
  const r = Math.random();

  if (r < 0.48) {
    return randomBetween(1.10, 2.00);
  }

  if (r < 0.80) {
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
  if (!currentPlayer) {
    alert("请先登录");
    return;
  }

  if (isPlaying) return;

  currentBet = Number(betInput.value) || 10;

  if (currentBet < 10) {
    alert("最低下注 10 金币");
    return;
  }

  if (currentBet > currentPlayer.coins) {
    alert("金币不足");
    return;
  }

  currentPlayer.coins -= currentBet;
  currentPlayer.games += 1;

  isPlaying = true;
  multiplier = 1;
  crashPoint = generateCrashPoint();
  gameStartTime = Date.now();

  multiplierEl.className = "multiplier";
  statusEl.textContent = "飞行中...";
  startBtn.disabled = true;
  cashoutBtn.disabled = false;
  betInput.disabled = true;

  saveData();
  updateUI();

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
  if (!isPlaying || !currentPlayer) return;

  clearInterval(timer);

  const reward = Math.floor(currentBet * multiplier);
  const profit = reward - currentBet;

  currentPlayer.coins += reward;
  currentPlayer.totalWin += Math.max(0, profit);

  if (profit > currentPlayer.bestScore) {
    currentPlayer.bestScore = profit;
  }

  isPlaying = false;

  multiplierEl.className = "multiplier win";
  statusEl.textContent = `逃跑成功，获得 ${reward} 金币`;

  startBtn.disabled = false;
  cashoutBtn.disabled = true;
  betInput.disabled = false;

  records.unshift({
    playerId: currentPlayer.id,
    nickname: currentPlayer.nickname,
    result: "win",
    multiplier: multiplier.toFixed(2),
    bet: currentBet,
    reward,
    profit,
    date: todayKey(),
    time: new Date().toLocaleString()
  });

  records = records.slice(0, 300);

  players[currentPlayer.id] = currentPlayer;

  saveData();
  updateUI();
  renderHistory();
  renderRanking();
}

function boom() {
  if (!currentPlayer) return;

  clearInterval(timer);

  isPlaying = false;
  multiplier = crashPoint;

  currentPlayer.totalLose += currentBet;

  multiplierEl.className = "multiplier boom";
  statusEl.textContent = `爆点了！${crashPoint.toFixed(2)}x`;

  startBtn.disabled = false;
  cashoutBtn.disabled = true;
  betInput.disabled = false;

  records.unshift({
    playerId: currentPlayer.id,
    nickname: currentPlayer.nickname,
    result: "lose",
    multiplier: crashPoint.toFixed(2),
    bet: currentBet,
    reward: 0,
    profit: -currentBet,
    date: todayKey(),
    time: new Date().toLocaleString()
  });

  records = records.slice(0, 300);

  players[currentPlayer.id] = currentPlayer;

  saveData();
  updateUI();
  renderHistory();
  renderRanking();
}

function renderHistory() {
  historyEl.innerHTML = "";

  if (!currentPlayer) {
    historyEl.innerHTML = `<div class="history-item">请先登录</div>`;
    return;
  }

  const myRecords = records
    .filter(item => item.playerId === currentPlayer.id)
    .slice(0, 30);

  if (myRecords.length === 0) {
    historyEl.innerHTML = `<div class="history-item">暂无记录</div>`;
    return;
  }

  myRecords.forEach(item => {
    const div = document.createElement("div");
    div.className = "history-item";

    if (item.result === "win") {
      div.innerHTML = `
        <div>
          <strong>逃跑成功 ${item.multiplier}x</strong>
          <div class="rank-sub">${item.time}</div>
        </div>
        <strong class="win-text">+${item.profit}</strong>
      `;
    } else {
      div.innerHTML = `
        <div>
          <strong>爆点 ${item.multiplier}x</strong>
          <div class="rank-sub">${item.time}</div>
        </div>
        <strong class="lose-text">-${item.bet}</strong>
      `;
    }

    historyEl.appendChild(div);
  });
}

function renderRanking() {
  rankingListEl.innerHTML = "";

  let rankData = [];

  if (currentRankType === "today") {
    const today = todayKey();
    const todayWins = records.filter(item => item.date === today && item.result === "win");

    const map = {};

    todayWins.forEach(item => {
      if (!map[item.playerId]) {
        map[item.playerId] = {
          playerId: item.playerId,
          nickname: item.nickname,
          score: 0,
          count: 0
        };
      }

      if (item.profit > map[item.playerId].score) {
        map[item.playerId].score = item.profit;
      }

      map[item.playerId].count += 1;
    });

    rankData = Object.values(map).sort((a, b) => b.score - a.score);
  } else {
    rankData = Object.values(players)
      .map(player => ({
        playerId: player.id,
        nickname: player.nickname,
        score: player.bestScore || 0,
        count: player.games || 0
      }))
      .sort((a, b) => b.score - a.score);
  }

  rankData = rankData.slice(0, 20);

  if (rankData.length === 0) {
    rankingListEl.innerHTML = `<div class="history-item">暂无排行榜数据</div>`;
    return;
  }

  rankData.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "rank-item";

    const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1;

    div.innerHTML = `
      <div class="rank-no">${medal}</div>
      <div>
        <div class="rank-name">${item.nickname}</div>
        <div class="rank-sub">游戏 ${item.count} 局</div>
      </div>
      <div class="rank-score">${item.score}</div>
    `;

    rankingListEl.appendChild(div);
  });
}

function resetMyData() {
  if (!currentPlayer) return;

  if (!confirm("确定重置当前玩家金币和记录吗？")) return;

  records = records.filter(item => item.playerId !== currentPlayer.id);

  currentPlayer.coins = 1000;
  currentPlayer.bestScore = 0;
  currentPlayer.totalWin = 0;
  currentPlayer.totalLose = 0;
  currentPlayer.games = 0;

  players[currentPlayer.id] = currentPlayer;

  saveData();
  updateUI();
  renderHistory();
  renderRanking();
}

function openAdmin() {
  const pwd = prompt("请输入管理员密码");

  if (pwd !== "888888") {
    alert("密码错误");
    return;
  }

  adminPlayerCount.textContent = Object.keys(players).length;
  adminRecordCount.textContent = records.length;

  adminModal.classList.remove("hidden");
}

function closeAdmin() {
  adminModal.classList.add("hidden");
}

autoLogin();
updateUI();
renderHistory();
renderRanking();
