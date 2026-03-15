"use strict";
(function () {
  if (window.__p2r3V4) return;
  window.__p2r3V4 = true;

  function blockNativeClick() {
    const inp = document.getElementById("file-input") || document.querySelector("input[type='file']");
    if (!inp) return;
    inp.addEventListener("click", (e) => {
      if (window !== window.top) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    }, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", blockNativeClick);
  } else {
    blockNativeClick();
  }

  window.addEventListener("message", (e) => {
    if (!e.data || e.data.type !== "P2R3_INJECT_FILE") return;
    const { fileData, fileName, fileType } = e.data;
    try {
      const bytes = new Uint8Array(fileData);
      const blob  = new Blob([bytes], { type: fileType });
      const file  = new File([blob], fileName, { type: fileType, lastModified: Date.now() });
      const inp = document.getElementById("file-input") || document.querySelector("input[type='file']");
      if (!inp) {
        window.parent.postMessage({ type: "P2R3_RESULT", ok: false, error: "#file-input not found" }, "*");
        return;
      }
      const dt = new DataTransfer();
      dt.items.add(file);
      inp.files = dt.files;
      inp.dispatchEvent(new Event("change", { bubbles: true }));
      inp.dispatchEvent(new Event("input",  { bubbles: true }));
      window.parent.postMessage({ type: "P2R3_RESULT", ok: true, fileName }, "*");
    } catch (err) {
      window.parent.postMessage({ type: "P2R3_RESULT", ok: false, error: err.message }, "*");
    }
  });

  window.parent.postMessage({ type: "P2R3_READY" }, "*");
})();
