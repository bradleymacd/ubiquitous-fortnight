(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))i(s);new MutationObserver(s=>{for(const o of s)if(o.type==="childList")for(const c of o.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&i(c)}).observe(document,{childList:!0,subtree:!0});function r(s){const o={};return s.integrity&&(o.integrity=s.integrity),s.referrerPolicy&&(o.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?o.credentials="include":s.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function i(s){if(s.ep)return;s.ep=!0;const o=r(s);fetch(s.href,o)}})();let b=null,D=!1;function x(){if(!b){const n=window.AudioContext||window.webkitAudioContext;if(!n)return null;b=new n}return b}function F(){const n=x();if(!n)return!1;if(D)return!0;const t=n.createOscillator(),r=n.createGain();r.gain.value=0,t.frequency.value=440,t.connect(r),r.connect(n.destination);const i=n.currentTime;return t.start(i),t.stop(i+.005),D=!0,!0}function m({frequencyHz:n,durationMs:t,gain:r=.12,type:i="sine"}){const s=x();if(!s)return;s.state==="suspended"&&s.resume().catch(()=>{});const o=s.createOscillator(),c=s.createGain();o.type=i,o.frequency.value=n;const l=s.currentTime;c.gain.setValueAtTime(1e-4,l),c.gain.exponentialRampToValueAtTime(r,l+.01),c.gain.exponentialRampToValueAtTime(1e-4,l+t/1e3),o.connect(c),c.connect(s.destination),o.start(l),o.stop(l+t/1e3+.02)}function G(){m({frequencyHz:880,durationMs:100,gain:.14,type:"square"})}function T(){m({frequencyHz:660,durationMs:400,gain:.14,type:"sine"})}function j(){m({frequencyHz:440,durationMs:400,gain:.14,type:"sine"})}function Z(){m({frequencyHz:523,durationMs:150,gain:.14,type:"sine"}),setTimeout(()=>m({frequencyHz:659,durationMs:150,gain:.14,type:"sine"}),170),setTimeout(()=>m({frequencyHz:784,durationMs:150,gain:.14,type:"sine"}),340)}let g=null;async function B(){try{return"wakeLock"in navigator?(g=await navigator.wakeLock.request("screen"),g):null}catch{return g=null,null}}function C(){try{g?.release?.()}catch{}finally{g=null}}let A=!1;function V(){if(!("speechSynthesis"in window))return!1;if(A)return!0;try{const n=new SpeechSynthesisUtterance("");return n.lang="en-US",window.speechSynthesis.speak(n),A=!0,!0}catch{return!1}}function v(){try{window.speechSynthesis?.cancel?.()}catch{}}function f(n){if("speechSynthesis"in window&&n)try{v();const t=new SpeechSynthesisUtterance(n);t.lang="en-US",t.rate=1.1,t.pitch=1,t.volume=1,window.speechSynthesis.speak(t)}catch{}}const $=document.querySelector("#app"),a={countdown:"countdown",work:"work",rest:"rest"},u={setup:"setup",running:"running",paused:"paused",done:"done"},E=K(),e={workDuration:20,restDuration:10,totalRounds:8,timeRemaining:20,isRunning:!1,currentPhase:a.work,currentRound:1,status:u.setup,phaseEndsAtMs:null,phaseDurationMs:null,pausedPhaseRemainingMs:null};let R=null,M=null,h=null,w=null;d();function K(){const n=[];for(let t=5;t<=60;t+=5)n.push({seconds:t,label:P(t)});for(let t=75;t<=300;t+=15)n.push({seconds:t,label:P(t)});return n}function P(n){const t=Math.max(0,Math.floor(n)),r=String(Math.floor(t/60)).padStart(2,"0"),i=String(t%60).padStart(2,"0");return`${r}:${i}`}function _(n){return n===a.countdown?"GET READY":n===a.work?"WORK":"REST"}function S(){R!=null&&(clearInterval(R),R=null)}function Y(){S(),R=setInterval(()=>{!e.isRunning||e.status!==u.running||re()},1e3),J()}function J(){if(h!=null)return;const n=()=>{if(h=requestAnimationFrame(n),e.status!==u.running)return;const t=document.querySelector("#phaseBanner");if(!t)return;const r=ue();t.style.setProperty("--p",String(r))};h=requestAnimationFrame(n)}function N(){h!=null&&(cancelAnimationFrame(h),h=null)}function k(n){e.status=n,e.isRunning=n===u.running,e.isRunning?(Y(),B()):(S(),N(),C()),d()}function y(n,t){e.currentPhase=n,e.timeRemaining=t,e.phaseDurationMs=t*1e3,e.phaseEndsAtMs=Date.now()+e.phaseDurationMs,e.pausedPhaseRemainingMs=null,M=null,w=null}function q(){e.currentRound=1,y(a.countdown,10),k(u.running)}function Q(){e.status===u.running&&(v(),e.phaseEndsAtMs!=null&&(e.pausedPhaseRemainingMs=Math.max(0,e.phaseEndsAtMs-Date.now())),k(u.paused))}function X(){e.status===u.paused&&(e.pausedPhaseRemainingMs!=null&&(e.phaseEndsAtMs=Date.now()+e.pausedPhaseRemainingMs,e.pausedPhaseRemainingMs=null),k(u.running))}function ee(){S(),N(),C(),v(),e.status=u.setup,e.isRunning=!1,e.currentRound=1,e.currentPhase=a.work,e.timeRemaining=e.workDuration,e.phaseEndsAtMs=null,e.phaseDurationMs=null,e.pausedPhaseRemainingMs=null,d()}function ne(){k(u.done),e.timeRemaining=0,e.phaseEndsAtMs=null,e.phaseDurationMs=null,e.pausedPhaseRemainingMs=null,v(),d()}function te(){Z(),ne(),f("Done, nice job!")}function O({viaSkip:n}){const t=e.currentPhase,r=e.currentRound;return e.currentPhase===a.countdown?(e.currentRound=1,y(a.work,e.workDuration),n&&f("Round one"),T(),d(),{from:t,fromRound:r,next:a.work,done:!1,viaSkip:n}):e.currentPhase===a.work?e.currentRound===e.totalRounds?(te(),{next:null,done:!0,viaSkip:n}):(y(a.rest,e.restDuration),j(),f("Rest"),d(),{from:t,fromRound:r,next:a.rest,done:!1,viaSkip:n}):(e.currentRound+=1,y(a.work,e.workDuration),n&&(e.currentRound===e.totalRounds?f("Last Round"):f(`Round ${e.currentRound}`)),T(),d(),{next:a.work,done:!1,viaSkip:n})}function se(){if(!(e.status!==u.running&&e.status!==u.paused))return O({viaSkip:!0})}function re(){const n=e.timeRemaining;if(e.phaseEndsAtMs!=null){const t=Math.max(0,e.phaseEndsAtMs-Date.now()),r=e.phaseDurationMs??null,i=t>0&&t%1e3===0&&r!=null&&t!==r,s=Math.ceil(t/1e3)+(i?1:0);e.timeRemaining=s}if(oe(n,e.timeRemaining),ae(n,e.timeRemaining),e.timeRemaining>0){d();return}e.timeRemaining=0,O({viaSkip:!1})}function oe(n,t){if(e.status!==u.running||!(e.currentPhase===a.countdown||e.currentPhase===a.rest)||!(n>0&&t<=0)&&!(t===0))return;const s=`${e.currentPhase}:${e.currentRound}:to-work`;if(w===s)return;if(e.currentPhase===a.countdown){w=s,f("Round one");return}if(e.currentRound>=e.totalRounds)return;const o=e.currentRound+1;w=s,o===e.totalRounds?f("Last Round"):f(`Round ${o}`)}function ue(){if(e.status!==u.running||!e.phaseEndsAtMs||!e.phaseDurationMs)return 0;const n=Date.now(),r=(e.phaseDurationMs-Math.max(0,e.phaseEndsAtMs-n))/e.phaseDurationMs;return Math.max(0,Math.min(1,r))}function ae(n,t){if(e.status===u.running)for(const r of[3,2,1]){if(!(n>r&&t<=r)&&!(t===r)||e.currentPhase===a.rest&&e.currentRound>=e.totalRounds)continue;const o=`${e.currentPhase}:${e.currentRound}:${r}`;M!==o&&(M=o,G())}}function L({workDuration:n,restDuration:t,totalRounds:r}){e.workDuration=n,e.restDuration=t,e.totalRounds=r,e.status===u.setup&&(e.currentRound=1,e.currentPhase=a.work,e.timeRemaining=e.workDuration)}function d(){if(!$)return;const n=e.status===u.setup?ie():ce();$.innerHTML=n,le()}function ie(){return`
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
              ${E.map(n=>`<option value="${n.seconds}" ${n.seconds===e.workDuration?"selected":""}>${n.label}</option>`).join("")}
            </select>
          </label>

          <label>
            Rest
            <select id="restSelect" aria-label="Rest duration">
              ${E.map(n=>`<option value="${n.seconds}" ${n.seconds===e.restDuration?"selected":""}>${n.label}</option>`).join("")}
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
  `}function ce(){const n=e.status===u.done,t=e.currentPhase===a.countdown,r=e.currentPhase===a.work,i=n?"doneTheme":t?"countdownTheme":r?"workTheme":"restTheme",s=n?"DONE":_(e.currentPhase),o=n?`Completed ${e.totalRounds} round${e.totalRounds===1?"":"s"}`:t?"Starting in…":`Round ${e.currentRound} of ${e.totalRounds}`,c=n?"00:00":P(e.timeRemaining),l=e.status===u.running?"Pause":"Resume",p=n;return`
    <main class="card" aria-label="Tabata timer running">
      <div class="header">
        <div>
          <h1 class="title">Tabata Timer</h1>
          <p class="subtitle">${o}</p>
        </div>
      </div>

      <div class="run">
        <section id="phaseBanner" class="phaseBanner ${i}" aria-live="polite">
          <div class="phaseLabel">${s}</div>
          <div class="countdown" aria-label="Time remaining">${c}</div>
          <div class="progressTrack" aria-hidden="true">
            <div class="progressFill"></div>
          </div>
        </section>

        <div class="actions">
          ${n?"":`<button id="pauseResumeBtn" class="primary">${l}</button>`}
          ${p?'<button id="goAgainBtn" class="primary">Go again</button>':""}
          <button id="resetBtn" class="danger">Reset</button>
        </div>
      </div>
    </main>
  `}function le(){const n=document.querySelector("#startBtn");n&&n.addEventListener("click",()=>{F(),V();const p=document.querySelector("#workSelect"),I=document.querySelector("#restSelect"),U=document.querySelector("#roundsSelect"),W=Number(p?.value??e.workDuration),H=Number(I?.value??e.restDuration),z=Number(U?.value??e.totalRounds);L({workDuration:W,restDuration:H,totalRounds:z}),q()});const t=document.querySelector("#workSelect"),r=document.querySelector("#restSelect"),i=document.querySelector("#roundsSelect");if(t&&r&&i){const p=()=>{L({workDuration:Number(t.value),restDuration:Number(r.value),totalRounds:Number(i.value)}),d()};t.addEventListener("change",p),r.addEventListener("change",p),i.addEventListener("change",p)}const s=document.querySelector("#pauseResumeBtn");s&&s.addEventListener("click",()=>{e.status===u.running?Q():e.status===u.paused&&X()});const o=document.querySelector("#resetBtn");o&&o.addEventListener("click",()=>{ee()});const c=document.querySelector("#goAgainBtn");c&&c.addEventListener("click",()=>{q()});const l=document.querySelector("#phaseBanner");l&&l.addEventListener("click",()=>{e.status!==u.done&&se()})}window.addEventListener("beforeunload",()=>S());document.addEventListener("visibilitychange",()=>{document.visibilityState==="visible"&&e.status===u.running&&B()});
