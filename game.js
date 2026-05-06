const DEBUG = typeof DEBUG_MODE !== "undefined" ? DEBUG_MODE : false;
let pet = {
  petName: "Erin",
  hunger: 100,
  happiness: 100,
  energy: 100,
  cleanliness: 100,
  hasStarted: false,
  birthTime: null,
  lastUpdated: null,
  isSleeping: false,
  sleepStartTime: null,
  sleepEndTime: null,
  sleepType: null,
  currentAction: null,
  actionEndTime: null,
  lastVisitTime: null,
  brbUntil: null,
  awayMessageShown: false,
  isAway: false,
  awayStartTime: null,
  
  actionCooldowns: {
  feed: 0,
  play: 0,
  nap: 0,
  clean: 0
}
};

const NAP_DURATION = 30000;
const BEDTIME_DURATION = DEBUG ? 120000 : 8 * 60 * 60 * 1000;
const FEED_COOLDOWN = 30000;
const PLAY_COOLDOWN = 30000;
const NAP_COOLDOWN = 60000;
const CLEAN_COOLDOWN = 30000;
const AWAY_LIMIT = 6 * 60 * 60 * 1000;
const BRB_LIMIT = 12 * 60 * 60 * 1000;

function safeAddClick(id, handler) {
  const element = document.getElementById(id);

  if (element) {
    element.addEventListener("click", handler);
  }
}

function savePet() {
  localStorage.setItem("myPet", JSON.stringify(pet));
}

function loadPet() {
  const savedPet = localStorage.getItem("myPet");

  if (savedPet) {
    pet = JSON.parse(savedPet);
  }

  if (pet.lastVisitTime === undefined) {
    pet.lastVisitTime = Date.now();
  }

  if (pet.brbUntil === undefined) {
    pet.brbUntil = null;
  }

  if (pet.awayMessageShown === undefined) {
    pet.awayMessageShown = false;
  }

  if (pet.isAway === undefined) {
    pet.isAway = false;
  }

  if (pet.awayStartTime === undefined) {
    pet.awayStartTime = null;
  }

  if (pet.hasStarted === undefined) {
    pet.hasStarted = false;
  }

  if (pet.isSleeping === undefined) {
    pet.isSleeping = false;
  }

  if (pet.sleepStartTime === undefined) {
    pet.sleepStartTime = null;
  }

  if (pet.sleepEndTime === undefined) {
    pet.sleepEndTime = null;
  }

  if (pet.sleepType === undefined) {
    pet.sleepType = null;
  }

  if (!pet.actionCooldowns) {
    pet.actionCooldowns = {
      feed: 0,
      play: 0,
      nap: 0,
      clean: 0
    };
  }
}

function formatDuration(milliseconds) {
  let seconds = Math.ceil(milliseconds / 1000);

  const hours = Math.floor(seconds / 3600);
  seconds -= hours * 3600;

  const minutes = Math.floor(seconds / 60);
  seconds -= minutes * 60;

  const parts = [];

  if (hours > 0) {
    parts.push(hours + " hour" + (hours !== 1 ? "s" : ""));
  }

  if (minutes > 0 && hours < 12) {
    parts.push(minutes + " minute" + (minutes !== 1 ? "s" : ""));
  }

  if (hours === 0 && seconds > 0) {
    parts.push(seconds + " second" + (seconds !== 1 ? "s" : ""));
  }

  return parts.join(", ");
}

function isCooldownReady(actionName) {
  const now = Date.now();

  if (!pet.actionCooldowns || !pet.actionCooldowns[actionName]) {
    return true;
  }

  return now >= pet.actionCooldowns[actionName];
}

function setCooldown(actionName, cooldownDuration) {
  pet.actionCooldowns[actionName] = Date.now() + cooldownDuration;
}

function getLargestTimeText(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return days + " day" + (days !== 1 ? "s" : "");
  if (hours > 0) return hours + " hour" + (hours !== 1 ? "s" : "");
  if (minutes > 0) return minutes + " minute" + (minutes !== 1 ? "s" : "");

  return seconds + " second" + (seconds !== 1 ? "s" : "");
}

