// This script is required for Manifest V3 lifecycle management.
console.log("P2R3 Extension Background Context Initialized.");

const TARGET_URL = "https://p2r3.github.io/convert/";

// Listen for the extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Option 1: Always open a new tab
  chrome.tabs.create({ url: TARGET_URL });

  /* // Option 2 (Advanced): Check if the tab is already open and focus it instead
  chrome.tabs.query({}, (tabs) => {
    const existingTab = tabs.find(t => t.url && t.url.includes("p2r3.github.io/convert"));
    if (existingTab) {
      chrome.tabs.update(existingTab.id, { active: true });
    } else {
      chrome.tabs.create({ url: TARGET_URL });
    }
  });
  */
});
