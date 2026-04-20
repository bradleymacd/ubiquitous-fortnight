(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))i(r);new MutationObserver(r=>{for(const a of r)if(a.type==="childList")for(const c of a.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&i(c)}).observe(document,{childList:!0,subtree:!0});function s(r){const a={};return r.integrity&&(a.integrity=r.integrity),r.referrerPolicy&&(a.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?a.credentials="include":r.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function i(r){if(r.ep)return;r.ep=!0;const a=s(r);fetch(r.href,a)}})();let y=null,k=!1;function E(){if(!y){const n=window.AudioContext||window.webkitAudioContext;if(!n)return null;y=new n}return y}function W(){const n=E();if(!n)return!1;if(k)return!0;const t=n.createOscillator(),s=n.createGain();s.gain.value=0,t.frequency.value=440,t.connect(s),s.connect(n.destination);const i=n.currentTime;return t.start(i),t.stop(i+.005),k=!0,!0}function p({frequencyHz:n,durationMs:t,gain:s=.12,type:i="sine"}){const r=E();if(!r)return;r.state==="suspended"&&r.resume().catch(()=>{});const a=r.createOscillator(),c=r.createGain();a.type=i,a.frequency.value=n;const l=r.currentTime;c.gain.setValueAtTime(1e-4,l),c.gain.exponentialRampToValueAtTime(s,l+.01),c.gain.exponentialRampToValueAtTime(1e-4,l+t/1e3),a.connect(c),c.connect(r.destination),a.start(l),a.stop(l+t/1e3+.02)}function H(){p({frequencyHz:880,durationMs:100,gain:.14,type:"square"})}function M(){p({frequencyHz:660,durationMs:400,gain:.14,type:"sine"})}function F(){p({frequencyHz:440,durationMs:400,gain:.14,type:"sine"})}function z(){p({frequencyHz:523,durationMs:150,gain:.14,type:"sine"}),setTimeout(()=>p({frequencyHz:659,durationMs:150,gain:.14,type:"sine"}),170),setTimeout(()=>p({frequencyHz:784,durationMs:150,gain:.14,type:"sine"}),340)}let h=null;async function $(){try{return"wakeLock"in navigator?(h=await navigator.wakeLock.request("screen"),h):null}catch{return h=null,null}}function q(){try{h?.release?.()}catch{}finally{h=null}}const P=document.querySelector("#app"),u={countdown:"countdown",work:"work",rest:"rest"},o={setup:"setup",running:"running",paused:"paused",done:"done"},D=G(),e={workDuration:20,restDuration:10,totalRounds:8,timeRemaining:20,isRunning:!1,currentPhase:u.work,currentRound:1,status:o.setup,phaseEndsAtMs:null,phaseDurationMs:null,pausedPhaseRemainingMs:null};let g=null,b=null,m=null;d();function G(){const n=[];for(let t=5;t<=60;t+=5)n.push({seconds:t,label:S(t)});for(let t=75;t<=300;t+=15)n.push({seconds:t,label:S(t)});return n}function S(n){const t=Math.max(0,Math.floor(n)),s=String(Math.floor(t/60)).padStart(2,"0"),i=String(t%60).padStart(2,"0");return`${s}:${i}`}function U(n){return n===u.countdown?"GET READY":n===u.work?"WORK":"REST"}function R(){g!=null&&(clearInterval(g),g=null)}function j(){R(),g=setInterval(()=>{!e.isRunning||e.status!==o.running||X()},1e3),V()}function V(){if(m!=null)return;const n=()=>{if(m=requestAnimationFrame(n),e.status!==o.running)return;const t=document.querySelector("#phaseBanner");if(!t)return;const s=Z();t.style.setProperty("--p",String(s))};m=requestAnimationFrame(n)}function L(){m!=null&&(cancelAnimationFrame(m),m=null)}function v(n){e.status=n,e.isRunning=n===o.running,e.isRunning?(j(),$()):(R(),L(),q()),d()}function w(n,t){e.currentPhase=n,e.timeRemaining=t,e.phaseDurationMs=t*1e3,e.phaseEndsAtMs=Date.now()+e.phaseDurationMs,e.pausedPhaseRemainingMs=null,b=null}function T(){e.currentRound=1,w(u.countdown,10),v(o.running)}function K(){e.status===o.running&&(e.phaseEndsAtMs!=null&&(e.pausedPhaseRemainingMs=Math.max(0,e.phaseEndsAtMs-Date.now())),v(o.paused))}function _(){e.status===o.paused&&(e.pausedPhaseRemainingMs!=null&&(e.phaseEndsAtMs=Date.now()+e.pausedPhaseRemainingMs,e.pausedPhaseRemainingMs=null),v(o.running))}function Y(){R(),L(),q(),e.status=o.setup,e.isRunning=!1,e.currentRound=1,e.currentPhase=u.work,e.timeRemaining=e.workDuration,e.phaseEndsAtMs=null,e.phaseDurationMs=null,e.pausedPhaseRemainingMs=null,d()}function J(){v(o.done),e.timeRemaining=0,e.phaseEndsAtMs=null,e.phaseDurationMs=null,e.pausedPhaseRemainingMs=null,d()}function x({viaSkip:n}){const t=e.currentPhase,s=e.currentRound;return e.currentPhase===u.countdown?(e.currentRound=1,w(u.work,e.workDuration),M(),d(),{from:t,fromRound:s,next:u.work,done:!1,viaSkip:n}):e.currentPhase===u.work?(w(u.rest,e.restDuration),F(),d(),{from:t,fromRound:s,next:u.rest,done:!1,viaSkip:n}):e.currentRound>=e.totalRounds?(J(),z(),{next:null,done:!0,viaSkip:n}):(e.currentRound+=1,w(u.work,e.workDuration),M(),d(),{next:u.work,done:!1,viaSkip:n})}function Q(){if(!(e.status!==o.running&&e.status!==o.paused))return x({viaSkip:!0})}function X(){if(e.phaseEndsAtMs!=null){const n=Math.max(0,e.phaseEndsAtMs-Date.now()),t=Math.ceil(n/1e3);e.timeRemaining=t}if(ne(),e.timeRemaining>0){d();return}e.timeRemaining=0,x({viaSkip:!1})}function Z(){if(e.status!==o.running||!e.phaseEndsAtMs||!e.phaseDurationMs)return 0;const n=Date.now(),s=(e.phaseDurationMs-Math.max(0,e.phaseEndsAtMs-n))/e.phaseDurationMs;return Math.max(0,Math.min(1,s))}function ee(){return e.status!==o.running||e.timeRemaining>3||e.timeRemaining<1?!1:e.currentPhase===u.countdown||e.currentPhase===u.work?!0:e.currentPhase===u.rest?e.currentRound<e.totalRounds:!1}function ne(){if(!ee())return;const n=`${e.currentPhase}:${e.currentRound}:${e.timeRemaining}`;b!==n&&(b=n,H())}function A({workDuration:n,restDuration:t,totalRounds:s}){e.workDuration=n,e.restDuration=t,e.totalRounds=s,e.status===o.setup&&(e.currentRound=1,e.currentPhase=u.work,e.timeRemaining=e.workDuration)}function d(){if(!P)return;const n=e.status===o.setup?te():re();P.innerHTML=n,se()}function te(){return`
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
              ${D.map(n=>`<option value="${n.seconds}" ${n.seconds===e.workDuration?"selected":""}>${n.label}</option>`).join("")}
            </select>
          </label>

          <label>
            Rest
            <select id="restSelect" aria-label="Rest duration">
              ${D.map(n=>`<option value="${n.seconds}" ${n.seconds===e.restDuration?"selected":""}>${n.label}</option>`).join("")}
            </select>
          </label>
        </div>

        <div style="height: 12px;"></div>

        <label>
          Rounds
          <select id="roundsSelect" aria-label="Number of rounds">
            ${Array.from({length:20},(n,t)=>t+1).map(n=>`<option value="${n}" ${n===e.totalRounds?"selected":""}>${n}</option>`).join("")}
          </select>
        </label>

        <div class="actions">
          <button class="primary" id="startBtn">Start</button>
        </div>
      </div>
    </main>
  `}function re(){const n=e.status===o.done,t=e.currentPhase===u.countdown,s=e.currentPhase===u.work,i=n?"doneTheme":t?"countdownTheme":s?"workTheme":"restTheme",r=n?"DONE":U(e.currentPhase),a=n?`Completed ${e.totalRounds} round${e.totalRounds===1?"":"s"}`:t?"Starting in…":`Round ${e.currentRound} of ${e.totalRounds}`,c=n?"00:00":S(e.timeRemaining),l=e.status===o.running?"Pause":"Resume",f=n;return`
    <main class="card" aria-label="Tabata timer running">
      <div class="header">
        <div>
          <h1 class="title">Tabata Timer</h1>
          <p class="subtitle">${a}</p>
        </div>
      </div>

      <div class="run">
        <section id="phaseBanner" class="phaseBanner ${i}" aria-live="polite">
          <div class="phaseLabel">${r}</div>
          <div class="countdown" aria-label="Time remaining">${c}</div>
          <div class="progressTrack" aria-hidden="true">
            <div class="progressFill"></div>
          </div>
        </section>

        <div class="actions">
          ${n?"":`<button id="pauseResumeBtn" class="primary">${l}</button>`}
          ${f?'<button id="goAgainBtn" class="primary">Go again</button>':""}
          <button id="resetBtn" class="danger">Reset</button>
        </div>
      </div>
    </main>
  `}function se(){const n=document.querySelector("#startBtn");n&&n.addEventListener("click",()=>{W();const f=document.querySelector("#workSelect"),B=document.querySelector("#restSelect"),N=document.querySelector("#roundsSelect"),O=Number(f?.value??e.workDuration),C=Number(B?.value??e.restDuration),I=Number(N?.value??e.totalRounds);A({workDuration:O,restDuration:C,totalRounds:I}),T()});const t=document.querySelector("#workSelect"),s=document.querySelector("#restSelect"),i=document.querySelector("#roundsSelect");if(t&&s&&i){const f=()=>{A({workDuration:Number(t.value),restDuration:Number(s.value),totalRounds:Number(i.value)}),d()};t.addEventListener("change",f),s.addEventListener("change",f),i.addEventListener("change",f)}const r=document.querySelector("#pauseResumeBtn");r&&r.addEventListener("click",()=>{e.status===o.running?K():e.status===o.paused&&_()});const a=document.querySelector("#resetBtn");a&&a.addEventListener("click",()=>{Y()});const c=document.querySelector("#goAgainBtn");c&&c.addEventListener("click",()=>{T()});const l=document.querySelector("#phaseBanner");l&&l.addEventListener("click",()=>{e.status!==o.done&&Q()})}window.addEventListener("beforeunload",()=>R());document.addEventListener("visibilitychange",()=>{document.visibilityState==="visible"&&e.status===o.running&&$()});