function getCooldownText(actionName) {
  if (!pet.actionCooldowns || !pet.actionCooldowns[actionName]) {
    return "";
  }

  const now = Date.now();
  const millisecondsLeft = pet.actionCooldowns[actionName] - now;

  if (millisecondsLeft <= 0) {
    return "";
  }

  return formatDuration(millisecondsLeft);
}

function getPetAgeText() {
  if (!pet.birthTime) {
    return "0 seconds";
  }

  const now = Date.now();
  let seconds = Math.floor((now - pet.birthTime) / 1000);

  const years = Math.floor(seconds / (60 * 60 * 24 * 365));
  seconds -= years * 60 * 60 * 24 * 365;

  const months = Math.floor(seconds / (60 * 60 * 24 * 30));
  seconds -= months * 60 * 60 * 24 * 30;

  const days = Math.floor(seconds / (60 * 60 * 24));
  seconds -= days * 60 * 60 * 24;

  const hours = Math.floor(seconds / (60 * 60));
  seconds -= hours * 60 * 60;

  const minutes = Math.floor(seconds / 60);
  seconds -= minutes * 60;

  const parts = [];

  if (years > 0) parts.push(years + "y");
  if (months > 0) parts.push(months + "mo");
  if (days > 0) parts.push(days + "d");
  if (hours > 0) parts.push(hours + "h");
  if (minutes > 0) parts.push(minutes + "m");

  parts.push(seconds + "s");

  return parts.join(" ");
}

function getSleepTimeLeftText() {
  if (!pet.isSleeping || !pet.sleepEndTime) {
    return "";
  }

  const now = Date.now();
  const millisecondsLeft = Math.max(0, pet.sleepEndTime - now);

  return formatDuration(millisecondsLeft) + " left";
}

function updateStatColors() {
  const stats = [
    { id: "hunger-bar", value: pet.hunger },
    { id: "happiness-bar", value: pet.happiness },
    { id: "energy-bar", value: pet.energy },
    { id: "cleanliness-bar", value: pet.cleanliness }
  ];

  stats.forEach(function(stat) {
    const el = document.getElementById(stat.id);
    if (!el) return;

    if (stat.value <= 25) {
      el.classList.add("stat-low");
    } else {
      el.classList.remove("stat-low");
    }
  });
}

function updateStatVisibility() {
  const statsSection = document.getElementById("stats");

  if (!statsSection) return;

  if (DEBUG) {
    statsSection.style.display = "block";
  } else {
    statsSection.style.display = "none";
  }
}

function getPetAgeDebugText() {
  if (!pet.birthTime) {
    return "0 ms";
  }

  const now = Date.now();
  const ageMs = now - pet.birthTime;
  const ageSeconds = Math.floor(ageMs / 1000);

  return ageSeconds + " seconds, " + ageMs + " ms";
}

function getQuarterBar(value) {
  const half = '<span class="half">◐</span>';

  if (value >= 87.5) return "●●●●";
  if (value >= 75)   return "●●●" + half;
  if (value >= 62.5) return "●●●○";
  if (value >= 50)   return "●●" + half + "○";
  if (value >= 37.5) return "●●○○";
  if (value >= 25)   return "●" + half + "○○";
  if (value > 0)     return "●○○○";
  return "○○○○";
}

function updateBedtimeMode() {
  if (
    pet.isSleeping && pet.sleepType === "Bedtime" ||
    pet.isAway
  ) {
    document.body.classList.add("bedtime-mode");
  } else {
    document.body.classList.remove("bedtime-mode");
  }
}

