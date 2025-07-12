function applyMood(mood) {
  const colors = {
    happy: "#fff8dc",
    sad: "#d0e0f0",
    focused: "#f5f5f5",
    calm: "#e6ffe6"
  };

  const color = colors[mood] || "transparent";

  // Full screen background color on html and body
  document.documentElement.style.transition = "background 0.8s ease";
  document.documentElement.style.backgroundColor = color;
  document.body.style.backgroundColor = color;
}

function showXPPopup(xp) {
  const xpPopup = document.createElement("div");
  xpPopup.textContent = `XP: ${xp || 0}`;
  xpPopup.style.cssText = `
    position: fixed;
    top: 20px; right: 20px;
    background: #3498db;
    color: white;
    font-size: 18px;
    padding: 10px 15px;
    border-radius: 8px;
    box-shadow: 0 0 10px rgba(0,0,0,0.3);
    z-index: 9999;
    font-family: Arial, sans-serif;
    animation: fadeOut 3s forwards;
  `;

  const style = document.createElement("style");
  style.textContent = `
    @keyframes fadeOut {
      0% { opacity: 1; }
      80% { opacity: 1; }
      100% { opacity: 0; transform: translateY(-20px); }
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(xpPopup);

  setTimeout(() => {
    xpPopup.remove();
    style.remove();
  }, 3000);
}

// On page load, get mood and xp, apply mood and show XP popup
chrome.storage.local.get(["mood", "xp"], ({ mood, xp }) => {
  applyMood(mood);
  showXPPopup(xp);
});

// Listen for mood changes and update background live
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local") {
    if (changes.mood) {
      applyMood(changes.mood.newValue);
    }
    if (changes.xp) {
      showXPPopup(changes.xp.newValue);
    }
  }
});