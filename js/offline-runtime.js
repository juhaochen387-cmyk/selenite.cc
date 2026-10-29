/* Local compatibility layer. No service worker or external server is used here. */
(() => {
  'use strict';
  const root = new URL('../', document.currentScript.src);
  const routes = {home:'home.html',projects:'projects.html',apps:'apps.html',settings:'settings.html',info:'info.html',bookmarklets:'bookmarklets.html',users:'offline-services.html','u/':'offline-services.html',proxy:'offline-services.html'};
  const localURL = value => {
    if (typeof value !== 'string') return value;
    if (value.startsWith('/') && !value.startsWith('//')) {
      let rel = value.slice(1);
      if (/^(semag|sppa)\//.test(rel)) rel='resources/'+rel;
      return new URL(routes[rel] || rel, root).href;
    }
    return value;
  };
  window.SeleniteOffline = {root:root.href, localURL};
  try {localStorage.setItem('selenite.disableCDN', 'true');} catch (_) {}
  const getDate = offset => new Date(Date.now()-(offset||0)*86400000).toISOString().slice(0,10);
  window.getDate = getDate;
  window.sAlert = (title,message) => alert([title,message].filter(Boolean).join('\n'));
  for (const [cls,prop] of [[HTMLImageElement,'src'],[HTMLScriptElement,'src'],[HTMLIFrameElement,'src'],[HTMLLinkElement,'href'],[HTMLAnchorElement,'href'],[HTMLMediaElement,'src'],[HTMLSourceElement,'src']]) {
    const d=Object.getOwnPropertyDescriptor(cls.prototype,prop);
    if(d && d.set) Object.defineProperty(cls.prototype,prop,{...d,set(v){d.set.call(this,localURL(v));}});
  }
  const originalSetAttribute=Element.prototype.setAttribute;
  Element.prototype.setAttribute=function(name,value){return originalSetAttribute.call(this,name,/^(src|href)$/i.test(name)?localURL(value):value);};
  function keyFor(input) {
    const u=new URL(localURL(typeof input==='string'?input:input instanceof URL?input.href:input.url),document.baseURI);
    if(u.href.startsWith(root.href))return decodeURIComponent(u.href.slice(root.href.length).split(/[?#]/)[0]);
    return null;
  }
  function bytes(encoded) {const s=atob(encoded), b=new Uint8Array(s.length);for(let i=0;i<s.length;i++)b[i]=s.charCodeAt(i);return b;}
  const originalFetch=window.fetch.bind(window);
  function bundled(input) {
    const key=keyFor(input);
    if(window.SELENITE_DATA && Object.prototype.hasOwnProperty.call(window.SELENITE_DATA,key))return {body:JSON.stringify(window.SELENITE_DATA[key]),type:'application/json'};
    const file=window.SELENITE_FILES && window.SELENITE_FILES[key];
    if(file)return {body:bytes(file[1]),type:file[0]};
    return null;
  }
  window.fetch=async function(input,options){
    const key=keyFor(input);
    if(key==='api/analytics/get')throw new Error('Global live rankings are unavailable offline.');
    if(key==='api/analytics/game')return new Response('{}',{headers:{'Content-Type':'application/json'}});
    if(key && key.startsWith('api/'))return new Response(JSON.stringify({success:false,error:'This feature requires the original online service.'}),{status:503,headers:{'Content-Type':'application/json'}});
    const file=bundled(input);
    if(file)return new Response(file.body,{headers:{'Content-Type':file.type}});
    const target=localURL(typeof input==='string'?input:input instanceof URL?input.href:input.url);
    if(/^https?:/i.test(target) && new URL(target).origin!==location.origin)throw new Error('This asset was not available in the offline archive: '+target);
    return originalFetch(target,options);
  };
  const NativeXHR=window.XMLHttpRequest;
  class LocalXHR extends EventTarget {
    constructor(){super();this.readyState=0;this.status=0;this.response=null;this.responseText='';this.responseType='';this.upload=new EventTarget();}
    fire(name,init){const e=name==='progress'||name==='load'?new ProgressEvent(name,init):new Event(name);this.dispatchEvent(e);if(typeof this['on'+name]==='function')this['on'+name](e);}
    open(method,url,async=true){this.method=method;this.url=localURL(url);this.async=async;this.readyState=1;this.fire('readystatechange');}
    setRequestHeader(){}
    overrideMimeType(){}
    getResponseHeader(name){return /content-type/i.test(name)?this.mime:null;}
    getAllResponseHeaders(){return 'Content-Type: '+this.mime;}
    abort(){this.aborted=true;this.native?.abort();this.fire('abort');}
    send(body){
      const file=bundled(this.url);
      if(!file){const x=this.native=new NativeXHR();x.open(this.method,this.url,this.async);x.responseType=this.responseType;for(const k of ['load','error','progress','abort','timeout','readystatechange','loadend'])x.addEventListener(k,e=>{for(const p of ['readyState','status','statusText','response','responseURL']){try{this[p]=x[p];}catch(_){}}try{this.responseText=x.responseText;}catch(_){}this.fire(k,e);});x.send(body);return;}
      const complete=()=>{if(this.aborted)return;this.status=200;this.statusText='OK';this.responseURL=this.url;this.mime=file.type;this.readyState=2;this.fire('readystatechange');this.readyState=3;this.fire('readystatechange');const b=typeof file.body==='string'?new TextEncoder().encode(file.body):file.body;this.responseText=new TextDecoder().decode(b);this.response=this.responseType==='arraybuffer'?b.buffer:this.responseType==='blob'?new Blob([b],{type:file.type}):this.responseType==='json'?JSON.parse(this.responseText):this.responseText;this.readyState=4;this.fire('progress',{lengthComputable:true,loaded:b.length,total:b.length});this.fire('readystatechange');this.fire('load',{lengthComputable:true,loaded:b.length,total:b.length});this.fire('loadend');};
      if(this.async)setTimeout(complete,0);else complete();
    }
  }
  for(const [k,v] of Object.entries({UNSENT:0,OPENED:1,HEADERS_RECEIVED:2,LOADING:3,DONE:4})){LocalXHR[k]=v;LocalXHR.prototype[k]=v;}
  window.XMLHttpRequest=LocalXHR;
  document.addEventListener('DOMContentLoaded',()=>{
    for(const element of document.querySelectorAll('[src^="/"],[href^="/"]'))for(const a of ['src','href'])if(element.hasAttribute(a))element.setAttribute(a,element.getAttribute(a));
  });
})();
