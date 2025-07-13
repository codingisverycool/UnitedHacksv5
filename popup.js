// popup.js

const levelSpan = document.getElementById("level");
const xpSpan = document.getElementById("xp");
const xpFillDiv = document.querySelector("#xpFill > div");
const buyUpgradeBtn = document.getElementById("buyUpgrade");
const upgradeStatusP = document.getElementById("upgradeStatus");
const moodSelect = document.getElementById("moodSelect");
const suggestionList = document.getElementById("suggestionList");
const suggestionsDiv = document.getElementById("suggestions");

let totalXp = 0;
let level = 1;
let upgrades = 0;
const MAX_LEVEL = 6;
const MAX_UPGRADE = 4;

const bgMusicFiles = [
  "sounds/Bg1.mp3",
  "sounds/Bg2.mp3",
  "sounds/Bg3.mp3",
  "sounds/Bg4.mp3",
  "sounds/Bg5.mp3",
  "sounds/Bg6.mp3",
];
const levelUpSoundFile = "sounds/levelup.mp3";

let bgAudio = null;
let levelUpAudio = null;

// XP required for each level
function xpNeededForLevel(lv) {
  const baseTimeSeconds = 60 * (2 ** (lv - 1));
  const xpPerSec = 2 ** upgrades;
  return baseTimeSeconds * xpPerSec;
}

// Play background music based on level
function playBackgroundMusic(level) {
  if (bgAudio) {
    bgAudio.pause();
    bgAudio = null;
  }
  const idx = Math.min(level - 1, bgMusicFiles.length - 1);
  bgAudio = new Audio(bgMusicFiles[idx]);
  bgAudio.loop = true;
  bgAudio.volume = 0.3;
  bgAudio.play().catch(() => {});
}

// Play level-up sound
function playLevelUpSound() {
  if (levelUpAudio) {
    levelUpAudio.pause();
    levelUpAudio = null;
  }
  levelUpAudio = new Audio(levelUpSoundFile);
  levelUpAudio.volume = 0.7;
  levelUpAudio.play().catch(() => {});
}

// UI update logic
function updateUI() {
  levelSpan.textContent = level;
  xpSpan.textContent = totalXp.toFixed(0);

  const xpNeeded = xpNeededForLevel(level);
  const fillPercent = Math.min((totalXp / xpNeeded) * 100, 100);
  xpFillDiv.style.width = `${fillPercent}%`;

  const upgradeCost = 200 * (upgrades + 1);
  buyUpgradeBtn.disabled = totalXp < upgradeCost || upgrades >= MAX_UPGRADE;
  upgradeStatusP.textContent = upgrades >= MAX_UPGRADE
    ? "Max upgrades reached"
    : `Upgrade cost: ${upgradeCost} XP`;

  moodSelect.disabled = level < 1;

  updateMoodSuggestions();
  updateMoodColors();
}

// Render suggestions based on level
function updateMoodSuggestions() {
  const mood = moodSelect.value;
  const config = moodConfig[mood];

  if (!config) {
    suggestionsDiv.style.display = "none";
    suggestionList.innerHTML = "";
    return;
  }

  const unlockedCount = Math.min(level, 4);
  const suggestions = config.suggestions.slice(0, unlockedCount);

  suggestionList.innerHTML = "";
  suggestions.forEach(({ label, link }) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = link;
    a.target = "_blank";
    a.textContent = label;
    li.appendChild(a);
    suggestionList.appendChild(li);
  });

  suggestionsDiv.style.display = suggestions.length > 0 ? "block" : "none";
}

// Change popup background & text color based on mood
function updateMoodColors() {
  const mood = moodSelect.value;
  const config = moodConfig[mood];

  if (config && config.bg && config.text) {
    document.body.style.background = config.bg;  // <-- changed here
    document.body.style.color = config.text;
  } else {
    document.body.style.background = "linear-gradient(135deg, #e0f7fa, #80deea)";
    document.body.style.color = "#023047";
  }
}

// Load all saved state
function loadState() {
  chrome.storage.local.get(["totalXp", "level", "upgrades", "selectedMood"], (data) => {
    totalXp = data.totalXp ?? 0;
    level = data.level ?? 1;
    upgrades = data.upgrades ?? 0;

    if (data.selectedMood && moodConfig[data.selectedMood]) {
      moodSelect.value = data.selectedMood;
    }

    playBackgroundMusic(level);
    updateUI();
  });
}

// Save mood selection to storage
function saveSelectedMood(mood) {
  chrome.storage.local.set({ selectedMood: mood });
}

// Increment XP every second
let xpIntervalId = null;
function startXpInterval() {
  if (xpIntervalId) return;

  xpIntervalId = setInterval(() => {
    const xpPerSec = 2 ** upgrades;
    totalXp += xpPerSec;

    const xpNeeded = xpNeededForLevel(level);
    if (totalXp >= xpNeeded && level < MAX_LEVEL) {
      totalXp -= xpNeeded;
      level++;
      playLevelUpSound();
      playBackgroundMusic(level);
    }

    chrome.storage.local.set({ totalXp, level });
    updateUI();
  }, 1000);
}

// Upgrade button logic
buyUpgradeBtn.addEventListener("click", () => {
  const upgradeCost = 200 * (upgrades + 1);
  if (totalXp >= upgradeCost && upgrades < MAX_UPGRADE) {
    totalXp -= upgradeCost;
    upgrades++;
    chrome.storage.local.set({ totalXp, upgrades });
    updateUI();
  }
});

// Mood selection change handler
moodSelect.addEventListener("change", () => {
  saveSelectedMood(moodSelect.value);
  updateMoodSuggestions();
  updateMoodColors();
});

// Init
loadState();
startXpInterval();
