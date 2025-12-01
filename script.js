/* script.js - 纯前端 Canvas 实现基本功能（示例版） */
const year = document.getElementById('year'); year.textContent = new Date().getFullYear();
const tabs = document.querySelectorAll('.tab-btn');
const tabSections = document.querySelectorAll('.tab');
tabs.forEach(btn=>btn.addEventListener('click',()=>{
  tabs.forEach(b=>b.classList.remove('active'));
  tabSections.forEach(s=>s.classList.add('hide'));
  btn.classList.add('active'); document.getElementById(btn.dataset.tab).classList.remove('hide');
}));

// i18n init
const langSelect = document.getElementById('langSelect');
Object.keys(LANGS).forEach(k=>{ const o=document.createElement('option'); o.value=k; o.textContent=LANGS[k].name; langSelect.appendChild(o); });
langSelect.value='en';
langSelect.addEventListener('change', applyLang);
function applyLang(){ const pack = LANGS[langSelect.value]; document.querySelectorAll('.tab-btn').forEach((b,i)=>b.textContent=pack.ui.tabs[i]||b.textContent); document.getElementById('disclaimer').textContent=pack.ui.disclaimer; }
applyLang();

// util: load image to canvas
function loadImageToCanvas(file, canvas, fit=true){
  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.onload = ()=>{
    const w = img.width, h = img.height;
    const maxW = 1200;
    let scale = Math.min(1, maxW / Math.max(w,h));
    canvas.width = Math.round(w*scale); canvas.height = Math.round(h*scale);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(img,0,0,canvas.width,canvas.height);
  };
  img.src = URL.createObjectURL(file);
}

// --- Background Remove (simple color-based)
const bgFile = document.getElementById('bg-file'), bgCanvas=document.getElementById('bg-canvas'), bgMask=document.getElementById('bg-mask');
bgFile.addEventListener('change', e=>{ if(e.target.files[0]) loadImageToCanvas(e.target.files[0], bgCanvas); });
document.getElementById('bg-remove').addEventListener('click', ()=>{
  const t = parseInt(document.getElementById('bg-threshold').value);
  const ctx = bgCanvas.getContext('2d');
  const w=bgCanvas.width,h=bgCanvas.height;
  const img = ctx.getImageData(0,0,w,h);
  // sample corner color
  const offset = 4*(0+0*w);
  const r0=img.data[offset], g0=img.data[offset+1], b0=img.data[offset+2];
  for(let i=0;i<img.data.length;i+=4){
    const dr = Math.abs(img.data[i]-r0), dg=Math.abs(img.data[i+1]-g0), db=Math.abs(img.data[i+2]-b0);
    if((dr+dg+db)/3 < t){
      img.data[i+3]=0;
    }
  }
  bgMask.width=w; bgMask.height=h; bgMask.getContext('2d').putImageData(img,0,0);
  // show result: draw mask to main canvas
  ctx.clearRect(0,0,w,h); ctx.putImageData(img,0,0);
});
document.getElementById('bg-download').addEventListener('click', ()=>{
  bgCanvas.toBlob(b=>{ const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download='transparent.png'; a.click(); }, 'image/png');
});

// --- ID Photo
const idFile=document.getElementById('id-file'), idCanvas=document.getElementById('id-canvas');
idFile.addEventListener('change', e=>{ if(e.target.files[0]) loadImageToCanvas(e.target.files[0], idCanvas); });
document.getElementById('id-generate').addEventListener('click', ()=>{
  const size = document.getElementById('id-size').value;
  const bg = document.getElementById('id-bgcolor').value;
  const map = {passport:[600,600], '1in':[295,413], '2in':[600,800]};
  const [w,h] = map[size];
  // draw existing canvas into new sized with bg
  const tmp = document.createElement('canvas'); tmp.width=w; tmp.height=h;
  const tctx = tmp.getContext('2d'); tctx.fillStyle=bg; tctx.fillRect(0,0,w,h);
  // center face from idCanvas
  const sctx = idCanvas.getContext('2d');
  const sw = idCanvas.width, sh=idCanvas.height;
  // draw scaled center-fit
  const scale = Math.min(w/sw, h/sh);
  const dw = sw*scale, dh = sh*scale;
  tctx.drawImage(idCanvas, (w-dw)/2, (h-dh)/2, dw, dh);
  idCanvas.width=w; idCanvas.height=h; idCanvas.getContext('2d').drawImage(tmp,0,0);
});
document.getElementById('id-download').addEventListener('click', ()=> {
  idCanvas.toBlob(b=>{ const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download='idphoto.jpg'; a.click(); }, 'image/jpeg', 0.95);
});