function updateDisplay() {
  document.getElementById("hunger-value").textContent = DEBUG ? pet.hunger : "";
  document.getElementById("happiness-value").textContent = DEBUG ? pet.happiness : "";
  document.getElementById("energy-value").textContent = DEBUG ? pet.energy : "";
  document.getElementById("cleanliness-value").textContent = DEBUG ? pet.cleanliness : "";
document.getElementById("hunger-bar").innerHTML = getQuarterBar(pet.hunger);
document.getElementById("happiness-bar").innerHTML = getQuarterBar(pet.happiness);
document.getElementById("energy-bar").innerHTML = getQuarterBar(pet.energy);
document.getElementById("cleanliness-bar").innerHTML = getQuarterBar(pet.cleanliness);
document.getElementById("hunger-bar").innerHTML = getQuarterBar(pet.hunger);
document.getElementById("happiness-bar").innerHTML = getQuarterBar(pet.happiness);
document.getElementById("energy-bar").innerHTML = getQuarterBar(pet.energy);
document.getElementById("cleanliness-bar").innerHTML = getQuarterBar(pet.cleanliness);

  if (DEBUG) {
    const normalAge = getPetAgeText();
    const debugAge = getPetAgeDebugText();

    document.getElementById("pet-age").textContent =
      "Age: " + normalAge + " (" + debugAge + ")";
  } else {
    document.getElementById("pet-age").textContent = "";
  }

  updateMood();
  updateButtons();
  updateDebugUI();
  updateStatVisibility();
  updateBedtimeMode();
  updateStatColors();
}

function updateButtons() {
  const actions = [
    { id: "feed-button", key: "feed", threshold: pet.hunger <= 90 },
	{ id: "play-button", key: "play", threshold: pet.energy >= 5 },
    { id: "nap-button", key: "nap", threshold: pet.energy <= 75 },
    { id: "bedtime-button", key: "bedtime", threshold: true },
    { id: "clean-button", key: "clean", threshold: pet.cleanliness <= 75 }
  ];

  actions.forEach(function(action) {
    const button = document.getElementById(action.id);
    if (!button) return;

    let isOnCooldown = !isCooldownReady(action.key);
    let failsThreshold = !action.threshold;
    let isSleeping = pet.isSleeping;
	
	if (isOnCooldown) {
  button.title = "Ready in " + getCooldownText(action.key);
} else if (!action.threshold && action.id === "play-button") {
  button.title = "I'm too tired";
} else {
  button.title = "";
}

    if (isSleeping || isOnCooldown || failsThreshold) {
      button.classList.add("cooldown");
    } else {
      button.classList.remove("cooldown");
    }
  });
}

function getCurrentMoodImage() {
  if (
    pet.hunger < 20 &&
    pet.happiness < 20 &&
    pet.energy < 20 &&
    pet.cleanliness < 20
  ) {
    return "assets/pet-miserable.png";
  }

  if (pet.hunger < 30) {
    return "assets/pet-hungry.png";
  }

  if (pet.cleanliness < 30) {
    return "assets/pet-dirty.png";
  }

  if (pet.energy < 30) {
    return "assets/pet-sleepy.png";
  }

  if (pet.happiness < 30) {
    return "assets/pet-sad.png";
  }

  return "assets/pet-happy.png";
}

