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

// XP needed for each level increases as level * 60 seconds * XP per second (dynamic per upgrades)
function xpNeededForLevel(lv) {
  // Time to next level doubles per level (starting from 60 seconds)
  // XP per second depends on upgrades (2^upgrades)
  const baseTimeSeconds = 60 * (2 ** (lv - 1));
  const xpPerSec = 2 ** upgrades;
  return baseTimeSeconds * xpPerSec;
}

// Start or update background music according to current level
function playBackgroundMusic(level) {
  if (bgAudio) {
    bgAudio.pause();
    bgAudio = null;
  }
  const idx = Math.min(level - 1, bgMusicFiles.length - 1);
  bgAudio = new Audio(bgMusicFiles[idx]);
  bgAudio.loop = true;
  bgAudio.volume = 0.3;
  bgAudio.play().catch(() => {
    // Ignore autoplay errors if any
  });
}

// Play level up sound once
function playLevelUpSound() {
  if (levelUpAudio) {
    levelUpAudio.pause();
    levelUpAudio = null;
  }
  levelUpAudio = new Audio(levelUpSoundFile);
  levelUpAudio.volume = 0.7;
  levelUpAudio.play().catch(() => {});
}

// Update popup UI elements with current data
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

  // Enable mood select only if level >=1 (and up to MAX_LEVEL)
  moodSelect.disabled = level < 1;

  // Update mood suggestions based on unlocked links
  updateMoodSuggestions();

  // Update popup background and text colors based on selected mood
  updateMoodColors();
}

// Update suggestions for currently selected mood based on level unlock
function updateMoodSuggestions() {
  const mood = moodSelect.value;
  if (!moodConfig[mood]) {
    suggestionsDiv.style.display = "none";
    suggestionList.innerHTML = "";
    return;
  }

  // Number of unlocked links = min(level, 4)
  const unlockedCount = Math.min(level, 4);
  const suggestions = moodConfig[mood].suggestions.slice(0, unlockedCount);

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

// Update popup background and text colors based on moodConfig for selected mood
function updateMoodColors() {
  const mood = moodSelect.value;
  if (moodConfig[mood]) {
    document.body.style.backgroundColor = moodConfig[mood].bg;
    document.body.style.color = moodConfig[mood].text;
  } else {
    // Default colors if none selected
    document.body.style.backgroundColor = "linear-gradient(135deg, #e0f7fa, #80deea)";
    document.body.style.color = "#023047";
  }
}

// Load state from storage
function loadState() {
  chrome.storage.local.get(["totalXp", "level", "upgrades", "selectedMood"], (data) => {
    totalXp = data.totalXp ?? 0;
    level = data.level ?? 1;
    upgrades = data.upgrades ?? 0;

    if (data.selectedMood) {
      moodSelect.value = data.selectedMood;
    }

    playBackgroundMusic(level);
    updateUI();
  });
}

// Save selected mood to storage
function saveSelectedMood(mood) {
  chrome.storage.local.set({ selectedMood: mood });
}

// XP increment interval variables
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

    // Save state to storage and update UI
    chrome.storage.local.set({ totalXp, level });
    updateUI();
  }, 1000);
}

// Buy upgrade button click handler
buyUpgradeBtn.addEventListener("click", () => {
  const upgradeCost = 200 * (upgrades + 1);
  if (totalXp >= upgradeCost && upgrades < MAX_UPGRADE) {
    totalXp -= upgradeCost;
    upgrades++;
    chrome.storage.local.set({ totalXp, upgrades });
    updateUI();
  }
});

// Mood select change handler
moodSelect.addEventListener("change", () => {
  saveSelectedMood(moodSelect.value);
  updateMoodSuggestions();
  updateMoodColors();
});

// Initialize
loadState();
startXpInterval();
