let miniGameScore = 0;
let miniGameTimeLeft = 60;
let miniGameTimer = null;
let miniGameSpawnTimer = null;
let miniGameActive = false;

const MINI_GAME_LENGTH = 60;
const MINI_GAME_COLUMNS = 4;
const BOMB_CHANCE = 0.4;

function openMiniGame() {
  miniGameActive = false;
  miniGameScore = 0;
  miniGameTimeLeft = MINI_GAME_LENGTH;

  document.getElementById("mini-game-overlay").classList.add("active");
  document.getElementById("mini-game-message").textContent = "Catch the bees. Avoid the bombs.";
  document.getElementById("mini-game-area").innerHTML = "";
}

function exitMiniGame() {
  stopMiniGameTimers();

  miniGameActive = false;
  document.getElementById("mini-game-area").innerHTML = "";
  document.getElementById("mini-game-message").textContent = "Get ready!";
  document.getElementById("mini-game-overlay").classList.remove("active");
}

function startMiniGame() {
  if (miniGameActive) {
    return;
  }

  miniGameActive = true;
  miniGameScore = 0;
  miniGameTimeLeft = MINI_GAME_LENGTH;

  document.getElementById("mini-game-area").innerHTML = "";
  updateMiniGameMessage();

  miniGameTimer = setInterval(function () {
    miniGameTimeLeft--;
    updateMiniGameMessage();

    if (miniGameTimeLeft <= 0) {
      finishMiniGame(false);
    }
  }, 1000);

  miniGameSpawnTimer = setInterval(function () {
    spawnFallingObject();
  }, 650);
}

function stopMiniGameTimers() {
  if (miniGameTimer) {
    clearInterval(miniGameTimer);
    miniGameTimer = null;
  }

  if (miniGameSpawnTimer) {
    clearInterval(miniGameSpawnTimer);
    miniGameSpawnTimer = null;
  }
}

function updateMiniGameMessage() {
  document.getElementById("mini-game-message").textContent =
    "Score: " + miniGameScore + " | Time: " + miniGameTimeLeft;
}

function spawnFallingObject() {
  if (!miniGameActive) {
    return;
  }

  const gameArea = document.getElementById("mini-game-area");
  const object = document.createElement("img");

  const isBomb = Math.random() < BOMB_CHANCE;

  object.className = "falling-object";
  object.dataset.type = isBomb ? "bomb" : "bee";

  if (isBomb) {
    object.src = "assets/game-bomb.png";
    object.alt = "bomb";
  } else {
    object.src = "assets/game-bee.png";
    object.alt = "bee";
  }

  const column = Math.floor(Math.random() * MINI_GAME_COLUMNS);
  const columnWidth = gameArea.clientWidth / MINI_GAME_COLUMNS;
  const objectSize = 84;

  const x = column * columnWidth + (columnWidth / 3) - (objectSize / 3);

  object.style.left = x + "px";
  object.style.top = "-50px";
  object.style.width = objectSize + "px";
  object.style.height = objectSize + "px";

  const fallDuration = getRandomFallDuration();
  object.style.animationDuration = fallDuration + "ms";

  object.addEventListener("click", function () {
    handleFallingObjectClick(object);
  });

  object.addEventListener("touchstart", function (event) {
    event.preventDefault();
    handleFallingObjectClick(object);
  }, { passive: false });

  object.addEventListener("animationend", function () {
    object.remove();
  });

  gameArea.appendChild(object);
}

function getRandomFallDuration() {
  const minSpeed = 900;
  const maxSpeed = 1900;

  return Math.floor(Math.random() * (maxSpeed - minSpeed + 1)) + minSpeed;
}

function handleFallingObjectClick(object) {
  if (!miniGameActive) {
    return;
  }

  if (object.dataset.clicked === "true") {
    return;
  }

  object.dataset.clicked = "true";

  if (object.dataset.type === "bomb") {
    object.remove();
    finishMiniGame(true);
    return;
  }

  miniGameScore++;
  object.remove();
  updateMiniGameMessage();
}

function finishMiniGame(hitBomb) {
  if (!miniGameActive) {
    return;
  }

  miniGameActive = false;
  stopMiniGameTimers();

  const gameArea = document.getElementById("mini-game-area");
  gameArea.innerHTML = "";

  const happinessGain = hitBomb ? 0 : Math.floor(miniGameScore / 5);

  if (!hitBomb) {
    const beforeStats = getStatSnapshot();

    pet.happiness = Math.min(100, pet.happiness + happinessGain);
    pet.energy = Math.max(0, pet.energy - 5);
    pet.cleanliness = Math.max(0, pet.cleanliness - 5);
    pet.lastUpdated = Date.now();

    savePet();
    updateDisplay();
    showStatChangesFromSnapshot(beforeStats);
  }

  let resultText = "";

  if (hitBomb) {
    resultText =
      "Game over! You tapped a bomb. Score: " +
      miniGameScore +
      ". Happiness +0";
  } else {
    resultText =
      "Time's up! Score: " +
      miniGameScore +
      ". Happiness +" +
      happinessGain;
  }

  document.getElementById("mini-game-message").textContent = resultText;
  showAction(resultText);
}

safeAddClick("start-mini-game-button", startMiniGame);
safeAddClick("exit-mini-game-button", exitMiniGame);