// --- Compress / format
const compFile=document.getElementById('compress-file'), compCanvas=document.getElementById('compress-canvas');
compFile.addEventListener('change', e=>{ if(e.target.files[0]) loadImageToCanvas(e.target.files[0], compCanvas); });
document.getElementById('compress-run').addEventListener('click', ()=>{
  const q = parseInt(document.getElementById('compress-quality').value)/100;
  const targetW = parseInt(document.getElementById('compress-width').value)||compCanvas.width;
  const fmt = document.getElementById('compress-format').value;
  const tmp=document.createElement('canvas');
  const scale = targetW / compCanvas.width;
  tmp.width = Math.round(compCanvas.width * scale); tmp.height = Math.round(compCanvas.height * scale);
  tmp.getContext('2d').drawImage(compCanvas,0,0,tmp.width,tmp.height);
  tmp.toBlob(b=>{ const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download='compressed.' + (fmt.includes('png')?'png': fmt.includes('webp')?'webp':'jpg'); a.click(); }, fmt, q);
});

// --- Watermark add / remove (simple)
const wmFile=document.getElementById('wm-file'), wmCanvas=document.getElementById('wm-canvas');
wmFile.addEventListener('change', e=>{ if(e.target.files[0]) loadImageToCanvas(e.target.files[0], wmCanvas); });
document.getElementById('wm-add-text').addEventListener('click', ()=>{
  const txt = document.getElementById('wm-text').value || '© ToolBase';
  const ctx = wmCanvas.getContext('2d');
  const size = Math.round(wmCanvas.width/15);
  ctx.font = `bold ${size}px sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 2;
  ctx.textAlign = 'right';
  ctx.fillText(txt, wmCanvas.width - 10, wmCanvas.height - 20);
  ctx.strokeText(txt, wmCanvas.width - 10, wmCanvas.height - 20);
});
document.getElementById('wm-add-img').addEventListener('click', ()=>{
  const f = document.getElementById('wm-imgfile').files[0];
  if(!f) return alert('Select watermark image first');
  const img = new Image();
  img.onload = ()=>{ const ctx = wmCanvas.getContext('2d'); const w=Math.round(wmCanvas.width/5); const h = Math.round(img.height*(w/img.width)); ctx.drawImage(img, wmCanvas.width - w - 10, wmCanvas.height - h - 10, w, h); };
  img.src = URL.createObjectURL(f);
});

// select rectangle to remove (simple patch fill using surrounding average)
let selecting=false, selStart=null, selRect=null;
document.getElementById('wm-select-remove').addEventListener('click', ()=> {
  alert('接下来请在图片上拖动选择矩形区域以去除水印（仅演示用途）');
  selecting=true;
  wmCanvas.style.cursor='crosshair';
});
wmCanvas.addEventListener('mousedown', e=> {
  if(!selecting) return;
  const r = wmCanvas.getBoundingClientRect();
  selStart = {x: e.clientX - r.left, y: e.clientY - r.top};
});
wmCanvas.addEventListener('mouseup', e=> {
  if(!selecting || !selStart) return;
  const r = wmCanvas.getBoundingClientRect();
  const end = {x: e.clientX - r.left, y: e.clientY - r.top};
  const x = Math.min(selStart.x, end.x), y = Math.min(selStart.y, end.y);
  const w = Math.abs(selStart.x - end.x), h = Math.abs(selStart.y - end.y);
  selRect = {x:Math.round(x), y:Math.round(y), w:Math.round(w), h:Math.round(h)};
  selecting=false; selStart=null; wmCanvas.style.cursor='default';
  // simple patch: sample border pixels average and fill
  const ctx = wmCanvas.getContext('2d'); const img = ctx.getImageData(0,0,wmCanvas.width,wmCanvas.height);
  // compute average color of surrounding 8px ring
  const ring=8;
  let rsum=0,gsum=0,bsum=0,cnt=0;
  for(let yy=Math.max(0,selRect.y-ring); yy<Math.min(wmCanvas.height, selRect.y+selRect.h+ring); yy++){
    for(let xx=Math.max(0,selRect.x-ring); xx<Math.min(wmCanvas.width, selRect.x+selRect.w+ring); xx++){
      if(xx>=selRect.x && xx<selRect.x+selRect.w && yy>=selRect.y && yy<selRect.y+selRect.h) continue;
      const idx = (yy*wmCanvas.width+xx)*4;
      rsum += img.data[idx]; gsum += img.data[idx+1]; bsum += img.data[idx+2]; cnt++;
    }
  }
  if(cnt===0) return alert('区域太大或边缘无可采样像素');
  const rr = Math.round(rsum/cnt), gg=Math.round(gsum/cnt), bb=Math.round(bsum/cnt);
  // fill selected rect with average color + slight blur (box)
  for(let yy=selRect.y; yy<selRect.y+selRect.h; yy++){
    for(let xx=selRect.x; xx<selRect.x+selRect.w; xx++){
      const idx=(yy*wmCanvas.width+xx)*4;
      img.data[idx]=rr; img.data[idx+1]=gg; img.data[idx+2]=bb; img.data[idx+3]=255;
    }
  }
  ctx.putImageData(img,0,0);
});

// download
document.getElementById('wm-download').addEventListener('click', ()=> {
  wmCanvas.toBlob(b=>{ const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download='image.png'; a.click(); }, 'image/png');
});
