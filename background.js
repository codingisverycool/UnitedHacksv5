let totalXp = 0;
let level = 1;
let upgrades = 0;
let trackingInterval = null;

const MAX_LEVEL = 6;
const BASE_INTERVAL = 5000;
const MIN_INTERVAL = 1000;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ totalXp: 0, level: 1, upgrades: 0, mood: 'chill' });
});

function startTracking() {
  if (trackingInterval) return;

  chrome.storage.local.get(["totalXp", "level", "upgrades"], (data) => {
    totalXp = data.totalXp || 0;
    level = data.level || 1;
    upgrades = data.upgrades || 0;

    const interval = Math.max(BASE_INTERVAL - upgrades * 1000, MIN_INTERVAL);
    trackingInterval = setInterval(() => {
      totalXp += 1;

      if (totalXp >= level * 100 && level < MAX_LEVEL) {
        totalXp -= level * 100;
        level++;
        playLevelUpSound(level);

        // Send message to update popup about level up & mood unlock
        chrome.runtime.sendMessage({ type: "LEVEL_UP", level });
      }

      chrome.storage.local.set({ totalXp, level, upgrades });
      chrome.runtime.sendMessage({ type: "XP_UPDATED", totalXp, level, upgrades });
    }, interval);
  });
}

function playLevelUpSound(level) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: "PLAY_SOUND",
        level: Math.min(level, MAX_LEVEL)
      });
    }
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "START_TRACKING") {
    startTracking();
    sendResponse({ started: true });
  } else if (message.type === "BUY_UPGRADE") {
    chrome.storage.local.get(["totalXp", "upgrades"], (data) => {
      const xp = data.totalXp || 0;
      const ups = data.upgrades || 0;
      const upgradeCost = 200 + ups * 100; // Increasing cost

      if (xp >= upgradeCost && ups < 4) {
        const newXp = xp - upgradeCost;
        const newUps = ups + 1;
        chrome.storage.local.set({ totalXp: newXp, upgrades: newUps }, () => {
          clearInterval(trackingInterval);
          trackingInterval = null;
          startTracking();
          chrome.runtime.sendMessage({ type: "XP_UPDATED", totalXp: newXp, level, upgrades: newUps });
        });
      }
    });
  } else if (message.type === "SET_MOOD") {
    chrome.storage.local.set({ mood: message.mood }, () => {
      chrome.runtime.sendMessage({ type: "MOOD_UPDATED", mood: message.mood });
    });
  }
});