function updateMood() {
	if (pet.currentAction === "bath") {
  document.getElementById("pet-mood").textContent = "Mood: Bath time!";
  document.getElementById("pet-image").src = "assets/pet-bath.png";
  return;
}
  let moodText = "Happy";
  let imageSrc = "assets/pet-happy.png";
if (pet.isAway) {
  document.getElementById("pet-mood").textContent =
    "I'll wait for you...";

  document.getElementById("pet-image").src = getCurrentMoodImage();
  return;
}
  if (pet.isSleeping) {
  const timeLeft = getSleepTimeLeftText();

  if (pet.sleepType === "Bedtime") {
    document.getElementById("pet-mood").textContent = timeLeft;
  } else {
    document.getElementById("pet-mood").textContent = "Mood: Nap (" + timeLeft + ")";
  }

  document.getElementById("pet-image").src = "assets/pet-sleeping.png";
  return;

    if (timeLeft) {
      moodText = moodText + " (" + timeLeft + ")";
    }

    imageSrc = "assets/pet-sleeping.png";

    document.getElementById("pet-mood").textContent = "Mood: " + moodText;
    document.getElementById("pet-image").src = imageSrc;
    return;
  }

  if (
    pet.hunger < 20 &&
    pet.happiness < 20 &&
    pet.energy < 20 &&
    pet.cleanliness < 20
  ) {
    moodText = "Miserable";
    imageSrc = "assets/pet-miserable.png";
  } else if (pet.hunger < 30) {
    moodText = "Hungry";
    imageSrc = "assets/pet-hungry.png";
  } else if (pet.cleanliness < 30) {
    moodText = "Dirty";
    imageSrc = "assets/pet-dirty.png";
  } else if (pet.energy < 30) {
    moodText = "Sleepy";
    imageSrc = "assets/pet-sleepy.png";
  } else if (pet.happiness < 30) {
    moodText = "Sad";
    imageSrc = "assets/pet-sad.png";
  }

  document.getElementById("pet-mood").textContent = "Mood: " + moodText;
  document.getElementById("pet-image").src = imageSrc;
}

function forceWake() {
  if (!pet.isSleeping) {
    showAction("Already awake");
    return;
  }

  const now = Date.now();

  if (pet.sleepType === "Nap") {
    pet.energy = Math.min(100, pet.energy + 25);
  }

  if (pet.sleepType === "Bedtime") {
    pet.energy = 100;
    pet.happiness = 100;
  }

  pet.isSleeping = false;
  pet.sleepStartTime = null;
  pet.sleepEndTime = null;
  pet.sleepType = null;
  pet.lastUpdated = now;

  savePet();
  updateDisplay();
  showAction("Forced wake!");
}

function checkSleepStatus() {
  if (!pet.isSleeping || !pet.sleepEndTime) {
    return;
  }

  const now = Date.now();

  if (pet.sleepType === "Bedtime") {
    pet.energy = 100;
    pet.happiness = 100;
  }

  if (now >= pet.sleepEndTime) {
    if (pet.sleepType === "Nap") {
      pet.energy = Math.min(100, pet.energy + 25);
    }

    if (pet.sleepType === "Bedtime") {
      pet.energy = 100;
      pet.happiness = 100;
    }

    pet.isSleeping = false;
    pet.sleepStartTime = null;
    pet.sleepEndTime = null;
    pet.sleepType = null;
    pet.lastUpdated = now;

    savePet();
    updateDisplay();
    showAction(getPetName() + " woke up!");
    return;
  }

  savePet();
}

function checkActionState() {
  if (!pet.currentAction || !pet.actionEndTime) {
    return;
  }

  const now = Date.now();

  if (now >= pet.actionEndTime) {
    pet.currentAction = null;
    pet.actionEndTime = null;

    savePet();
    updateDisplay();
  }
}

function checkAwayTime() {
  if (!pet.hasStarted || !pet.lastVisitTime) {
    pet.lastVisitTime = Date.now();
    return;
  }

  const now = Date.now();
  const awayTime = now - pet.lastVisitTime;

  let allowedAwayTime = AWAY_LIMIT;

  if (pet.brbUntil && now <= pet.brbUntil) {
    allowedAwayTime = BRB_LIMIT;
  }

  if (awayTime >= allowedAwayTime && !pet.awayMessageShown) {
    pet.happiness = 0;
    pet.awayMessageShown = true;

    showAction("It's been " + getLargestTimeText(awayTime) + ". I was lonely...");
  }

  pet.lastVisitTime = now;
  savePet();
}

function getPetName() {
  return pet.petName || "Erin";
}

function brbPet() {
  if (pet.isSleeping) {
    showAction(getPetName() + " is sleeping!");
    return;
  }

  const now = Date.now();

  pet.isAway = true;
  pet.awayStartTime = now;
  pet.brbUntil = now + BRB_LIMIT;
  pet.awayMessageShown = false;
  pet.lastVisitTime = now;
  pet.lastUpdated = now;

  savePet();
  updateDisplay();
  showAction("I'll wait for you!");
}

