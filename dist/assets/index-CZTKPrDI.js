(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))a(r);new MutationObserver(r=>{for(const s of r)if(s.type==="childList")for(const c of s.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&a(c)}).observe(document,{childList:!0,subtree:!0});function o(r){const s={};return r.integrity&&(s.integrity=r.integrity),r.referrerPolicy&&(s.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?s.credentials="include":r.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function a(r){if(r.ep)return;r.ep=!0;const s=o(r);fetch(r.href,s)}})();let E=null,P=!1;function O(){if(!E){const n=window.AudioContext||window.webkitAudioContext;if(!n)return null;E=new n}return E}function G(){const n=O();if(!n)return!1;if(P)return!0;const t=n.createOscillator(),o=n.createGain();o.gain.value=0,t.frequency.value=440,t.connect(o),o.connect(n.destination);const a=n.currentTime;return t.start(a),t.stop(a+.005),P=!0,!0}function m({frequencyHz:n,durationMs:t,gain:o=.12,type:a="sine"}){const r=O();if(!r)return;r.state==="suspended"&&r.resume().catch(()=>{});const s=r.createOscillator(),c=r.createGain();s.type=a,s.frequency.value=n;const d=r.currentTime;c.gain.setValueAtTime(1e-4,d),c.gain.exponentialRampToValueAtTime(o,d+.01),c.gain.exponentialRampToValueAtTime(1e-4,d+t/1e3),s.connect(c),c.connect(r.destination),s.start(d),s.stop(d+t/1e3+.02)}function _(){m({frequencyHz:880,durationMs:100,gain:.14,type:"square"})}function A(){m({frequencyHz:660,durationMs:400,gain:.14,type:"sine"})}function K(){m({frequencyHz:440,durationMs:400,gain:.14,type:"sine"})}function Y(){m({frequencyHz:523,durationMs:150,gain:.14,type:"sine"}),setTimeout(()=>m({frequencyHz:659,durationMs:150,gain:.14,type:"sine"}),170),setTimeout(()=>m({frequencyHz:784,durationMs:150,gain:.14,type:"sine"}),340)}let g=null;async function N(){try{return"wakeLock"in navigator?(g=await navigator.wakeLock.request("screen"),g):null}catch{return g=null,null}}function I(){try{g?.release?.()}catch{}finally{g=null}}let B=!1;function J(){if(!("speechSynthesis"in window))return!1;if(B)return!0;try{const n=new SpeechSynthesisUtterance("");return n.lang="en-US",window.speechSynthesis.speak(n),B=!0,!0}catch{return!1}}function b(){try{window.speechSynthesis?.cancel?.()}catch{}}function p(n){if("speechSynthesis"in window&&n)try{b();const t=new SpeechSynthesisUtterance(n);t.lang="en-US",t.rate=1.1,t.pitch=1,t.volume=1,window.speechSynthesis.speak(t)}catch{}}function U(){return document.getElementById("app")}const u={countdown:"countdown",work:"work",rest:"rest"},i={setup:"setup",running:"running",paused:"paused",done:"done"};function S(n){const t=Math.max(0,Math.floor(n)),o=String(Math.floor(t/60)).padStart(2,"0"),a=String(t%60).padStart(2,"0");return`${o}:${a}`}function Q(){const n=[];for(let t=5;t<=60;t+=5)n.push({seconds:t,label:S(t)});for(let t=75;t<=300;t+=15)n.push({seconds:t,label:S(t)});return n}const X=10;function ee(n,t,o){const a=Math.max(1,Math.floor(o));return X+a*n+(a-1)*t}let $=null;function T(){return $||($=Q()),$}const e={workDuration:20,restDuration:10,totalRounds:8,timeRemaining:20,isRunning:!1,currentPhase:u.work,currentRound:1,status:i.setup,voiceEnabled:!0,beepsEnabled:!0,phaseEndsAtMs:null,phaseDurationMs:null,pausedPhaseRemainingMs:null};let R=null,D=null,h=null,w=null;function q(){try{l()}catch(n){console.error(n);const t=U();t&&(t.innerHTML=`
        <main class="card card--padded" aria-live="assertive">
          <h1 class="title">Could not start timer</h1>
          <p class="subtitle error-text">${String(n?.message??n)}</p>
          <p class="subtitle help-text">Try a hard refresh (clear cache) or run <code class="inline-code">npm run dev</code> from the project folder.</p>
        </main>
      `)}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",q):q();function ne(n){return n===u.countdown?"GET READY":n===u.work?"WORK":"REST"}function te(){return`
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M14 3.23v17.54c0 1.13-1.27 1.81-2.22 1.2L7.9 19H5a3 3 0 0 1-3-3v-4a3 3 0 0 1 3-3h2.9l3.88-3.97c.95-.61 2.22.07 2.22 1.2ZM16.5 8.5a1 1 0 0 1 1.41 0a6 6 0 0 1 0 8.49a1 1 0 1 1-1.41-1.41a4 4 0 0 0 0-5.66a1 1 0 0 1 0-1.42Zm2.83-2.83a1 1 0 0 1 1.41 0a10 10 0 0 1 0 14.14a1 1 0 1 1-1.41-1.41a8 8 0 0 0 0-11.32a1 1 0 0 1 0-1.41Z"/>
    </svg>
  `}function oe(){return`
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M14 3.23v17.54c0 1.13-1.27 1.81-2.22 1.2L7.9 19H5a3 3 0 0 1-3-3v-4a3 3 0 0 1 3-3h2.9l3.88-3.97c.95-.61 2.22.07 2.22 1.2Z"/>
      <path fill="currentColor" d="M17.59 8.59a1 1 0 0 1 1.41 0L21 10.59l1.99-2a1 1 0 1 1 1.42 1.42L22.41 12l2 1.99a1 1 0 0 1-1.42 1.42L21 13.41l-2 2a1 1 0 0 1-1.41-1.42L19.59 12l-2-1.99a1 1 0 0 1 0-1.42Z"/>
    </svg>
  `}function re(){return`
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm6-6V11a6 6 0 1 0-12 0v5L4 18v1h16v-1l-2-2Z"/>
    </svg>
  `}function se(){return`
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Z"/>
      <path fill="currentColor" d="M4 18v1h16v-1l-2-2V11c0-1.2-.35-2.32-.95-3.27l-1.5 1.5c.29.55.45 1.18.45 1.77v5.83l1.17 1.17H6.83L6 17.83V11c0-.64.14-1.25.4-1.8L4.9 7.7A5.96 5.96 0 0 0 4 11v5l-2 2Z"/>
      <path fill="currentColor" d="M3.29 4.71a1 1 0 0 1 1.42-1.42l16 16a1 1 0 1 1-1.42 1.42l-16-16Z"/>
    </svg>
  `}function M(){R!=null&&(clearInterval(R),R=null)}function ae(){M(),R=setInterval(()=>{!e.isRunning||e.status!==i.running||me()},1e3),ie()}function ie(){if(h!=null)return;const n=()=>{if(h=requestAnimationFrame(n),e.status!==i.running)return;const t=document.querySelector("#phaseBanner");if(!t)return;const o=ge();t.style.setProperty("--p",String(o))};h=requestAnimationFrame(n)}function Z(){h!=null&&(cancelAnimationFrame(h),h=null)}function k(n){e.status=n,e.isRunning=n===i.running,e.isRunning?(ae(),N()):(M(),Z(),I()),l()}function y(n,t){e.currentPhase=n,e.timeRemaining=t,e.phaseDurationMs=t*1e3,e.phaseEndsAtMs=Date.now()+e.phaseDurationMs,e.pausedPhaseRemainingMs=null,D=null,w=null}function x(){e.currentRound=1,y(u.countdown,10),k(i.running)}function ue(){e.status===i.running&&(b(),e.phaseEndsAtMs!=null&&(e.pausedPhaseRemainingMs=Math.max(0,e.phaseEndsAtMs-Date.now())),k(i.paused))}function ce(){e.status===i.paused&&(e.pausedPhaseRemainingMs!=null&&(e.phaseEndsAtMs=Date.now()+e.pausedPhaseRemainingMs,e.pausedPhaseRemainingMs=null),k(i.running))}function le(){M(),Z(),I(),b(),e.status=i.setup,e.isRunning=!1,e.currentRound=1,e.currentPhase=u.work,e.timeRemaining=e.workDuration,e.phaseEndsAtMs=null,e.phaseDurationMs=null,e.pausedPhaseRemainingMs=null,l()}function de(){k(i.done),e.timeRemaining=0,e.phaseEndsAtMs=null,e.phaseDurationMs=null,e.pausedPhaseRemainingMs=null,b(),l()}function fe(){e.beepsEnabled&&Y(),de(),e.voiceEnabled&&p("Done, nice job!")}function H({viaSkip:n}){const t=e.currentPhase,o=e.currentRound;return e.currentPhase===u.countdown?(e.currentRound=1,y(u.work,e.workDuration),n&&e.voiceEnabled&&p("Round one"),e.beepsEnabled&&A(),l(),{from:t,fromRound:o,next:u.work,done:!1,viaSkip:n}):e.currentPhase===u.work?e.currentRound===e.totalRounds?(fe(),{next:null,done:!0,viaSkip:n}):(y(u.rest,e.restDuration),e.beepsEnabled&&K(),e.voiceEnabled&&p("Rest"),l(),{from:t,fromRound:o,next:u.rest,done:!1,viaSkip:n}):(e.currentRound+=1,y(u.work,e.workDuration),n&&e.voiceEnabled&&(e.currentRound===e.totalRounds?p("Last Round"):p(`Round ${e.currentRound}`)),e.beepsEnabled&&A(),l(),{next:u.work,done:!1,viaSkip:n})}function pe(){if(!(e.status!==i.running&&e.status!==i.paused))return H({viaSkip:!0})}function me(){const n=e.timeRemaining;if(e.phaseEndsAtMs!=null){const t=Math.max(0,e.phaseEndsAtMs-Date.now()),o=e.phaseDurationMs??null,a=t>0&&t%1e3===0&&o!=null&&t!==o,r=Math.ceil(t/1e3)+(a?1:0);e.timeRemaining=r}if(he(n,e.timeRemaining),be(n,e.timeRemaining),e.timeRemaining>0){l();return}e.timeRemaining=0,H({viaSkip:!1})}function he(n,t){if(e.status!==i.running||!(e.currentPhase===u.countdown||e.currentPhase===u.rest)||!(n>0&&t<=0)&&!(t===0))return;const r=`${e.currentPhase}:${e.currentRound}:to-work`;if(w===r)return;if(e.currentPhase===u.countdown){w=r,e.voiceEnabled&&p("Round one");return}if(e.currentRound>=e.totalRounds)return;const s=e.currentRound+1;w=r,e.voiceEnabled&&(s===e.totalRounds?p("Last Round"):p(`Round ${s}`))}function ge(){if(e.status!==i.running||!e.phaseEndsAtMs||!e.phaseDurationMs)return 0;const n=Date.now(),o=(e.phaseDurationMs-Math.max(0,e.phaseEndsAtMs-n))/e.phaseDurationMs;return Math.max(0,Math.min(1,o))}function be(n,t){if(e.status===i.running)for(const o of[3,2,1]){if(!(n>o&&t<=o)&&!(t===o)||e.currentPhase===u.rest&&e.currentRound>=e.totalRounds)continue;const s=`${e.currentPhase}:${e.currentRound}:${o}`;D!==s&&(D=s,e.beepsEnabled&&_())}}function C({workDuration:n,restDuration:t,totalRounds:o}){e.workDuration=n,e.restDuration=t,e.totalRounds=o,e.status===i.setup&&(e.currentRound=1,e.currentPhase=u.work,e.timeRemaining=e.workDuration)}function l(){const n=U();if(!n)return;const t=e.status===i.setup?ve():Re();n.innerHTML=t,we()}function ve(){const n=ee(e.workDuration,e.restDuration,e.totalRounds),t=S(n);return`
    <main class="card" aria-label="Tabata timer setup">
      <div class="header">
        <div>
          <h1 class="title">Tabata Timer</h1>
          <p class="subtitle">Stage 1 — core timer</p>
        </div>
      </div>

      <div class="content">
        <div class="row">
          <label>
            Work
            <select id="workSelect" aria-label="Work duration">
              ${T().map(o=>`<option value="${o.seconds}" ${o.seconds===e.workDuration?"selected":""}>${o.label}</option>`).join("")}
            </select>
          </label>

          <label>
            Rest
            <select id="restSelect" aria-label="Rest duration">
              ${T().map(o=>`<option value="${o.seconds}" ${o.seconds===e.restDuration?"selected":""}>${o.label}</option>`).join("")}
            </select>
          </label>
        </div>

        <div class="field-gap" aria-hidden="true"></div>

        <label>
          Rounds
          <select id="roundsSelect" aria-label="Number of rounds">
            ${Array.from({length:20},(o,a)=>a+1).map(o=>`<option value="${o}" ${o===e.totalRounds?"selected":""}>${o}</option>`).join("")}
          </select>
        </label>

        <div class="actions">
          <button class="primary" id="startBtn" aria-label="Start workout, total time ${t}" type="button">Start · ${t}</button>
        </div>
      </div>
    </main>
  `}function Re(){const n=e.status===i.done,t=e.currentPhase===u.countdown,o=e.currentPhase===u.work,a=n?"doneTheme":t?"countdownTheme":o?"workTheme":"restTheme",r=n?"DONE":ne(e.currentPhase),s=n?`Completed ${e.totalRounds} round${e.totalRounds===1?"":"s"}`:t?"Starting in…":`Round ${e.currentRound} of ${e.totalRounds}`,c=n?"00:00":S(e.timeRemaining),d=e.status===i.running?"Pause":"Resume",v=n;return`
    <main class="card" aria-label="Tabata timer running">
      <div class="header">
        <div>
          <h1 class="title">Tabata Timer</h1>
          <p class="subtitle">${s}</p>
        </div>
        <div class="headerRight" aria-label="Audio controls">
          <button
            id="toggleVoiceBtn"
            class="iconBtn ${e.voiceEnabled?"":"isOff"}"
            type="button"
            aria-label="${e.voiceEnabled?"Mute voice":"Unmute voice"}"
            title="${e.voiceEnabled?"Mute voice":"Unmute voice"}"
          >
            ${e.voiceEnabled?te():oe()}
          </button>
          <button
            id="toggleBeepsBtn"
            class="iconBtn ${e.beepsEnabled?"":"isOff"}"
            type="button"
            aria-label="${e.beepsEnabled?"Mute beeps":"Unmute beeps"}"
            title="${e.beepsEnabled?"Mute beeps":"Unmute beeps"}"
          >
            ${e.beepsEnabled?re():se()}
          </button>
        </div>
      </div>

      <div class="run">
        <section id="phaseBanner" class="phaseBanner ${a}" aria-live="polite">
          <div class="phaseLabel">${r}</div>
          <div class="countdown" aria-label="Time remaining">${c}</div>
          <div class="progressTrack" aria-hidden="true">
            <div class="progressFill"></div>
          </div>
        </section>

        <div class="actions">
          ${n?"":`<button id="pauseResumeBtn" class="primary">${d}</button>`}
          ${v?'<button id="goAgainBtn" class="primary">Go again</button>':""}
          <button id="resetBtn" class="danger">Reset</button>
        </div>
      </div>
    </main>
  `}function we(){const n=document.querySelector("#startBtn");n&&n.addEventListener("click",()=>{G(),J();const f=document.querySelector("#workSelect"),W=document.querySelector("#restSelect"),V=document.querySelector("#roundsSelect"),z=Number(f?.value??e.workDuration),F=Number(W?.value??e.restDuration),j=Number(V?.value??e.totalRounds);C({workDuration:z,restDuration:F,totalRounds:j}),x()});const t=document.querySelector("#workSelect"),o=document.querySelector("#restSelect"),a=document.querySelector("#roundsSelect");if(t&&o&&a){const f=()=>{C({workDuration:Number(t.value),restDuration:Number(o.value),totalRounds:Number(a.value)}),l()};t.addEventListener("change",f),o.addEventListener("change",f),a.addEventListener("change",f)}const r=document.querySelector("#pauseResumeBtn");r&&r.addEventListener("click",()=>{e.status===i.running?ue():e.status===i.paused&&ce()});const s=document.querySelector("#resetBtn");s&&s.addEventListener("click",()=>{le()});const c=document.querySelector("#toggleVoiceBtn");c&&c.addEventListener("click",f=>{f.stopPropagation(),e.voiceEnabled=!e.voiceEnabled,e.voiceEnabled||b(),l()});const d=document.querySelector("#toggleBeepsBtn");d&&d.addEventListener("click",f=>{f.stopPropagation(),e.beepsEnabled=!e.beepsEnabled,l()});const v=document.querySelector("#goAgainBtn");v&&v.addEventListener("click",()=>{x()});const L=document.querySelector("#phaseBanner");L&&L.addEventListener("click",()=>{e.status!==i.done&&pe()})}window.addEventListener("beforeunload",()=>M());document.addEventListener("visibilitychange",()=>{document.visibilityState==="visible"&&e.status===i.running&&N()});
