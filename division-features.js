(() => {
'use strict';
const KEY='division_play_stats_v1', REQUESTS='division_game_requests_v1';
const read=(key, fallback)=>{try{return JSON.parse(localStorage.getItem(key))||fallback}catch{return fallback}};
const save=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value))}catch{}};
const stats=read(KEY,{plays:{},unique:[]});
const gameId=new URLSearchParams(location.search).get('game');
if(document.body.dataset.page==='game' && gameId){
  stats.plays[gameId]=(stats.plays[gameId]||0)+1;
  if(!stats.unique.includes(gameId))stats.unique.push(gameId);
  stats.lastPlayed=gameId; stats.xp=stats.unique.length*10; save(KEY,stats);
}
const getCards=()=>[...document.querySelectorAll('#gameGrid a[href*="game.html?game="],.game-rail a[href*="game.html?game="],.for-you-grid a[href*="game.html?game="]')].filter((a,i,all)=>all.findIndex(b=>b.href===a.href)===i);
const titleOf=a=>a.querySelector('.game-name')?.textContent?.trim()||a.getAttribute('aria-label')?.replace(/^Play\s+/,'')||a.textContent.trim();
const idOf=a=>{try{return new URL(a.href,location.href).searchParams.get('game')}catch{return null}};
const rail=(title,id,cards)=>{if(!cards.length)return '';return '<section class="game-rail-section division-extra-section" id="'+id+'"><div class="section-head"><h2>'+title+'</h2></div><div class="game-rail division-extra-rail">'+cards.map(a=>a.outerHTML).join('')+'</div></section>'};
function addHomeFeatures(){
 const app=document.querySelector('#app'),home=app?.querySelector('.home-discovery');if(!home||home.dataset.extrasReady)return;
 const cards=getCards();if(!cards.length)return;home.dataset.extrasReady='1';
 const recentIds=read(KEY,{lastPlayed:null}).recent||[];
 const stored=read(KEY,{plays:{},recent:[]});
 const recent=(stored.recent||[]).map(id=>cards.find(a=>idOf(a)===id)).filter(Boolean).slice(0,10);
 const trending=[...cards].sort((a,b)=>(stored.plays?.[idOf(b)]||0)-(stored.plays?.[idOf(a)]||0)).slice(0,10);
 const section=document.createElement('div');section.className='division-extra-wrap';
 section.innerHTML=rail('Recently Played','division-recent',recent)+rail('Trending on Division','division-trending',trending);
 const explore=home.querySelector('#popular');if(explore)home.insertBefore(section,explore);else home.append(section);
 const quick=document.createElement('div');quick.className='division-quick-actions';
 quick.innerHTML='<button class="division-quick-btn" id="divisionRandom" type="button">✦ Random Game</button><button class="division-quick-btn" id="divisionRequestOpen" type="button">＋ Request a Game</button><div class="division-xp-card"><span class="division-xp-label">DIVISION XP</span><strong id="divisionXP">'+(stored.unique?.length||0)*10+'</strong><span class="division-xp-note">'+(stored.unique?.length||0)+' games played</span></div>';
 home.insertBefore(quick,home.firstChild);
 const modal=document.createElement('section');modal.className='division-request-panel';modal.id='divisionRequestPanel';modal.hidden=true;
 modal.innerHTML='<div class="division-request-head"><h2>Request a game</h2><button type="button" id="divisionRequestClose" aria-label="Close">×</button></div><p>Suggest a game for the Division library. Your request is saved on this device.</p><form id="divisionRequestForm"><input name="game" maxlength="90" placeholder="Game title" required><input name="link" type="url" placeholder="Official game or embed link (optional)"><textarea name="reason" maxlength="350" rows="3" placeholder="Why should we add it? (optional)"></textarea><button class="btn primary" type="submit">Save request</button><p class="division-request-status" aria-live="polite"></p></form><div class="division-request-list"></div>';
 home.insertBefore(modal,quick.nextSibling);
 const requestBtn=document.querySelector('#divisionRequestOpen');requestBtn?.addEventListener('click',()=>{modal.hidden=false;modal.scrollIntoView({behavior:'smooth',block:'center'})});
 document.querySelector('#divisionRequestClose')?.addEventListener('click',()=>modal.hidden=true);
 document.querySelector('#divisionRandom')?.addEventListener('click',()=>{const pool=cards.filter(a=>idOf(a));const pick=pool[Math.floor(Math.random()*pool.length)];if(pick)location.href=pick.href});
 const form=modal.querySelector('form'),list=modal.querySelector('.division-request-list'),status=modal.querySelector('.division-request-status');
 const showRequests=()=>{const requests=read(REQUESTS,[]);list.innerHTML=requests.length?'<h3>Your saved requests</h3>'+requests.slice().reverse().map(r=>'<p><strong>'+escapeHTML(r.game)+'</strong><small>'+new Date(r.date).toLocaleDateString()+'</small></p>').join(''):'<p class="muted">No saved requests yet.</p>'};
 form?.addEventListener('submit',e=>{e.preventDefault();const data=new FormData(form),name=String(data.get('game')||'').trim();if(!name)return;const requests=read(REQUESTS,[]);requests.push({game:name,link:String(data.get('link')||''),reason:String(data.get('reason')||''),date:new Date().toISOString()});save(REQUESTS,requests.slice(-50));form.reset();status.textContent='Saved on this device. It has not been sent to Division admin.';showRequests()});showRequests();
}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function trackRecent(){if(document.body.dataset.page!=='game'||!gameId)return;const s=read(KEY,{plays:{},unique:[]});s.recent=[gameId,...(s.recent||[]).filter(x=>x!==gameId)].slice(0,15);s.xp=(s.unique?.length||0)*10;save(KEY,s);const awards=[];if(s.unique.length>=1)awards.push('First Play');if(s.unique.length>=5)awards.push('Explorer');if(s.unique.length>=10)awards.push('Division Regular');if(s.unique.length>=25)awards.push('Game Master');const box=document.createElement('section');box.className='division-achievements panel';box.innerHTML='<h2>Division Achievements</h2><p><strong>'+s.xp+' XP</strong> · '+s.unique.length+' unique games played</p><div class="division-badges">'+[['First Play',1],['Explorer',5],['Division Regular',10],['Game Master',25]].map(([name,n])=>'<span class="division-achievement '+(s.unique.length>=n?'unlocked':'locked')+'">'+(s.unique.length>=n?'✓':'🔒')+' '+name+' <small>'+n+' games</small></span>').join('')+'</div>';const target=document.querySelector('.game-lower-layout');if(target&&!document.querySelector('.division-achievements'))target.after(box)}
function boot(){addHomeFeatures();trackRecent()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
const observer=new MutationObserver(()=>{if(document.body.dataset.page==='home')addHomeFeatures()});
observer.observe(document.querySelector('#app')||document.body,{childList:true,subtree:true});
})();