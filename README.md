# P2R3 Converter Opener Extension

To install this extension locally:

1.  **Prepare the Files**: Save the three files provided below into a single folder on your computer.
    
2.  **Chrome Installation**:
    
    -   Go to `chrome://extensions/`.
        
    -   Enable **Developer mode** (top right).
        
    -   Click **Load unpacked** and select your folder.
        
3.  **Firefox Installation**:
    
    -   Go to `about:debugging#/runtime/this-firefox`.
        
    -   Click **Load Temporary Add-on...** and select the `manifest.json` file in your folder.
        

### Project Structure

-   `manifest.json`: Configuration for both browsers.
    
-   `background.js`: Required to keep the extension active/valid across platforms.
