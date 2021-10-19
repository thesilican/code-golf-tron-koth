"use-strict";

// $ prefix for DOM elements is inspired by jQuery
const $loading = document.getElementById("loading");
const $main = document.getElementById("main");
const $leaderboard = document.getElementById("leaderboard");
const $roundPrev = document.getElementById("round-prev");
const $roundNum = document.getElementById("round-num");
const $roundNext = document.getElementById("round-next");
const $turnStart = document.getElementById("turn-start");
const $turnPrev = document.getElementById("turn-prev");
const $turnPlay = document.getElementById("turn-play");
const $turnNext = document.getElementById("turn-next");
const $turnEnd = document.getElementById("turn-end");
const $playfield = document.getElementById("playfield");

// Variables to control the state of the UI
let tournament;
let roundNum = 0;
let turnNum = 0;
let interval = null;

// Render UI based on state variables
function renderState() {
  const round = tournament.rounds[roundNum];
  const frame = round.frames[turnNum];

  $playfield.innerText = frame;
  $roundNum.innerText = roundNum + 1;
  $turnPlay.innerText = interval === null ? "Play" : "Pause";
}

// Complete tournament simulation on window load
window.addEventListener("load", async () => {
  tournament = new Tournament(SUBMISSIONS);
  let round = 1;
  let turn = 0;
  // Interval to update UI
  const interval = setInterval(() => {
    $loading.innerText = `Running tournament... (round ${round} turn ${turn})`;
  }, 100);
  while (!tournament.finished()) {
    console.log(`Completing tournament round ${round}...`);
    for (turn of tournament.doRound()) {
      // Yield execution every 20 rounds so that UI can update
      if (turn % 20 === 0) {
        await new Promise((res) => setTimeout(res));
      }
    }
    round++;
  }
  clearInterval(interval);
  console.log("Completed all tournament rounds");

  // Add elements to leaderboard
  const leaderboard = tournament.getLeaderboard();
  for (let i = 0; i < leaderboard.length; i++) {
    const bot = leaderboard[i];
    const $bot = document.createElement("p");
    // Hopefully noone will try to XSS with this
    $bot.innerHTML = `<b>#${i + 1}) ${bot.name}</b> by ${bot.author}`;
    $leaderboard.appendChild($bot);
  }

  renderState();

  $loading.style.display = "none";
  $main.style.display = "";
});

// Click event handlers
$roundNext.addEventListener("click", () => {
  roundNum = Math.min(roundNum + 1, tournament.rounds.length - 1);
  turnNum = 0;
  renderState();
});
$roundPrev.addEventListener("click", () => {
  roundNum = Math.max(roundNum - 1, 0);
  turnNum = 0;
  renderState();
});

$turnStart.addEventListener("click", () => {
  turnNum = 0;
  renderState();
});
$turnEnd.addEventListener("click", () => {
  turnNum = tournament.rounds[roundNum].frames.length - 1;
  renderState();
});
$turnNext.addEventListener("click", () => {
  turnNum = Math.min(
    turnNum + 1,
    tournament.rounds[roundNum].frames.length - 1
  );
  renderState();
});
$turnPrev.addEventListener("click", () => {
  turnNum = Math.max(turnNum - 1, 0);
  renderState();
});

$turnPlay.addEventListener("click", () => {
  if (interval === null) {
    // Rewind if on the last frame
    if (turnNum === tournament.rounds[roundNum].frames.length - 1) {
      turnNum = 0;
    }
    // Click $turnNext every 50ms
    interval = setInterval(() => {
      $turnNext.click();
      // Stop interval if on last frame
      if (turnNum === tournament.rounds[roundNum].frames.length - 1) {
        clearInterval(interval);
        interval = null;
      }
      renderState();
    }, 30);
  } else {
    // Pause current interval
    clearInterval(interval);
    interval = null;
    renderState();
  }
});
