(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))s(o);new MutationObserver(o=>{for(const r of o)if(r.type==="childList")for(const c of r.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&s(c)}).observe(document,{childList:!0,subtree:!0});function e(o){const r={};return o.integrity&&(r.integrity=o.integrity),o.referrerPolicy&&(r.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?r.credentials="include":o.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function s(o){if(o.ep)return;o.ep=!0;const r=e(o);fetch(o.href,r)}})();let K=null,re=!1;function me(){if(!K){const a=window.AudioContext||window.webkitAudioContext;if(!a)return null;K=new a}return K}function U(){const a=me();if(!a)return!1;if(re)return!0;const n=a.createOscillator(),e=a.createGain();e.gain.value=0,n.frequency.value=440,n.connect(e),e.connect(a.destination);const s=a.currentTime;return n.start(s),n.stop(s+.005),re=!0,!0}function D({frequencyHz:a,durationMs:n,gain:e=.12,type:s="sine"}){const o=me();if(!o)return;o.state==="suspended"&&o.resume().catch(()=>{});const r=o.createOscillator(),c=o.createGain();r.type=s,r.frequency.value=a;const u=o.currentTime;c.gain.setValueAtTime(1e-4,u),c.gain.exponentialRampToValueAtTime(e,u+.01),c.gain.exponentialRampToValueAtTime(1e-4,u+n/1e3),r.connect(c),c.connect(o.destination),r.start(u),r.stop(u+n/1e3+.02)}function Re(){D({frequencyHz:880,durationMs:100,gain:.14,type:"square"})}function Ae(){D({frequencyHz:660,durationMs:400,gain:.14,type:"sine"})}function Be(){D({frequencyHz:440,durationMs:400,gain:.14,type:"sine"})}function De(){D({frequencyHz:523,durationMs:150,gain:.14,type:"sine"}),setTimeout(()=>D({frequencyHz:659,durationMs:150,gain:.14,type:"sine"}),170),setTimeout(()=>D({frequencyHz:784,durationMs:150,gain:.14,type:"sine"}),340)}let N=!1;function v(a,n,e,s){fetch("http://127.0.0.1:7448/ingest/d9512ff2-96b2-4b56-987a-9b4cb119db51",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"0441b6"},body:JSON.stringify({sessionId:"0441b6",runId:"pre-fix",hypothesisId:a,location:n,message:e,data:s,timestamp:Date.now()})}).catch(()=>{})}function V(){const a="speechSynthesis"in window;if(v("H1","src/voice.js:23","ensureSpeechUnlocked() called",{hasSpeechSynthesis:a,alreadyUnlocked:N,docVisibility:document.visibilityState}),!a)return!1;if(N)return!0;try{const n=new SpeechSynthesisUtterance("");n.lang="en-US",n.onstart=()=>{v("H1","src/voice.js:37","unlock utterance onstart",{speaking:window.speechSynthesis?.speaking,pending:window.speechSynthesis?.pending,paused:window.speechSynthesis?.paused})},n.onerror=s=>{v("H4","src/voice.js:45","unlock utterance onerror",{error:s?.error,name:s?.name,message:s?.message})},window.speechSynthesis.speak(n),N=!0;const e=window.speechSynthesis?.getVoices?.()?.length??null;return v("H2","src/voice.js:56","unlock speak() invoked",{isUnlocked:N,voicesLen:e,speaking:window.speechSynthesis?.speaking,pending:window.speechSynthesis?.pending,paused:window.speechSynthesis?.paused}),!0}catch(n){return v("H1","src/voice.js:67","ensureSpeechUnlocked() threw",{err:String(n?.message??n)}),!1}}function x(){try{v("H3","src/voice.js:79","cancelSpeech() called",{speaking:window.speechSynthesis?.speaking,pending:window.speechSynthesis?.pending,paused:window.speechSynthesis?.paused}),window.speechSynthesis?.cancel?.()}catch{}}function H(a){if("speechSynthesis"in window&&a)try{const n=window.speechSynthesis,e=n?.getVoices?.()??[];v("H2","src/voice.js:87","speak() called",{textLen:String(a).length,isUnlocked:N,voicesLen:Array.isArray(e)?e.length:null,speaking:n?.speaking,pending:n?.pending,paused:n?.paused});const s=!!(n?.speaking||n?.pending);if(s){v("H3","src/voice.js:101","speak() cancelSpeech() before new utterance",{speaking:n?.speaking,pending:n?.pending,paused:n?.paused}),x();try{n?.resume?.()}catch{}}const o=new SpeechSynthesisUtterance(a);o.lang="en-US",o.rate=1.1,o.pitch=1,o.volume=1,o.onstart=()=>{v("H3","src/voice.js:109","utterance onstart",{speaking:window.speechSynthesis?.speaking,pending:window.speechSynthesis?.pending,paused:window.speechSynthesis?.paused})},o.onend=()=>{v("H3","src/voice.js:117","utterance onend",{speaking:window.speechSynthesis?.speaking,pending:window.speechSynthesis?.pending,paused:window.speechSynthesis?.paused})},o.onerror=c=>{v("H4","src/voice.js:125","utterance onerror",{error:c?.error,name:c?.name,message:c?.message})};const r=()=>{n.speak(o),v("H3","src/voice.js:150","speak() invoked speechSynthesis.speak",{speaking:n?.speaking,pending:n?.pending,paused:n?.paused})};s?(requestAnimationFrame(r),v("H3","src/voice.js:159","speak() scheduled speak on next frame",{})):r()}catch(n){v("H1","src/voice.js:143","speak() threw",{err:String(n?.message??n)})}}let P=null;async function ie(){try{return"wakeLock"in navigator?(P=await navigator.wakeLock.request("screen"),P):null}catch{return P=null,null}}function le(){try{P?.release?.()}catch{}finally{P=null}}function Ce({onChange:a,onProgress:n}={}){const e={phases:[],phaseIndex:0,timeRemaining:0,status:"idle",voiceEnabled:!0,beepsEnabled:!0,phaseEndsAtMs:null,phaseDurationMs:null,pausedPhaseRemainingMs:null};let s=null,o=null,r=null,c=null;function u(){try{a?.(Z())}catch{}}function g(){s!=null&&(clearInterval(s),s=null)}function M(){g(),s=setInterval(()=>{e.status==="running"&&te()},1e3),R()}function R(){if(o!=null)return;const i=()=>{if(o=requestAnimationFrame(i),e.status==="running")try{n?.(ne(),Z())}catch{}};o=requestAnimationFrame(i)}function A(){o!=null&&(cancelAnimationFrame(o),o=null)}function w(i){e.status=i,e.status==="running"?(M(),ie()):(g(),A(),le()),u()}function k(){return e.phases[e.phaseIndex]??{type:"done"}}function B(){return e.phases[e.phaseIndex+1]??null}function q(i){if(i&&typeof i=="object"){if("atSecondsRemaining"in i)return`r:${Number(i.atSecondsRemaining)}:${String(i.audio??"")}`;if("atPercentElapsed"in i)return`p:${Number(i.atPercentElapsed)}:${String(i.audio??"")}`}return JSON.stringify(i)}function I(i){return i?i==="halfway"?"Halfway":i==="oneMinuteLeft"?"One minute left":"":""}function T(){if(e.status!=="running"&&e.status!=="paused"&&e.status!=="idle")return;const i=k(),p=Array.isArray(i?.midPhaseCues)?i.midPhaseCues:[];if(p.length===0)return;c||(c=new Set);const m=Number(i?.duration??0),f=Math.max(0,m-Number(e.timeRemaining??0)),F=m>0?f/m*100:0;for(const S of p){if(!S||typeof S!="object")continue;const G=q(S);if(c.has(G))continue;const z=Object.prototype.hasOwnProperty.call(S,"atSecondsRemaining"),L=Object.prototype.hasOwnProperty.call(S,"atPercentElapsed"),ae=z?Number(S.atSecondsRemaining):null,oe=L?Number(S.atPercentElapsed):null;let _=!1;if(z&&Number.isFinite(ae))_=Number(e.timeRemaining)===ae;else if(L&&Number.isFinite(oe))_=F>=oe;else continue;if(!_)continue;c.add(G);const se=I(String(S.audio??""));e.voiceEnabled&&se&&H(se)}}function $(i,{viaSkip:p}={}){e.phaseIndex=i;const m=k();if(r=null,c=null,m.type==="done"){e.timeRemaining=0,e.phaseEndsAtMs=null,e.phaseDurationMs=null,e.pausedPhaseRemainingMs=null,x(),e.voiceEnabled&&H("Done, nice job!"),w("done");return}const f=Number(m.duration??0);e.timeRemaining=f,e.phaseDurationMs=f*1e3,e.phaseEndsAtMs=Date.now()+e.phaseDurationMs,e.pausedPhaseRemainingMs=null,m.type==="work"?(e.beepsEnabled&&Ae(),e.voiceEnabled&&H(W(m))):m.type==="rest"&&(e.beepsEnabled&&Be(),e.voiceEnabled&&H("Rest")),T(),u()}function W(i){const p=Number(i.round??0),m=Number(i.totalRounds??0);return p&&m&&p===m?"Last Round":p?`Round ${p}`:"Round one"}function O(i,p){if(e.status!=="running")return;const f=B()?.type??null;if(f==="work"||f==="rest"||f==="countdown"||f==="done")for(const S of[3,2,1]){if(!(i>S&&p<=S)&&!(p===S))continue;const L=`${e.phaseIndex}:${S}`;r!==L&&(r=L,e.beepsEnabled&&Re())}}function l({viaSkip:i}){const p=k(),m=e.phaseIndex+1,f=e.phases[m]??{type:"done"};f.type==="done"&&e.beepsEnabled&&De(),$(m,{viaSkip:i}),p.type!=="done"&&f.type}function te(){const i=e.timeRemaining;if(e.phaseEndsAtMs!=null){const p=Math.max(0,e.phaseEndsAtMs-Date.now()),m=e.phaseDurationMs??null,f=p>0&&p%1e3===0&&m!=null&&p!==m,F=Math.ceil(p/1e3)+(f?1:0);e.timeRemaining=F}if(O(i,e.timeRemaining),T(),e.timeRemaining>0){u();return}e.timeRemaining=0,l({viaSkip:!1})}function ne(){if(e.status!=="running"||!e.phaseEndsAtMs||!e.phaseDurationMs)return 0;const i=Date.now(),m=(e.phaseDurationMs-Math.max(0,e.phaseEndsAtMs-i))/e.phaseDurationMs;return Math.max(0,Math.min(1,m))}function ge(i,{voiceEnabled:p=!0,beepsEnabled:m=!0}={}){e.phases=Array.isArray(i)?i:[],e.voiceEnabled=!!p,e.beepsEnabled=!!m,e.phaseIndex=0,w("running"),$(0,{viaSkip:!1})}function Se(){e.status==="running"&&(x(),e.phaseEndsAtMs!=null&&(e.pausedPhaseRemainingMs=Math.max(0,e.phaseEndsAtMs-Date.now())),w("paused"))}function ye(){e.status==="paused"&&(e.pausedPhaseRemainingMs!=null&&(e.phaseEndsAtMs=Date.now()+e.pausedPhaseRemainingMs,e.pausedPhaseRemainingMs=null),w("running"))}function we(){x(),g(),A(),le(),e.phases=[],e.phaseIndex=0,e.timeRemaining=0,e.phaseEndsAtMs=null,e.phaseDurationMs=null,e.pausedPhaseRemainingMs=null,r=null,w("idle")}function ke(){e.status!=="running"&&e.status!=="paused"||l({viaSkip:!0})}function Z(){const i=k();return{status:e.status,phases:e.phases,phaseIndex:e.phaseIndex,currentPhase:i,nextPhase:B(),timeRemaining:e.timeRemaining,progress:ne(),voiceEnabled:e.voiceEnabled,beepsEnabled:e.beepsEnabled}}function Ee({voiceEnabled:i,beepsEnabled:p}){typeof i=="boolean"&&(e.voiceEnabled=i),typeof p=="boolean"&&(e.beepsEnabled=p),e.voiceEnabled||x(),u()}function Me(){document.visibilityState==="visible"&&e.status==="running"&&ie()}return window.addEventListener("beforeunload",()=>g()),document.addEventListener("visibilitychange",Me),{start:ge,pause:Se,resume:ye,reset:we,skip:ke,getState:Z,setAudioToggles:Ee}}const E={countdown:"countdown",work:"work",rest:"rest",done:"done"},C=10;function Te({workDuration:a,restDuration:n,totalRounds:e}){const s=Math.max(1,Math.floor(Number(a??0))),o=Math.max(1,Math.floor(Number(n??0))),r=Math.max(1,Math.floor(Number(e??1))),c=[{type:E.countdown,duration:C,label:"Get Ready"}];for(let u=1;u<=r;u+=1)c.push({type:E.work,duration:s,label:`Round ${u} Work`,round:u,totalRounds:r}),u<r&&c.push({type:E.rest,duration:o,label:`Round ${u} Rest`,round:u,totalRounds:r});return c.push({type:E.done}),c}function $e({intervalDuration:a,totalRounds:n}){const e=Math.max(1,Math.floor(Number(a??0))),s=Math.max(1,Math.floor(Number(n??1))),o=[{type:E.countdown,duration:C,label:"Get Ready"}];for(let r=1;r<=s;r+=1)o.push({type:E.work,duration:e,label:`Round ${r}`,round:r,totalRounds:s});return o.push({type:E.done}),o}function Le({workDuration:a}){const n=Math.max(1,Math.floor(Number(a??0)));return[{type:E.countdown,duration:C,label:"Get Ready"},{type:E.work,duration:n,label:"AMRAP",midPhaseCues:[{atPercentElapsed:50,audio:"halfway"},{atSecondsRemaining:60,audio:"oneMinuteLeft"}]},{type:E.done}]}function be({workDuration:a,restDuration:n,totalRounds:e}){const s=Math.max(1,Math.floor(Number(a??0))),o=Math.max(1,Math.floor(Number(n??0))),r=Math.max(1,Math.floor(Number(e??1)));return C+r*s+(r-1)*o}function fe({intervalDuration:a,totalRounds:n}){const e=Math.max(1,Math.floor(Number(a??0))),s=Math.max(1,Math.floor(Number(n??1)));return C+s*e}function ve({workDuration:a}){const n=Math.max(1,Math.floor(Number(a??0)));return C+n}function he(){return document.getElementById("app")}const d={home:"home",tabataSetup:"tabata-setup",emomSetup:"emom-setup",amrapSetup:"amrap-setup",running:"running",done:"done"};function y(a){const n=Math.max(0,Math.floor(a)),e=String(Math.floor(n/60)).padStart(2,"0"),s=String(n%60).padStart(2,"0");return`${e}:${s}`}function Ne(){const a=[];for(let n=5;n<=60;n+=5)a.push({seconds:n,label:y(n)});for(let n=75;n<=300;n+=15)a.push({seconds:n,label:y(n)});return a}let Y=null;function Q(){return Y||(Y=Ne()),Y}function xe(){const a=[];for(let n=15;n<=300;n+=15)a.push({seconds:n,label:y(n)});for(let n=360;n<=1800;n+=60)a.push({seconds:n,label:y(n)});return a}let J=null;function Pe(){return J||(J=xe()),J}const t={view:d.home,activeFormat:null,showCancelConfirm:!1,tabataWorkDuration:20,tabataRestDuration:10,tabataTotalRounds:8,emomIntervalDuration:60,emomTotalRounds:10,amrapWorkDuration:600,voiceEnabled:!0,beepsEnabled:!0,voiceAvailable:!0,lastWorkout:null},b=Ce({onChange:a=>{a?.status==="done"&&(t.view=d.done),h()},onProgress:a=>{const n=document.querySelector("#phaseBanner");n&&n.style.setProperty("--p",String(a??0))}});function ce(){try{h()}catch(a){console.error(a);const n=he();n&&(n.innerHTML=`
        <main class="card card--padded" aria-live="assertive">
          <h1 class="title">Could not start timer</h1>
          <p class="subtitle error-text">${String(a?.message??a)}</p>
          <p class="subtitle help-text">Try a hard refresh (clear cache) or run <code class="inline-code">npm run dev</code> from the project folder.</p>
        </main>
      `)}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",ce):ce();function qe(){return`
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M14 3.23v17.54c0 1.13-1.27 1.81-2.22 1.2L7.9 19H5a3 3 0 0 1-3-3v-4a3 3 0 0 1 3-3h2.9l3.88-3.97c.95-.61 2.22.07 2.22 1.2ZM16.5 8.5a1 1 0 0 1 1.41 0a6 6 0 0 1 0 8.49a1 1 0 1 1-1.41-1.41a4 4 0 0 0 0-5.66a1 1 0 0 1 0-1.42Zm2.83-2.83a1 1 0 0 1 1.41 0a10 10 0 0 1 0 14.14a1 1 0 1 1-1.41-1.41a8 8 0 0 0 0-11.32a1 1 0 0 1 0-1.41Z"/>
    </svg>
  `}function Ie(){return`
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M14 3.23v17.54c0 1.13-1.27 1.81-2.22 1.2L7.9 19H5a3 3 0 0 1-3-3v-4a3 3 0 0 1 3-3h2.9l3.88-3.97c.95-.61 2.22.07 2.22 1.2Z"/>
      <path fill="currentColor" d="M17.59 8.59a1 1 0 0 1 1.41 0L21 10.59l1.99-2a1 1 0 1 1 1.42 1.42L22.41 12l2 1.99a1 1 0 0 1-1.42 1.42L21 13.41l-2 2a1 1 0 0 1-1.41-1.42L19.59 12l-2-1.99a1 1 0 0 1 0-1.42Z"/>
    </svg>
  `}function We(){return`
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm6-6V11a6 6 0 1 0-12 0v5L4 18v1h16v-1l-2-2Z"/>
    </svg>
  `}function Oe(){return`
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Z"/>
      <path fill="currentColor" d="M4 18v1h16v-1l-2-2V11c0-1.2-.35-2.32-.95-3.27l-1.5 1.5c.29.55.45 1.18.45 1.77v5.83l1.17 1.17H6.83L6 17.83V11c0-.64.14-1.25.4-1.8L4.9 7.7A5.96 5.96 0 0 0 4 11v5l-2 2Z"/>
      <path fill="currentColor" d="M3.29 4.71a1 1 0 0 1 1.42-1.42l16 16a1 1 0 1 1-1.42 1.42l-16-16Z"/>
    </svg>
  `}function ee(){return`
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M15.5 5.5a1 1 0 0 1 0 1.4L10.4 12l5.1 5.1a1 1 0 1 1-1.4 1.4l-5.8-5.8a1 1 0 0 1 0-1.4l5.8-5.8a1 1 0 0 1 1.4 0Z"/>
    </svg>
  `}function Fe(){return`
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M18.3 5.7a1 1 0 0 1 0 1.4L13.4 12l4.9 4.9a1 1 0 1 1-1.4 1.4L12 13.4l-4.9 4.9a1 1 0 1 1-1.4-1.4l4.9-4.9L5.7 7.1a1 1 0 0 1 1.4-1.4l4.9 4.9l4.9-4.9a1 1 0 0 1 1.4 0Z"/>
    </svg>
  `}function He(){return`
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M8.8 5.9c0-1.2 1.3-1.9 2.3-1.3l9.3 5.6c1 .6 1 2.1 0 2.7l-9.3 5.6c-1 .6-2.3-.1-2.3-1.3V5.9Z"/>
    </svg>
  `}function je(){return`
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M7 6.5A1.5 1.5 0 0 1 8.5 5H10a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 10 19H8.5A1.5 1.5 0 0 1 7 17.5v-11Zm5.5 0A1.5 1.5 0 0 1 14 5h1.5A1.5 1.5 0 0 1 17 6.5v11A1.5 1.5 0 0 1 15.5 19H14a1.5 1.5 0 0 1-1.5-1.5v-11Z"/>
    </svg>
  `}function Ue(){b.reset(),t.view=d.home,t.activeFormat=null,t.showCancelConfirm=!1,h()}function Ve(){b.reset(),t.view=d.tabataSetup,t.activeFormat="tabata",t.showCancelConfirm=!1,h()}function Ze(){b.reset(),t.view=d.emomSetup,t.activeFormat="emom",t.showCancelConfirm=!1,h()}function Ge(){b.reset(),t.view=d.amrapSetup,t.activeFormat="amrap",t.showCancelConfirm=!1,h()}function ue(){b.reset(),t.activeFormat==="tabata"?t.view=d.tabataSetup:t.activeFormat==="emom"?t.view=d.emomSetup:t.activeFormat==="amrap"?t.view=d.amrapSetup:t.view=d.home,t.showCancelConfirm=!1,h()}function ze(){U(),t.voiceAvailable=V(),t.showCancelConfirm=!1;const a=document.querySelector("#workSelect"),n=document.querySelector("#restSelect"),e=document.querySelector("#roundsSelect");t.tabataWorkDuration=Number(a?.value??t.tabataWorkDuration),t.tabataRestDuration=Number(n?.value??t.tabataRestDuration),t.tabataTotalRounds=Number(e?.value??t.tabataTotalRounds);const s=Te({workDuration:t.tabataWorkDuration,restDuration:t.tabataRestDuration,totalRounds:t.tabataTotalRounds});t.lastWorkout={format:"tabata",phases:s},t.activeFormat="tabata",t.view=d.running,b.start(s,{voiceEnabled:t.voiceEnabled&&t.voiceAvailable,beepsEnabled:t.beepsEnabled}),h()}function _e(){U(),t.voiceAvailable=V(),t.showCancelConfirm=!1;const a=document.querySelector("#intervalSelect"),n=document.querySelector("#emomRoundsSelect");t.emomIntervalDuration=Number(a?.value??t.emomIntervalDuration),t.emomTotalRounds=Number(n?.value??t.emomTotalRounds);const e=$e({intervalDuration:t.emomIntervalDuration,totalRounds:t.emomTotalRounds});t.lastWorkout={format:"emom",phases:e},t.activeFormat="emom",t.view=d.running,b.start(e,{voiceEnabled:t.voiceEnabled&&t.voiceAvailable,beepsEnabled:t.beepsEnabled}),h()}function j(){const a=document.querySelector("#workSelect"),n=document.querySelector("#restSelect"),e=document.querySelector("#roundsSelect"),s=Number(a?.value??t.tabataWorkDuration),o=Number(n?.value??t.tabataRestDuration),r=Number(e?.value??t.tabataTotalRounds),c=be({workDuration:s,restDuration:o,totalRounds:r}),u=y(c),g=document.querySelector("#startTabataBtn");g&&(g.textContent=`Start · ${u}`,g.setAttribute("aria-label",`Start workout, total time ${u}`))}function X(){const a=document.querySelector("#intervalSelect"),n=document.querySelector("#emomRoundsSelect"),e=Number(a?.value??t.emomIntervalDuration),s=Number(n?.value??t.emomTotalRounds),o=fe({intervalDuration:e,totalRounds:s}),r=y(o),c=document.querySelector("#startEmomBtn");c&&(c.textContent=`Start · ${r}`,c.setAttribute("aria-label",`Start workout, total time ${r}`))}function de(){const a=document.querySelector("#amrapDurationSelect"),n=Number(a?.value??t.amrapWorkDuration),e=ve({workDuration:n}),s=y(e),o=document.querySelector("#startAmrapBtn");o&&(o.textContent=`Start · ${s}`,o.setAttribute("aria-label",`Start workout, total time ${s}`))}function Ke(){U(),t.voiceAvailable=V(),t.showCancelConfirm=!1;const a=document.querySelector("#amrapDurationSelect");t.amrapWorkDuration=Number(a?.value??t.amrapWorkDuration);const n=Le({workDuration:t.amrapWorkDuration});t.lastWorkout={format:"amrap",phases:n},t.activeFormat="amrap",t.view=d.running,b.start(n,{voiceEnabled:t.voiceEnabled&&t.voiceAvailable,beepsEnabled:t.beepsEnabled}),h()}function h(){const a=he();if(!a)return;const n=t.view===d.home?Ye():t.view===d.tabataSetup?Je():t.view===d.emomSetup?Xe():t.view===d.amrapSetup?Qe():et();a.innerHTML=n,tt()}function Ye(){return`
    <main class="card" aria-label="Choose timer format">
      <div class="header">
        <div class="headerMain">
          <h1 class="title title--display">Workout Timers</h1>
          <p class="subtitle">Choose a format</p>
        </div>
      </div>

      <div class="content">
        <div class="menuList" role="list">
          <button id="pickTabataBtn" class="primary" type="button" aria-label="Tabata timer">
            Tabata
          </button>
          <button id="pickEmomBtn" class="primary" type="button" aria-label="EMOM timer">
            EMOM
          </button>
          <button id="pickAmrapBtn" class="primary" type="button" aria-label="AMRAP timer">
            AMRAP
          </button>
        </div>
      </div>
    </main>
  `}function Je(){const a=be({workDuration:t.tabataWorkDuration,restDuration:t.tabataRestDuration,totalRounds:t.tabataTotalRounds}),n=y(a);return`
    <main class="card" aria-label="Tabata timer setup">
      <div class="header">
        <div class="headerLeft" aria-label="Navigation">
          <button
            id="navBackBtn"
            class="iconBtn"
            type="button"
            aria-label="Back"
            title="Back"
          >
            ${ee()}
          </button>
        </div>
        <div class="headerMain">
          <h1 class="title title--display">Tabata Timer</h1>
          <p class="subtitle">Work and rest intervals</p>
        </div>
        <div class="headerRight" aria-hidden="true"></div>
      </div>

      <div class="content">
        <div class="row">
          <label>
            Work
            <select id="workSelect" aria-label="Work duration">
              ${Q().map(e=>`<option value="${e.seconds}" ${e.seconds===t.tabataWorkDuration?"selected":""}>${e.label}</option>`).join("")}
            </select>
          </label>

          <label>
            Rest
            <select id="restSelect" aria-label="Rest duration">
              ${Q().map(e=>`<option value="${e.seconds}" ${e.seconds===t.tabataRestDuration?"selected":""}>${e.label}</option>`).join("")}
            </select>
          </label>
        </div>

        <div class="field-gap" aria-hidden="true"></div>

        <label>
          Rounds
          <select id="roundsSelect" aria-label="Number of rounds">
            ${Array.from({length:20},(e,s)=>s+1).map(e=>`<option value="${e}" ${e===t.tabataTotalRounds?"selected":""}>${e}</option>`).join("")}
          </select>
        </label>

        <div class="actions">
          <button class="primary" id="startTabataBtn" aria-label="Start workout, total time ${n}" type="button">Start · ${n}</button>
        </div>
      </div>
    </main>
  `}function Xe(){const a=fe({intervalDuration:t.emomIntervalDuration,totalRounds:t.emomTotalRounds}),n=y(a);return`
    <main class="card" aria-label="EMOM timer setup">
      <div class="header">
        <div class="headerLeft" aria-label="Navigation">
          <button
            id="navBackBtn"
            class="iconBtn"
            type="button"
            aria-label="Back"
            title="Back"
          >
            ${ee()}
          </button>
        </div>
        <div class="headerMain">
          <h1 class="title title--display">EMOM</h1>
          <p class="subtitle">Equal-length rounds back-to-back</p>
        </div>
        <div class="headerRight" aria-hidden="true"></div>
      </div>

      <div class="content">
        <div class="row">
          <label>
            Interval
            <select id="intervalSelect" aria-label="Interval duration">
              ${Q().map(e=>`<option value="${e.seconds}" ${e.seconds===t.emomIntervalDuration?"selected":""}>${e.label}</option>`).join("")}
            </select>
          </label>

          <label>
            Rounds
            <select id="emomRoundsSelect" aria-label="Number of rounds">
              ${Array.from({length:20},(e,s)=>s+1).map(e=>`<option value="${e}" ${e===t.emomTotalRounds?"selected":""}>${e}</option>`).join("")}
            </select>
          </label>
        </div>

        <div class="actions">
          <button class="primary" id="startEmomBtn" aria-label="Start workout, total time ${n}" type="button">Start · ${n}</button>
        </div>
      </div>
    </main>
  `}function Qe(){const a=ve({workDuration:t.amrapWorkDuration}),n=y(a);return`
    <main class="card" aria-label="AMRAP timer setup">
      <div class="header">
        <div class="headerLeft" aria-label="Navigation">
          <button
            id="navBackBtn"
            class="iconBtn"
            type="button"
            aria-label="Back"
            title="Back"
          >
            ${ee()}
          </button>
        </div>
        <div class="headerMain">
          <h1 class="title title--display">AMRAP</h1>
          <p class="subtitle">As many rounds as possible</p>
        </div>
        <div class="headerRight" aria-hidden="true"></div>
      </div>

      <div class="content">
        <label>
          Duration
          <select id="amrapDurationSelect" aria-label="AMRAP duration">
            ${Pe().map(e=>`<option value="${e.seconds}" ${e.seconds===t.amrapWorkDuration?"selected":""}>${e.label}</option>`).join("")}
          </select>
        </label>

        <div class="actions">
          <button class="primary" id="startAmrapBtn" aria-label="Start workout, total time ${n}" type="button">Start · ${n}</button>
        </div>
      </div>
    </main>
  `}function et(){const a=b.getState(),n=t.view===d.done||a.status==="done",e=a.status==="running"||a.status==="paused",s=t.activeFormat==="tabata"?"Tabata":t.activeFormat==="emom"?"EMOM":t.activeFormat==="amrap"?"AMRAP":"WOD Timer",o=a.currentPhase?.type??"done",r=o==="countdown",u=n?"doneTheme":r?"countdownTheme":o==="work"?"workTheme":"restTheme",g=n?"DONE":String(a.currentPhase?.label??""),M=Number(a.currentPhase?.round??0),R=Number(a.currentPhase?.totalRounds??0),A=n?t.lastWorkout&&pe(t.lastWorkout)?`Completed ${pe(t.lastWorkout)}`:"Workout complete":M&&R?`Round ${M} of ${R}`:r?"Starting in…":"",w=n?"00:00":y(a.timeRemaining),k=a.status==="running"?"Pause":"Resume",B=n&&!!t.lastWorkout?.phases?.length;return`
    <main class="card" aria-label="Timer running">
      <div class="header">
        ${t.activeFormat?`<div class="headerLeft" aria-label="Navigation">
                <button
                  id="navBackBtn"
                  class="iconBtn iconBtn--danger"
                  type="button"
                  aria-label="Cancel timer"
                  title="Cancel timer"
                >
                  ${Fe()}
                </button>
              </div>`:'<div class="headerLeft" aria-hidden="true"></div>'}
        <div class="headerMain">
          <h1 class="title title--display">${s}</h1>
          <p class="subtitle">${A}</p>
        </div>
        <div class="headerRight" aria-label="Controls">
          <button
            id="toggleVoiceBtn"
            class="iconBtn ${t.voiceEnabled?"":"isOff"}"
            type="button"
            ${t.voiceAvailable?"":"disabled"}
            aria-label="${t.voiceAvailable?t.voiceEnabled?"Mute voice":"Unmute voice":"Voice unavailable in this browser"}"
            title="${t.voiceAvailable?t.voiceEnabled?"Mute voice":"Unmute voice":"Voice unavailable in this browser"}"
          >
            ${t.voiceEnabled?qe():Ie()}
          </button>
          <button
            id="toggleBeepsBtn"
            class="iconBtn ${t.beepsEnabled?"":"isOff"}"
            type="button"
            aria-label="${t.beepsEnabled?"Mute beeps":"Unmute beeps"}"
            title="${t.beepsEnabled?"Mute beeps":"Unmute beeps"}"
          >
            ${t.beepsEnabled?We():Oe()}
          </button>
        </div>
      </div>

      <div class="run">
        ${t.showCancelConfirm&&e?`<div class="modalOverlay" role="presentation">
                <div class="modal" role="dialog" aria-modal="true" aria-label="Cancel timer confirmation">
                  <div class="modalTitle">Cancel timer?</div>
                  <div class="modalBody subtitle">Are you sure you want to cancel and go back to setup?</div>
                  <div class="modalActions">
                    <button id="cancelConfirmNoBtn" type="button">Keep going</button>
                    <button id="cancelConfirmYesBtn" class="danger" type="button">Cancel timer</button>
                  </div>
                </div>
              </div>`:""}
        <section id="phaseBanner" class="phaseBanner ${u}" aria-live="polite">
          <div class="phaseLabel">${g}</div>
          <div class="countdown" aria-label="Time remaining">${w}</div>
          <div class="progressTrack" aria-hidden="true">
            <div class="progressFill"></div>
          </div>
        </section>

        ${n?"":`<div class="actions actions--center">
                <button
                  id="pauseResumeBtn"
                  class="roundBtn roundBtn--xl"
                  type="button"
                  aria-label="${k}"
                  title="${k}"
                >
                  ${a.status==="running"?je():He()}
                </button>
              </div>`}
        ${B?`<div class="actions">
                <button id="goAgainBtn" class="primary">Go again</button>
              </div>`:""}
      </div>
    </main>
  `}function pe(a){const e=[...Array.isArray(a?.phases)?a.phases:[]].reverse().find(o=>o?.type==="work"),s=Number(e?.totalRounds??0)||0;return s?`${s} round${s===1?"":"s"}`:""}function tt(){const a=document.querySelector("#pickTabataBtn");a&&a.addEventListener("click",Ve);const n=document.querySelector("#pickEmomBtn");n&&n.addEventListener("click",Ze);const e=document.querySelector("#pickAmrapBtn");e&&e.addEventListener("click",Ge);const s=document.querySelector("#startTabataBtn");s&&s.addEventListener("click",ze);const o=document.querySelector("#workSelect");o&&o.addEventListener("change",l=>{t.tabataWorkDuration=Number(l?.target?.value??t.tabataWorkDuration),j()});const r=document.querySelector("#restSelect");r&&r.addEventListener("change",l=>{t.tabataRestDuration=Number(l?.target?.value??t.tabataRestDuration),j()});const c=document.querySelector("#roundsSelect");c&&c.addEventListener("change",l=>{t.tabataTotalRounds=Number(l?.target?.value??t.tabataTotalRounds),j()});const u=document.querySelector("#navBackBtn");u&&u.addEventListener("click",()=>{if(t.view===d.running||t.view===d.done){const l=b.getState();if(l.status==="running"||l.status==="paused"){t.showCancelConfirm=!0,h();return}ue();return}Ue()});const g=document.querySelector("#cancelConfirmNoBtn");g&&g.addEventListener("click",l=>{l.stopPropagation(),t.showCancelConfirm=!1,h()});const M=document.querySelector("#cancelConfirmYesBtn");M&&M.addEventListener("click",l=>{l.stopPropagation(),ue()});const R=document.querySelector("#startEmomBtn");R&&R.addEventListener("click",_e);const A=document.querySelector("#intervalSelect");A&&A.addEventListener("change",l=>{t.emomIntervalDuration=Number(l?.target?.value??t.emomIntervalDuration),X()});const w=document.querySelector("#emomRoundsSelect");w&&w.addEventListener("change",l=>{t.emomTotalRounds=Number(l?.target?.value??t.emomTotalRounds),X()});const k=document.querySelector("#amrapDurationSelect");k&&k.addEventListener("change",l=>{t.amrapWorkDuration=Number(l?.target?.value??t.amrapWorkDuration),de()}),t.view===d.tabataSetup&&j(),t.view===d.emomSetup&&X(),t.view===d.amrapSetup&&de();const B=document.querySelector("#startAmrapBtn");B&&B.addEventListener("click",Ke);const q=document.querySelector("#pauseResumeBtn");q&&q.addEventListener("click",()=>{const l=b.getState();l.status==="running"?b.pause():l.status==="paused"&&b.resume()});const I=document.querySelector("#toggleVoiceBtn");I&&I.addEventListener("click",l=>{l.stopPropagation(),t.voiceEnabled=!t.voiceEnabled,b.setAudioToggles({voiceEnabled:t.voiceEnabled}),h()});const T=document.querySelector("#toggleBeepsBtn");T&&T.addEventListener("click",l=>{l.stopPropagation(),t.beepsEnabled=!t.beepsEnabled,b.setAudioToggles({beepsEnabled:t.beepsEnabled}),h()});const $=document.querySelector("#goAgainBtn");$&&$.addEventListener("click",()=>{U(),V();const l=t.lastWorkout?.phases??null;!Array.isArray(l)||l.length===0||(t.view=d.running,b.start(l,{voiceEnabled:t.voiceEnabled,beepsEnabled:t.beepsEnabled}))});const W=document.querySelector("#phaseBanner");W&&W.addEventListener("click",()=>{b.getState().status==="done"||t.view!==d.running||b.skip()});const O=document.querySelector("#phaseBanner");if(O){const l=b.getState().progress??0;O.style.setProperty("--p",String(l))}}
