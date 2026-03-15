"use strict";

// --- Responsive layout for Firefox ---
// Chrome popup: body dimensions drive the popup window size → keep px values in CSS.
// Firefox real window (opened via background.js windows.create): the OS window
// drives dimensions, so body must fill 100% to use all available space.
// Detection: browser.runtime.getBrowserInfo is Firefox-exclusive.
(function(){
  const isFirefox=typeof browser!=="undefined"&&typeof browser.runtime?.getBrowserInfo==="function";
  if(!isFirefox)return;
  document.documentElement.style.cssText="width:100%;height:100%;min-width:400px;background:var(--bg)";
  document.body.style.width="100%";
  document.body.style.height="100%";
})();

const dropZone=document.getElementById("drop-zone"),fileNameEl=document.getElementById("file-name"),btnPick=document.getElementById("btn-pick"),btnInject=document.getElementById("btn-inject"),frame=document.getElementById("p2r3-frame"),overlay=document.getElementById("overlay"),overlayMsg=document.getElementById("overlay-msg"),frameErr=document.getElementById("frame-err"),errDetail=document.getElementById("err-detail"),btnRetry=document.getElementById("btn-retry"),sDot=document.getElementById("s-dot"),sMsg=document.getElementById("s-msg");
let stagedFile=null,contentReady=false;
function setStatus(s,t){sDot.className=s;sMsg.className=s;sMsg.textContent=t}
function inferMime(n){const e=n.split(".").pop().toLowerCase();return({pdf:"application/pdf",epub:"application/epub+zip",mobi:"application/x-mobipocket-ebook",azw:"application/vnd.amazon.ebook",azw3:"application/vnd.amazon.ebook",txt:"text/plain",html:"text/html",htm:"text/html",doc:"application/msword",docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",rtf:"application/rtf",odt:"application/vnd.oasis.opendocument.text",cbz:"application/vnd.comicbook+zip",cbr:"application/vnd.comicbook-rar",fb2:"application/x-fictionbook+xml",djvu:"image/vnd.djvu"})[e]??"application/octet-stream"}
function stageFile(d,n,t){stagedFile={fileData:d,fileName:n,fileType:t};fileNameEl.textContent="✔ "+n;fileNameEl.classList.add("on");dropZone.classList.add("has-file");btnInject.disabled=false;setStatus("ok","Ready: "+n+" — click ✨ Inject")}

// --- File picker ---
// Chrome 86+  → showOpenFilePicker() (File System Access API)
// Firefox     → hidden <input type=file> click; runs inside a real windows.create
//               popup (set up by background.js) so focus-loss never kills the window.
async function pickWithFSA(){try{const[h]=await window.showOpenFilePicker({multiple:false});const f=await h.getFile();const b=await f.arrayBuffer();stageFile(new Uint8Array(b),f.name,f.type||inferMime(f.name));return true}catch(e){if(e.name==="AbortError")return false;throw e}}
function pickWithInput(){return new Promise(res=>{const inp=document.createElement("input");inp.type="file";inp.style.display="none";document.body.appendChild(inp);inp.addEventListener("change",async()=>{const f=inp.files[0];if(f){const b=await f.arrayBuffer();stageFile(new Uint8Array(b),f.name,f.type||inferMime(f.name))}document.body.removeChild(inp);res(!!f)});inp.addEventListener("cancel",()=>{document.body.removeChild(inp);res(false)});inp.click()})}
btnPick.addEventListener("click",async()=>{try{if(typeof window.showOpenFilePicker==="function"){await pickWithFSA()}else{await pickWithInput()}}catch(e){setStatus("error","Picker error: "+e.message)}});

// --- Drop zone interaction ---
dropZone.addEventListener("click",()=>btnPick.click());
dropZone.addEventListener("keydown",(e)=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();btnPick.click()}});
dropZone.addEventListener("dragenter",(e)=>{e.preventDefault();dropZone.classList.add("drag-over")});
dropZone.addEventListener("dragover",(e)=>{e.preventDefault();e.dataTransfer.dropEffect="copy";dropZone.classList.add("drag-over")});
dropZone.addEventListener("dragleave",()=>dropZone.classList.remove("drag-over"));

// --- Drag-and-drop file reading ---
// Prefer DataTransferItem.getAsFileSystemHandle() — part of the File System API,
// supported in Firefox 111+ and Chrome 86+.  Returns a FileSystemFileHandle
// giving us the real filename and mime type even for files without extensions.
// Falls back to DataTransfer.files[] for older browsers.
dropZone.addEventListener("drop",async(e)=>{
  e.preventDefault();
  dropZone.classList.remove("drag-over");
  // FSA path: getAsFileSystemHandle() — Firefox 111+ / Chrome 86+
  const item=e.dataTransfer.items?.[0];
  if(item&&typeof item.getAsFileSystemHandle==="function"){
    try{
      const handle=await item.getAsFileSystemHandle();
      if(handle.kind==="file"){
        const f=await handle.getFile();
        const b=await f.arrayBuffer();
        stageFile(new Uint8Array(b),f.name,f.type||inferMime(f.name));
        return;
      }
    }catch(_){/* fall through to legacy path */}
  }
  // Legacy fallback: DataTransfer.files[]
  const f=e.dataTransfer.files[0];
  if(!f)return;
  const b=await f.arrayBuffer();
  stageFile(new Uint8Array(b),f.name,f.type||inferMime(f.name));
});

// --- Paste support (Ctrl+V) ---
// 1. Files copied from the OS file manager  → clipboardData.files[0]
// 2. Images copied from a browser/app       → clipboardData.items kind==="file"
// Plain text is ignored; only binary payloads are staged.
document.addEventListener("paste",async(e)=>{
  let file=null;
  if(e.clipboardData.files&&e.clipboardData.files.length>0){
    file=e.clipboardData.files[0];
  }else{
    const items=Array.from(e.clipboardData.items||[]);
    const fileItem=items.find(i=>i.kind==="file");
    if(fileItem)file=fileItem.getAsFile();
  }
  if(!file)return;
  e.preventDefault();
  dropZone.classList.add("paste-flash");
  setTimeout(()=>dropZone.classList.remove("paste-flash"),300);
  let name=file.name;
  if(!name||name==="image.png"||name==="blob"){
    const ext=file.type.split("/")[1]||"bin";
    name="pasted-"+(Date.now())+"."+ext;
  }
  const mime=file.type||inferMime(name);
  const buf=await file.arrayBuffer();
  stageFile(new Uint8Array(buf),name,mime);
});

frame.addEventListener("load",()=>{if(!frame.src||frame.src==="about:blank")return;overlayMsg.textContent="Initializing…";setTimeout(()=>{if(!contentReady)showConverter("Converter loaded (try injecting your file)")},5000)});
frame.addEventListener("error",()=>{overlay.classList.add("gone");frameErr.classList.add("on");setStatus("error","Failed to load converter")});
btnRetry.addEventListener("click",()=>{frameErr.classList.remove("on");overlay.classList.remove("gone");contentReady=false;setStatus("loading","Loading p2r3 converter…");frame.src="https://p2r3.github.io/convert/"});
function showConverter(m){overlay.classList.add("gone");frame.classList.add("ready");setStatus("ok",m||"Converter ready — pick a file and click ✨ Inject")}
window.addEventListener("message",(e)=>{if(!e.data)return;if(e.data.type==="P2R3_READY"){contentReady=true;showConverter()}else if(e.data.type==="P2R3_RESULT"){if(e.data.ok){setStatus("injected","✔ \""+e.data.fileName+"\" injected — select formats & convert!")}else{setStatus("error","Injection failed: "+(e.data.error??"unknown"))}btnInject.disabled=false}});
btnInject.addEventListener("click",()=>{if(!stagedFile){setStatus("error","No file selected.");return}btnInject.disabled=true;setStatus("loading","Injecting file…");frame.contentWindow.postMessage({type:"P2R3_INJECT_FILE",fileData:Array.from(stagedFile.fileData),fileName:stagedFile.fileName,fileType:stagedFile.fileType},"https://p2r3.github.io")});

