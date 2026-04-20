(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))a(r);new MutationObserver(r=>{for(const o of r)if(o.type==="childList")for(const c of o.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&a(c)}).observe(document,{childList:!0,subtree:!0});function u(r){const o={};return r.integrity&&(o.integrity=r.integrity),r.referrerPolicy&&(o.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?o.credentials="include":r.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function a(r){if(r.ep)return;r.ep=!0;const o=u(r);fetch(r.href,o)}})();let v=null,y=!1;function $(){if(!v){const t=window.AudioContext||window.webkitAudioContext;if(!t)return null;v=new t}return v}function C(){const t=$();if(!t)return!1;if(y)return!0;const n=t.createOscillator(),u=t.createGain();u.gain.value=0,n.frequency.value=440,n.connect(u),u.connect(t.destination);const a=t.currentTime;return n.start(a),n.stop(a+.005),y=!0,!0}function f({frequencyHz:t,durationMs:n,gain:u=.12,type:a="sine"}){const r=$();if(!r)return;r.state==="suspended"&&r.resume().catch(()=>{});const o=r.createOscillator(),c=r.createGain();o.type=a,o.frequency.value=t;const l=r.currentTime;c.gain.setValueAtTime(1e-4,l),c.gain.exponentialRampToValueAtTime(u,l+.01),c.gain.exponentialRampToValueAtTime(1e-4,l+n/1e3),o.connect(c),c.connect(r.destination),o.start(l),o.stop(l+n/1e3+.02)}function N(){f({frequencyHz:880,durationMs:100,gain:.14,type:"square"})}function b(){f({frequencyHz:660,durationMs:400,gain:.14,type:"sine"})}function A(){f({frequencyHz:440,durationMs:400,gain:.14,type:"sine"})}function M(){f({frequencyHz:523,durationMs:150,gain:.14,type:"sine"}),setTimeout(()=>f({frequencyHz:659,durationMs:150,gain:.14,type:"sine"}),170),setTimeout(()=>f({frequencyHz:784,durationMs:150,gain:.14,type:"sine"}),340)}let m=null;async function D(){try{return"wakeLock"in navigator?(m=await navigator.wakeLock.request("screen"),m):null}catch{return m=null,null}}function q(){try{m?.release?.()}catch{}finally{m=null}}const k=document.querySelector("#app"),i={countdown:"countdown",work:"work",rest:"rest"},s={setup:"setup",running:"running",paused:"paused",done:"done"},S=W(),e={workDuration:20,restDuration:10,totalRounds:8,timeRemaining:20,isRunning:!1,currentPhase:i.work,currentRound:1,status:s.setup};let g=null,T=null;d();function W(){const t=[];for(let n=5;n<=60;n+=5)t.push({seconds:n,label:w(n)});for(let n=75;n<=300;n+=15)t.push({seconds:n,label:w(n)});return t}function w(t){const n=Math.max(0,Math.floor(t)),u=String(Math.floor(n/60)).padStart(2,"0"),a=String(n%60).padStart(2,"0");return`${u}:${a}`}function I(t){return t===i.countdown?"GET READY":t===i.work?"WORK":"REST"}function R(){g!=null&&(clearInterval(g),g=null)}function H(){R(),g=setInterval(()=>{!e.isRunning||e.status!==s.running||K()},1e3)}function h(t){e.status=t,e.isRunning=t===s.running,e.isRunning?(H(),D()):(R(),q()),d()}function z(){e.currentRound=1,e.currentPhase=i.countdown,e.timeRemaining=10,h(s.running)}function G(){e.status===s.running&&h(s.paused)}function U(){e.status===s.paused&&h(s.running)}function j(){R(),q(),e.status=s.setup,e.isRunning=!1,e.currentRound=1,e.currentPhase=i.work,e.timeRemaining=e.workDuration,d()}function F(){h(s.done),e.timeRemaining=0,d()}function L({viaSkip:t}){const n=e.currentPhase,u=e.currentRound;return e.currentPhase===i.countdown?(e.currentPhase=i.work,e.currentRound=1,e.timeRemaining=e.workDuration,b(),d(),{from:n,fromRound:u,next:i.work,done:!1,viaSkip:t}):e.currentPhase===i.work?(e.currentPhase=i.rest,e.timeRemaining=e.restDuration,A(),d(),{from:n,fromRound:u,next:i.rest,done:!1,viaSkip:t}):e.currentRound>=e.totalRounds?(F(),M(),{next:null,done:!0,viaSkip:t}):(e.currentRound+=1,e.currentPhase=i.work,e.timeRemaining=e.workDuration,b(),d(),{next:i.work,done:!1,viaSkip:t})}function V(){if(!(e.status!==s.running&&e.status!==s.paused))return L({viaSkip:!0})}function K(){if(e.timeRemaining>0&&(e.timeRemaining-=1),Y(),e.timeRemaining>0){d();return}e.timeRemaining=0,L({viaSkip:!1})}function _(){return e.status!==s.running||e.timeRemaining>3||e.timeRemaining<1?!1:e.currentPhase===i.countdown||e.currentPhase===i.work?!0:e.currentPhase===i.rest?e.currentRound<e.totalRounds:!1}function Y(){if(!_())return;const t=`${e.currentPhase}:${e.currentRound}:${e.timeRemaining}`;T!==t&&(T=t,N())}function P({workDuration:t,restDuration:n,totalRounds:u}){e.workDuration=t,e.restDuration=n,e.totalRounds=u,e.status===s.setup&&(e.currentRound=1,e.currentPhase=i.work,e.timeRemaining=e.workDuration)}function d(){if(!k)return;const t=e.status===s.setup?J():Q();k.innerHTML=t,X()}function J(){return`
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
              ${S.map(t=>`<option value="${t.seconds}" ${t.seconds===e.workDuration?"selected":""}>${t.label}</option>`).join("")}
            </select>
          </label>

          <label>
            Rest
            <select id="restSelect" aria-label="Rest duration">
              ${S.map(t=>`<option value="${t.seconds}" ${t.seconds===e.restDuration?"selected":""}>${t.label}</option>`).join("")}
            </select>
          </label>
        </div>

        <div style="height: 12px;"></div>

        <label>
          Rounds
          <select id="roundsSelect" aria-label="Number of rounds">
            ${Array.from({length:20},(t,n)=>n+1).map(t=>`<option value="${t}" ${t===e.totalRounds?"selected":""}>${t}</option>`).join("")}
          </select>
        </label>

        <div class="actions">
          <button class="primary" id="startBtn">Start</button>
        </div>
      </div>
    </main>
  `}function Q(){const t=e.status===s.done,n=e.currentPhase===i.countdown,u=e.currentPhase===i.work,a=t?"doneTheme":n?"countdownTheme":u?"workTheme":"restTheme",r=t?"DONE":I(e.currentPhase),o=t?`Completed ${e.totalRounds} round${e.totalRounds===1?"":"s"}`:n?"Starting in…":`Round ${e.currentRound} of ${e.totalRounds}`,c=t?"00:00":w(e.timeRemaining),l=e.status===s.running?"Pause":"Resume",p=t;return`
    <main class="card" aria-label="Tabata timer running">
      <div class="header">
        <div>
          <h1 class="title">Tabata Timer</h1>
          <p class="subtitle">${o}</p>
        </div>
      </div>

      <div class="run">
        <section id="phaseBanner" class="phaseBanner ${a}" aria-live="polite">
          <div class="phaseLabel">${r}</div>
          <div class="countdown" aria-label="Time remaining">${c}</div>
          <div class="meta">
            <span>${t?"Workout complete":n?"Get ready":u?"Work phase":"Rest phase"}</span>
            <span>${t?"":e.status===s.paused?"Paused":"Running"}</span>
          </div>
        </section>

        <div class="actions">
          <button id="pauseResumeBtn" class="primary" ${p?"disabled":""} ${p?"disabled":""}>${l}</button>
          <button id="resetBtn" class="danger">Reset</button>
        </div>
      </div>
    </main>
  `}function X(){const t=document.querySelector("#startBtn");t&&t.addEventListener("click",()=>{C();const l=document.querySelector("#workSelect"),p=document.querySelector("#restSelect"),x=document.querySelector("#roundsSelect"),B=Number(l?.value??e.workDuration),E=Number(p?.value??e.restDuration),O=Number(x?.value??e.totalRounds);P({workDuration:B,restDuration:E,totalRounds:O}),z()});const n=document.querySelector("#workSelect"),u=document.querySelector("#restSelect"),a=document.querySelector("#roundsSelect");if(n&&u&&a){const l=()=>{P({workDuration:Number(n.value),restDuration:Number(u.value),totalRounds:Number(a.value)}),d()};n.addEventListener("change",l),u.addEventListener("change",l),a.addEventListener("change",l)}const r=document.querySelector("#pauseResumeBtn");r&&r.addEventListener("click",()=>{e.status===s.running?G():e.status===s.paused&&U()});const o=document.querySelector("#resetBtn");o&&o.addEventListener("click",()=>{j()});const c=document.querySelector("#phaseBanner");c&&c.addEventListener("click",()=>{e.status!==s.done&&V()})}window.addEventListener("beforeunload",()=>R());document.addEventListener("visibilitychange",()=>{document.visibilityState==="visible"&&e.status===s.running&&D()});
