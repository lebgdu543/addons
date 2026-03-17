# P2R3 Converter Companion — Browser Extension

A cross-browser (Chrome + Firefox) Manifest V3 extension that injects local files
into the [p2r3 online converter](https://p2r3.github.io/convert/) without ever
switching tabs or closing the popup.

---

## Installation (Developer Mode)

### Brave > Chromium > Opera > Vivaldi > Ungoogled Chromium > Chrome > Edge 
1. Navigate to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** → select the `p2r3-converter-companion-extension` folder

### Zen Browser > Firefox > Basilisk > Floorp > GNU IceCat > Librewolf > Pale Moon > Waterfox
1. Navigate to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on** → select `manifest.json` from the folder
   *(Note: temporary add-ons are removed on browser restart; permanent install
   requires signing via AMO or an enterprise policy)*

---

## How It Works

```
User action
    │
    ▼
popup.html / popup.js          ← Visible extension popup
    │ chrome.runtime.sendMessage
    ▼
background.js (service worker) ← Message broker; owns offscreen lifecycle
    │  ┌──────────────────────────────────────────┐
    │  │ Offscreen path (Chrome 109+)             │
    │  │ background → offscreen.html/offscreen.js │
    │  │ offscreen reads File → ArrayBuffer       │
    │  │ offscreen → background (FILE_SELECTED)   │
    │  └──────────────────────────────────────────┘
    │
    │ chrome.scripting.executeScript (on-demand)
    ▼
content_script.js              ← Injected into p2r3.github.io/convert/
    │ Uint8Array → File → DataTransfer → input.files
    │ dispatchEvent("change", { bubbles: true })
    ▼
p2r3 converter site            ← Conversion get our file automatically
```

---

## File Selection Methods (Priority Order)

| Method | Popup stays open? | Availability |
|---|---|---|
| **Offscreen API** (`chrome.offscreen`) | ✅ Always | Chrome 109+, Firefox 128+ |
| **Drag & Drop** onto popup drop zone | ✅ Always | All browsers |
| Hidden `<input>` click via DnD label | ⚠️ May close on some browsers | All browsers |

---

## Firefox Compatibility Notes

### 1. Offscreen API
- Firefox added `chrome.offscreen` support in **Firefox 128** (July 2024).
- The extension uses `chrome.offscreen !== undefined` to detect support.
- Older Firefox versions fall back to Drag & Drop automatically.
- Firefox does **not** require an `offscreen` entry in `manifest.json` permissions —
  the permission is silently ignored on Firefox, which is safe.

### 2. Service Worker vs. Background Page
- MV3 service workers are supported in Firefox 121+.
- For Firefox < 121, you can add a `"scripts"` array under `"background"` in
  addition to `"service_worker"` — Firefox ignores `service_worker` and uses
  `scripts` instead:
  ```json
  "background": {
    "service_worker": "background.js",
    "scripts": ["background.js"]
  }
  ```

### 3. `chrome.*` vs `browser.*` namespace
- All modern versions of Firefox support the `chrome.*` alias for
  `browser.*` in MV3 extensions (the WebExtensions Polyfill is not required).
- If you need to support very old Firefox builds, install
  [webextension-polyfill](https://github.com/mozilla/webextension-polyfill).

### 4. `chrome.scripting.executeScript`
- Fully supported in Firefox 101+ with MV3.
- Requires `"scripting"` in permissions and the host in `host_permissions`.

### 5. DataTransfer file injection
- The `DataTransfer` + `input.files` assignment technique works in both
  Chrome and Firefox. Both browsers respect the programmatic assignment
  when the `File` is added via `DataTransfer.items.add()`.

---

## Permissions Rationale

| Permission | Why |
|---|---|
| `activeTab` | Allows sending messages to the currently active tab once the user clicks the extension icon |
| `scripting` | Required to call `chrome.scripting.executeScript` to inject `content_script.js` on demand |
| `offscreen` | Required in Chrome to create the off-screen document that hosts the file picker |
| `host_permissions: https://p2r3.github.io/convert/*` | Allows `executeScript` and `tabs.sendMessage` to operate on the converter page |

---

## Development Notes

### Re-injection guard
`content_script.js` sets `window.__p2r3ExtInjected = true` to prevent
duplicate execution if `executeScript` is called multiple times.

### Large file handling
Files are serialised as `Array<number>` (plain JSON-serialisable array) for
`chrome.runtime.sendMessage`. Chrome's structured-clone limit is 64 MB per
message. For larger files, consider chunking or switching to `IndexedDB` as
a shared data store between the service worker and content script.

### CSP compliance
All scripts are loaded from external `.js` files; no `eval` or inline
`<script>` blocks are used, satisfying MV3's strict CSP.

> Tested on brave, edge, zen browser and opera air.
