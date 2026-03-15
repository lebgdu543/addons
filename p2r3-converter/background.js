// background.js — service worker v6
//
// CHROME  → uses default_popup from manifest.json (normal popup behaviour,
//           fixed 450×520, stays open during file dialogs natively).
//
// FIREFOX → Firefox destroys extension popups the moment any native OS
//           dialog or the file manager steals focus.  The only reliable
//           workaround is opening popup.html as a real detached OS window
//           (browser.windows.create type:"popup") which survives focus loss.
//
//           The window opens at a comfortable default size; popup.html fills
//           it fully via responsive CSS (100% width/height applied by popup.js
//           on Firefox).  The user can resize freely.
//
//           Deduplication: a second toolbar click focuses the open window
//           instead of spawning a new one.

"use strict";

(async () => {
  // Firefox detection — getBrowserInfo is not available in Chrome/Edge.
  const isFirefox =
    typeof browser !== "undefined" &&
    typeof browser.runtime?.getBrowserInfo === "function";

  if (!isFirefox) return; // Chrome: default_popup in manifest handles everything.

  // Override default_popup so the onClicked handler fires instead.
  await browser.action.setPopup({ popup: "" });

  let openWindowId = null;

  browser.action.onClicked.addListener(async () => {
    // Bring existing window to front if still open.
    if (openWindowId !== null) {
      try {
        await browser.windows.update(openWindowId, { focused: true });
        return;
      } catch (_) {
        openWindowId = null; // was closed externally
      }
    }

    const win = await browser.windows.create({
      url: browser.runtime.getURL("popup.html"),
      type: "popup",  // real OS window — survives focus changes
      width: 520,     // comfortable default; user can resize freely
      height: 620,    // includes Firefox title bar (~30px) + content
    });
    openWindowId = win.id;
  });

  // Clean up reference when the user closes the window.
  browser.windows.onRemoved.addListener((id) => {
    if (id === openWindowId) openWindowId = null;
  });
})();
