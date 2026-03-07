/**
 * P2R3 Extension Background Script
 * Handles icon clicks to open or focus the converter tool.
 */

const TARGET_URL = "https://p2r3.github.io/convert/";

// Listen for the extension icon click (Toolbar on PC, Menu on Android)
chrome.action.onClicked.addListener((tab) => {
  // We check if the tab is already open to avoid cluttering the user's browser
  chrome.tabs.query({}, (tabs) => {
    const existingTab = tabs.find(t => t.url && t.url.includes("p2r3.github.io/convert"));
    
    if (existingTab) {
      // If found, just switch to that tab
      chrome.tabs.update(existingTab.id, { active: true });
      
      // If it's a different window, focus that window too
      if (existingTab.windowId) {
        chrome.windows.update(existingTab.windowId, { focused: true });
      }
    } else {
      // If not found, open a new one
      chrome.tabs.create({ url: TARGET_URL });
    }
  });
});