function returnFromAway() {
  if (!pet.isAway) {
    showAction("You're already here");
    return;
  }

  const now = Date.now();
  const awayTime = now - pet.awayStartTime;

  pet.isAway = false;
  pet.awayStartTime = null;
  pet.lastVisitTime = now;
  pet.lastUpdated = now;

  if (awayTime >= 1 * 60 * 60 * 1000 && awayTime <= 6 * 60 * 60 * 1000) {
    pet.happiness = Math.min(100, pet.happiness + 15);

    savePet();
    updateDisplay();
    showAction("Welcome back!");
    return;
  }

  if (awayTime > 6 * 60 * 60 * 1000) {
    savePet();
    updateDisplay();
    showAction("That was a long time!");
    return;
  }

  savePet();
  updateDisplay();
  showAction("Welcome back!");
}

function getAwayTimeText() {
  if (!pet.isAway || !pet.awayStartTime) {
    return "";
  }

  const awayTime = Date.now() - pet.awayStartTime;
  return getLargestTimeText(awayTime);
}

function lowerStats() {
  if (!pet.hasStarted) {
    return;
  }

  if (pet.isSleeping) {
    checkSleepStatus();
    return;
  }

const now = Date.now();
const secondsPassed = (now - pet.lastUpdated) / 1000;

if (secondsPassed < 1) {
  return;
}

const hoursPassed = secondsPassed / 3600;
const decayMultiplier = pet.isAway ? 0.25 : 1;

pet.hunger = Math.max(0, pet.hunger - hoursPassed * 15 * decayMultiplier);
pet.happiness = Math.max(0, pet.happiness - hoursPassed * 25 * decayMultiplier);
pet.energy = Math.max(0, pet.energy - hoursPassed * 10 * decayMultiplier);
pet.cleanliness = Math.max(0, pet.cleanliness - hoursPassed * 10 * decayMultiplier);

  pet.hunger = Math.round(pet.hunger * 100) / 100;
  pet.happiness = Math.round(pet.happiness * 100) / 100;
  pet.energy = Math.round(pet.energy * 100) / 100;
  pet.cleanliness = Math.round(pet.cleanliness * 100) / 100;

  pet.lastUpdated = now;

  savePet();
  updateDisplay();
}

function feedPet() {
  if (pet.isSleeping) {
    showAction(getPetName() + " is sleeping!");
    return;
  }

  if (pet.hunger > 90) {
    showAction("I'm not hungry right now");
    return;
  }

  if (!isCooldownReady("feed")) {
    showAction("I just ate...");
    return;
  }
const beforeStats = getStatSnapshot();

  pet.hunger = Math.min(100, pet.hunger + 30);
  pet.energy = Math.max(0, pet.energy +5);
  pet.happiness = Math.min(100, pet.happiness + 10);
  pet.lastUpdated = Date.now();

  setCooldown("feed", FEED_COOLDOWN);
  

  savePet();
  updateDisplay();
  showStatChangesFromSnapshot(beforeStats);
  showAction("Fed!");
}

function playWithPet() {
  if (pet.isSleeping) {
    showAction(getPetName() + " is sleeping!");
    return;
  }

  if (pet.energy < 5) {
    showAction("I'm too tired");
    return;
  }
const beforeStats = getStatSnapshot();

  pet.happiness = Math.min(100, pet.happiness + 10);
  pet.cleanliness = Math.max(0, pet.cleanliness - 5);
  pet.energy = Math.max(0, pet.energy - 5);
  pet.lastUpdated = Date.now();

  savePet();
  updateDisplay();
  showStatChangesFromSnapshot(beforeStats);
  showAction("Played!");
}

