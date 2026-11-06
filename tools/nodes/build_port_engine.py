"""Convierte el motor de Port Aurelia (puerto-animation/index.html) en una función reutilizable
bootPort(cv, host, hooks) que corre dentro de un componente del lienzo, sin DOM propio."""
import re, sys
from pathlib import Path
src = Path('/home/claude/puerto-animation/index.html').read_text(encoding='utf-8').split('\n')
# Cuerpo del IIFE: desde la línea siguiente a "(()=>{" hasta antes de "})();"
start = next(i for i, l in enumerate(src) if l.strip() == '(()=>{') + 1
end = max(i for i, l in enumerate(src) if l.strip() == '})();')
body = src[start:end]
text = '\n'.join(body)
# Quitar menús móviles y pestaña BPMN (no aplican dentro del lienzo)
a = text.index('/* ===================== menus: hide / compact (mobile)')
b = text.index('/* ===================== main loop')
text = text[:a] + "let tab='sim';function setTab(){}\nfunction bpmnXml(){return '';}\n" + text[b:]
rep = [
    ("const T=THREE;", "const T=window.THREE;"),
    ("const $=s=>document.querySelector(s);", "const __fake=()=>({style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false;}},children:[],textContent:'',innerHTML:'',value:'',offsetWidth:0,onclick:null,addEventListener(){},querySelector(){return __fake();},querySelectorAll(){return [];},closest(){return null;},setAttribute(){},appendChild(){},focus(){}});\nconst __els={};const $=s=>s==='#gl'?__cv:(__els[s]||(__els[s]=__fake()));\nconst __doc={body:__fake(),querySelector:$,querySelectorAll:()=>[],addEventListener(){},createElement:(t)=>globalThis['docu'+'ment'].createElement(t)};\nconst __W=()=>Math.max(1,__host.clientWidth),__H=()=>Math.max(1,__host.clientHeight);\nconst __cx=e=>e['client'+'X']-__cv.getBoundingClientRect().left,__cy=e=>e['client'+'Y']-__cv.getBoundingClientRect().top;"),
    ("renderer.localClippingEnabled=true;", "renderer.localClippingEnabled=true;if('useLegacyLights' in renderer)renderer.useLegacyLights=true;"),
    ("addEventListener('resize',resize);resize();", "if(window.ResizeObserver){__ro=new ResizeObserver(resize);__ro.observe(__host);}resize();"),
    ("window.__tidegrid=", "__api="),
    ("function frame(now){\n  requestAnimationFrame(frame);", "function frame(now){\n  if(!__alive)return;__raf=requestAnimationFrame(frame);"),
    ("requestAnimationFrame(frame);\n", "__raf=requestAnimationFrame(frame);\n"),
    ("function toast(t){", "function toast(t){if(__hooks.toast)__hooks.toast(t);"),
]
for old, new in rep:
    if text.count(old) < 1:
        sys.exit('no encontrado: ' + old[:50])
    text = text.replace(old, new, 1 if old != "requestAnimationFrame(frame);\n" else 1)
text = text.replace('document.', '__doc.')
text = re.sub(r'\binnerWidth\b', '__W()', text)
text = re.sub(r'\binnerHeight\b', '__H()', text)
text = text.replace('e.clientX', '__cx(e)').replace('e.clientY', '__cy(e)')
text = text.replace("addEventListener('keydown'", "(()=>{})('keydown'")
# El api expone lo que la interfaz del lienzo necesita
text = text.replace("__api={S,", "__api={get moveLog(){return moveLog;},get gateTurns(){return gateTurns;},get alerts(){return alerts;},entLabel,etaOf,prog,fmtHM,CARR,STATUS_COL,flyTo,VIEWS,stopFly,S,")
head = "let __alive=true,__raf=0,__ro=null,__api=null;const __cv=cv,__host=host,__hooks=hooks||{};\nconst canvasRef=cv;\n"
tail = "\n__api.dispose=()=>{__alive=false;cancelAnimationFrame(__raf);if(__ro)__ro.disconnect();try{renderer.dispose();renderer.forceContextLoss();}catch(e){}};\nreturn __api;"
out = head + text + tail
# guard: no quedan referencias a window.addEventListener ni document
assert 'document.querySelector' not in out
Path('port_engine.js').write_text(out, encoding='utf-8')
print('motor:', len(out), 'caracteres')
