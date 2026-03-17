**P2R3 Converter Companion — File Injection Extension**

A productivity extension that eliminates workflow interruptions by injecting local files directly into the [p2r3 online converter](https://p2r3.github.io/convert/) without switching tabs or closing your popup.

**What It Actually Does**

Unlike simply visiting the converter website, this extension:
- Reads local files directly through your browser's native file picker (Offscreen API on Chrome 109+/Firefox 128+, with drag-and-drop fallback)
- Serializes file data and injects it programmatically into the p2r3 converter's input field
- Maintains your current browser context—no tab switching, no popup closing, no workflow disruption
- Works entirely client-side; files never leave your machine

**Technical Implementation**

The extension uses Manifest V3 service workers with cross-browser compatibility (Chrome, Firefox, Edge). File handling occurs through:
1. Offscreen API document (Chrome/Firefox modern) OR drag-and-drop interface (universal fallback)
2. Structured-clone serialization for binary data transfer
3. Programmatic DataTransfer injection into the target site's file input
4. CSP-compliant execution with no remote code execution

**Permissions Required**
- `scripting`: To inject the content script that performs file input manipulation
- `clipboardRead`: For potential clipboard-based file operations
- `declarativeNetRequest`: To manage iframe communication rules
- Host permission for `p2r3.github.io/convert/*`: Required for content script injection and cross-origin messaging

**Privacy**
No data collection. No external servers. Files are processed entirely within your browser and injected directly into the target converter page.

**Open Source**
Community-developed project: https://github.com/lebgdu543/addons
Not affiliated with p2r3; created to solve a specific workflow friction.

**Made with ❤️ at home**