function napPet() {
  if (pet.isSleeping) {
    showAction(getPetName() + " is sleeping!");
    return;
  }

  if (pet.energy > 75) {
    showAction("I'm not sleepy right now");
    return;
  }

  if (!isCooldownReady("nap")) {
    showAction("I'm not sleepy right now");
    return;
  }
const beforeStats = getStatSnapshot();
  const now = Date.now();

  pet.isSleeping = true;
  pet.sleepType = "Nap";
  pet.sleepStartTime = now;
  pet.sleepEndTime = now + NAP_DURATION;

  pet.hunger = Math.max(0, pet.hunger - 10);
  pet.cleanliness = Math.max(0, pet.cleanliness - 10);
  pet.lastUpdated = now;

  setCooldown("nap", NAP_COOLDOWN);

  savePet();
  updateDisplay();
  showStatChangesFromSnapshot(beforeStats);
  showAction("Nap time!");
}

function putPetToBed() {
  if (pet.isSleeping) {
    showAction(getPetName() + " is already sleeping!");
    return;
  }

  const bedtimeText = formatDuration(BEDTIME_DURATION);

  document.getElementById("bedtime-modal-text").textContent =
    "Bedtime will last " + bedtimeText + ". " +
    getPetName() + " cannot do anything else while sleeping.";

  document.getElementById("bedtime-modal").classList.add("active");
}

function confirmBedtime() {
  const now = Date.now();

  pet.isSleeping = true;
  pet.sleepType = "Bedtime";
  pet.sleepStartTime = now;
  pet.sleepEndTime = now + BEDTIME_DURATION;

  pet.energy = 100;
  pet.happiness = 100;
  pet.cleanliness = Math.max(0, pet.cleanliness - 20);

  if (pet.hunger > 50) {
    pet.hunger = 50;
  } else {
    pet.hunger = Math.max(0, pet.hunger - 20);
  }

  pet.lastUpdated = now;

  document.getElementById("bedtime-modal").classList.remove("active");
  
  pet.brbUntil = now + BRB_LIMIT;
  pet.awayMessageShown = false;

  savePet();
  updateDisplay();
  showAction("Good night!");
}

function cancelBedtime() {
  document.getElementById("bedtime-modal").classList.remove("active");
  showAction("Bedtime canceled.");
}

function cleanPet() {
  if (pet.isSleeping) {
    showAction(getPetName() + " is sleeping!");
    return;
  }

  if (pet.cleanliness > 75) {
    showAction("I don't want to take a bath!");
    return;
  }

  if (!isCooldownReady("clean")) {
    showAction("I don't want to take a bath!");
    return;
  }
const beforeStats = getStatSnapshot();

  pet.cleanliness = Math.min(100, pet.cleanliness + 50);
  pet.happiness = Math.min(100, pet.happiness + 20);
  pet.energy = Math.min(100, pet.energy + 5);
  pet.lastUpdated = Date.now();

  setCooldown("clean", CLEAN_COOLDOWN);

  pet.currentAction = "bath";
  pet.actionEndTime = Date.now() + 3000;

  savePet();
  updateDisplay();
  showStatChangesFromSnapshot(beforeStats);
  showAction("Clean!");
}

function updateScreen() {
  const startScreen = document.getElementById("start-screen");
  const petCard = document.getElementById("pet-card");

  if (pet.hasStarted) {
    startScreen.style.display = "none";
    petCard.style.display = "block";
  } else {
    startScreen.style.display = "block";
    petCard.style.display = "none";
  }
}

function wakeUp() {
  pet.hasStarted = true;
  pet.birthTime = Date.now();
  pet.lastUpdated = Date.now();

  savePet();
  updateScreen();
  updateDisplay();

  showAction(getPetName() + " woke up!");
}

function getStatSnapshot() {
  return {
    hunger: pet.hunger,
    happiness: pet.happiness,
    energy: pet.energy,
    cleanliness: pet.cleanliness
  };
}

function showStatChangesFromSnapshot(beforeStats) {
  const changes = [];

  ["hunger", "happiness", "energy", "cleanliness"].forEach(function(stat) {
    const difference = pet[stat] - beforeStats[stat];

    if (difference !== 0) {
      changes.push({
        stat: stat,
        value: difference
      });
    }
  });

  showStatChanges(changes);
}

