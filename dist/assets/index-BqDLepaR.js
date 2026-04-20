(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))u(r);new MutationObserver(r=>{for(const o of r)if(o.type==="childList")for(const a of o.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&u(a)}).observe(document,{childList:!0,subtree:!0});function i(r){const o={};return r.integrity&&(o.integrity=r.integrity),r.referrerPolicy&&(o.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?o.credentials="include":r.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function u(r){if(r.ep)return;r.ep=!0;const o=i(r);fetch(r.href,o)}})();const R=document.querySelector("#app"),c={work:"work",rest:"rest"},s={setup:"setup",running:"running",paused:"paused",done:"done"},b=$(),e={workDuration:20,restDuration:10,totalRounds:8,timeRemaining:20,isRunning:!1,currentPhase:c.work,currentRound:1,status:s.setup};let m=null;l();function $(){const t=[];for(let n=5;n<=60;n+=5)t.push({seconds:n,label:v(n)});for(let n=75;n<=300;n+=15)t.push({seconds:n,label:v(n)});return t}function v(t){const n=Math.max(0,Math.floor(t)),i=String(Math.floor(n/60)).padStart(2,"0"),u=String(n%60).padStart(2,"0");return`${i}:${u}`}function y(t){return t===c.work?"WORK":"REST"}function p(){m!=null&&(clearInterval(m),m=null)}function D(){p(),m=setInterval(()=>{!e.isRunning||e.status!==s.running||O()},1e3)}function f(t){e.status=t,e.isRunning=t===s.running,e.isRunning?D():p(),l()}function T(){e.currentRound=1,e.currentPhase=c.work,e.timeRemaining=e.workDuration,f(s.running)}function P(){e.status===s.running&&f(s.paused)}function L(){e.status===s.paused&&f(s.running)}function E(){p(),e.status=s.setup,e.isRunning=!1,e.currentRound=1,e.currentPhase=c.work,e.timeRemaining=e.workDuration,l()}function N(){f(s.done),e.timeRemaining=0,l()}function O(){if(e.timeRemaining>0){e.timeRemaining-=1,l();return}if(e.currentPhase===c.work){e.currentPhase=c.rest,e.timeRemaining=e.restDuration,l();return}if(e.currentRound>=e.totalRounds){N();return}e.currentRound+=1,e.currentPhase=c.work,e.timeRemaining=e.workDuration,l()}function g({workDuration:t,restDuration:n,totalRounds:i}){e.workDuration=t,e.restDuration=n,e.totalRounds=i,e.status===s.setup&&(e.currentRound=1,e.currentPhase=c.work,e.timeRemaining=e.workDuration)}function l(){if(!R)return;const t=e.status===s.setup?q():B();R.innerHTML=t,I()}function q(){return`
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
              ${b.map(t=>`<option value="${t.seconds}" ${t.seconds===e.workDuration?"selected":""}>${t.label}</option>`).join("")}
            </select>
          </label>

          <label>
            Rest
            <select id="restSelect" aria-label="Rest duration">
              ${b.map(t=>`<option value="${t.seconds}" ${t.seconds===e.restDuration?"selected":""}>${t.label}</option>`).join("")}
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
  `}function B(){const t=e.status===s.done,n=e.currentPhase===c.work,i=t?"doneTheme":n?"workTheme":"restTheme",u=t?"DONE":y(e.currentPhase),r=t?`Completed ${e.totalRounds} round${e.totalRounds===1?"":"s"}`:`Round ${e.currentRound} of ${e.totalRounds}`,o=t?"00:00":v(e.timeRemaining),a=e.status===s.running?"Pause":"Resume",d=t;return`
    <main class="card" aria-label="Tabata timer running">
      <div class="header">
        <div>
          <h1 class="title">Tabata Timer</h1>
          <p class="subtitle">${r}</p>
        </div>
      </div>

      <div class="run">
        <section class="phaseBanner ${i}" aria-live="polite">
          <div class="phaseLabel">${u}</div>
          <div class="countdown" aria-label="Time remaining">${o}</div>
          <div class="meta">
            <span>${t?"Workout complete":n?"Work phase":"Rest phase"}</span>
            <span>${t?"":e.status===s.paused?"Paused":"Running"}</span>
          </div>
        </section>

        <div class="actions">
          <button id="pauseResumeBtn" class="primary" ${d?"disabled":""} ${d?"disabled":""}>${a}</button>
          <button id="resetBtn" class="danger">Reset</button>
        </div>
      </div>
    </main>
  `}function I(){const t=document.querySelector("#startBtn");t&&t.addEventListener("click",()=>{const a=document.querySelector("#workSelect"),d=document.querySelector("#restSelect"),h=document.querySelector("#roundsSelect"),S=Number(a?.value??e.workDuration),w=Number(d?.value??e.restDuration),k=Number(h?.value??e.totalRounds);g({workDuration:S,restDuration:w,totalRounds:k}),T()});const n=document.querySelector("#workSelect"),i=document.querySelector("#restSelect"),u=document.querySelector("#roundsSelect");if(n&&i&&u){const a=()=>{g({workDuration:Number(n.value),restDuration:Number(i.value),totalRounds:Number(u.value)}),l()};n.addEventListener("change",a),i.addEventListener("change",a),u.addEventListener("change",a)}const r=document.querySelector("#pauseResumeBtn");r&&r.addEventListener("click",()=>{e.status===s.running?P():e.status===s.paused&&L()});const o=document.querySelector("#resetBtn");o&&o.addEventListener("click",()=>{E()})}window.addEventListener("beforeunload",()=>p());