function showStatChanges(changes) {
  const map = {
    hunger: "hunger-bar",
    happiness: "happiness-bar",
    energy: "energy-bar",
    cleanliness: "cleanliness-bar"
  };

  changes.forEach(function(change) {
    const targetId = map[change.stat];
    const target = document.getElementById(targetId);

    if (!target) return;

    const indicator = document.createElement("span");

    let symbol = "";
    if (change.value > 0) {
      symbol = change.value >= 20 ? "++" : "+";
      indicator.style.color = "#4CAF50";
    } else {
      symbol = change.value <= -20 ? "--" : "-";
      indicator.style.color = "#d9534f";
    }

    indicator.textContent = symbol;
    indicator.className = "stat-indicator";

    target.parentElement.appendChild(indicator);

    setTimeout(function () {
      indicator.remove();
    }, 1000);
  });
}

function showAction(text) {
  const actionBox = document.createElement("div");
  actionBox.textContent = text;

  actionBox.style.position = "absolute";
  actionBox.style.left = "50%";
  actionBox.style.top = "40%";
  actionBox.style.transform = "translate(-50%, -50%)";
  actionBox.style.background = "rgba(0,0,0,0.7)";
  actionBox.style.color = "white";
  actionBox.style.padding = "10px 15px";
  actionBox.style.borderRadius = "10px";
  actionBox.style.fontSize = "14px";

  document.body.appendChild(actionBox);

  setTimeout(function() {
    actionBox.remove();
  }, 1000);
}

function updateDebugUI() {
  const panel = document.getElementById("debug-panel");

  if (!panel) return;

  if (DEBUG) {
    panel.style.display = "block";
  } else {
    panel.style.display = "none";
  }
}

document.getElementById("feed-button").addEventListener("click", feedPet);
document.getElementById("play-button").addEventListener("click", playWithPet);
document.getElementById("nap-button").addEventListener("click", napPet);
document.getElementById("bedtime-button").addEventListener("click", putPetToBed);
document.getElementById("clean-button").addEventListener("click", cleanPet);
document.getElementById("wake-button").addEventListener("click", wakeUp);
document.getElementById("confirm-bedtime-button").addEventListener("click", confirmBedtime);
document.getElementById("cancel-bedtime-button").addEventListener("click", cancelBedtime);
safeAddClick("feed-button", feedPet);
safeAddClick("play-button", playWithPet);
safeAddClick("nap-button", napPet);
safeAddClick("bedtime-button", putPetToBed);
safeAddClick("clean-button", cleanPet);
safeAddClick("wake-button", wakeUp);
safeAddClick("confirm-bedtime-button", confirmBedtime);
safeAddClick("cancel-bedtime-button", cancelBedtime);
safeAddClick("brb-button", brbPet);
safeAddClick("return-button", returnFromAway);

if (DEBUG) {
  safeAddClick("debug-max", function () {
    pet.hunger = 100;
    pet.happiness = 100;
    pet.energy = 100;
    pet.cleanliness = 100;

    savePet();
    updateDisplay();
    showAction("Max stats");
  });

  safeAddClick("debug-min", function () {
    pet.hunger = 0;
    pet.happiness = 0;
    pet.energy = 0;
    pet.cleanliness = 0;

    savePet();
    updateDisplay();
    showAction("Min stats");
  });

  safeAddClick("debug-reset", function () {
    localStorage.removeItem("myPet");
    location.reload();
  });

  safeAddClick("debug-wake", forceWake);
}

loadPet();
updateScreen();
checkAwayTime();

if (pet.hasStarted) {
  checkSleepStatus();
  lowerStats();
  updateDisplay();
}

setInterval(function() {
  if (pet.hasStarted) {
    checkSleepStatus();
    checkActionState();
    lowerStats();
    updateDisplay();
  }
}, 1000);