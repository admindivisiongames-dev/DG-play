(() => {
'use strict';

const KEY = 'division_play_stats_v1';
const REQUESTS = 'division_game_requests_v1';

const read = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
};
const save = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Division could not save local game stats:', error);
  }
};
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

const page = document.body.dataset.page;
const gameId = new URLSearchParams(location.search).get('game');
let trackedGameId = '';

function getCards() {
  return [...document.querySelectorAll(
    '#gameGrid a[href*="game.html?game="], .game-rail a[href*="game.html?game="], .for-you-grid a[href*="game.html?game="]'
  )].filter((link, index, all) => all.findIndex(other => other.href === link.href) === index);
}
const idOf = link => {
  try { return new URL(link.href, location.href).searchParams.get('game'); }
  catch { return null; }
};
const rail = (heading, id, cards) => {
  if (!cards.length) return '';
  return '<section class="game-rail-section division-extra-section" id="' + id + '">' +
    '<div class="section-head"><h2>' + heading + '</h2></div>' +
    '<div class="game-rail division-extra-rail">' + cards.map(link => link.outerHTML).join('') + '</div></section>';
};

function addHomeFeatures() {
  const app = document.querySelector('#app');
  const home = app?.querySelector('.home-discovery');
  if (!home || home.dataset.extrasReady) return;

  const cards = getCards();
  if (!cards.length) return;
  home.dataset.extrasReady = '1';

  const stored = read(KEY, { plays: {}, unique: [], recent: [] });
  const localRecent = read('division_recent_games', []);
  const recentIds = [...new Set([
    ...(Array.isArray(localRecent) ? localRecent : []),
    ...(Array.isArray(stored.recent) ? stored.recent : [])
  ])].slice(0, 12);
  const recent = recentIds
    .map(id => cards.find(link => idOf(link) === String(id))).filter(Boolean).slice(0, 8);
  const trending = [...cards].sort((a, b) =>
    (stored.plays?.[idOf(b)] || 0) - (stored.plays?.[idOf(a)] || 0)
  ).slice(0, 10);

  const extraSections = document.createElement('div');
  extraSections.className = 'division-extra-wrap';
  extraSections.innerHTML = rail('Trending on Division', 'division-trending', trending);

  // Populate the single Recently Played section already in the homepage template.
  const recentNode = home.querySelector('#recently-played') || document.createElement('section');
  recentNode.className = 'game-rail-section recently-played-section';
  recentNode.id = 'recently-played';
  recentNode.innerHTML =
    '<div class="section-head"><h2>Recently Played</h2></div>' +
    (recent.length
      ? '<div class="recently-played-grid">' + recent.map(link => link.outerHTML).join('') + '</div>'
      : '<div class="recent-empty"><p>Play a game and it’ll show up here.</p></div>');
  const quickActions = home.querySelector('.division-quick-actions');
  const requestPanel = home.querySelector('.division-request-panel');
  if (requestPanel) requestPanel.insertAdjacentElement('afterend', recentNode);
  else if (quickActions) quickActions.insertAdjacentElement('afterend', recentNode);
  else home.insertBefore(recentNode, home.firstChild);

  const explore = home.querySelector('#popular');
  if (explore) {
    explore.insertAdjacentElement('beforebegin', extraSections);
  } else {
    home.append(extraSections);
  }

  const quick = document.createElement('div');
  quick.className = 'division-quick-actions';
  const uniqueCount = Array.isArray(stored.unique) ? stored.unique.length : 0;
  quick.innerHTML =
    '<button class="division-quick-btn" id="divisionRandom" type="button">✦ Random Game</button>' +
    '<button class="division-quick-btn" id="divisionRequestOpen" type="button">＋ Request a Game</button>' +
    '<div class="division-xp-card"><span class="division-xp-label">XP</span>' +
    '<strong id="divisionXP">0</strong></div>';
  const xpClient = window.divisionSupabase;
  if (xpClient) xpClient.auth.getUser().then(({data}) => {
    const active = data && data.user;
    if (!active) return;
    return xpClient.from('player_xp').select('xp').eq('user_id', active.id).maybeSingle().then(({data: xpRow, error}) => {
      const node = document.getElementById('divisionXP');
      if (node && !error) node.textContent = Number(xpRow?.xp || 0).toLocaleString();
    });
  }).catch(error => console.warn('Division XP sync unavailable:', error));
  home.insertBefore(quick, home.firstChild);

  const modal = document.createElement('section');
  modal.className = 'division-request-panel';
  modal.id = 'divisionRequestPanel';
  modal.hidden = true;
  modal.innerHTML =
    '<div class="division-request-head"><h2>Request a game</h2>' +
    '<button type="button" id="divisionRequestClose" aria-label="Close">×</button></div>' +
    '<p>Suggest a game for the Division library. Your request is saved on this device.</p>' +
    '<form id="divisionRequestForm">' +
    '<input name="game" maxlength="90" placeholder="Game title" required>' +
    '<input name="link" type="url" placeholder="Official game or embed link (optional)">' +
    '<textarea name="reason" maxlength="350" rows="3" placeholder="Why should we add it? (optional)"></textarea>' +
    '<button class="btn primary" type="submit">Save request</button>' +
    '<p class="division-request-status" aria-live="polite"></p></form>' +
    '<div class="division-request-list"></div>';
  home.insertBefore(modal, quick.nextSibling);

  quick.querySelector('#divisionRequestOpen')?.addEventListener('click', () => {
    modal.hidden = false;
    modal.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  quick.querySelector('#divisionRandom')?.addEventListener('click', () => {
    const pool = cards.filter(link => idOf(link));
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (pick) location.href = pick.href;
  });
  modal.querySelector('#divisionRequestClose')?.addEventListener('click', () => {
    modal.hidden = true;
  });

  const form = modal.querySelector('form');
  const list = modal.querySelector('.division-request-list');
  const status = modal.querySelector('.division-request-status');
  const showRequests = () => {
    const requests = read(REQUESTS, []);
    list.innerHTML = requests.length
      ? '<h3>Your saved requests</h3>' + requests.slice().reverse().map(request =>
          '<p><strong>' + escapeHTML(request.game) + '</strong><small>' +
          escapeHTML(new Date(request.date).toLocaleDateString()) + '</small></p>'
        ).join('')
      : '<p class="muted">No saved requests yet.</p>';
  };

  form?.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get('game') || '').trim();
    if (!name) return;
    const requests = read(REQUESTS, []);
    requests.push({
      game: name,
      link: String(data.get('link') || '').trim(),
      reason: String(data.get('reason') || '').trim(),
      date: new Date().toISOString()
    });
    save(REQUESTS, requests.slice(-50));
    form.reset();
    status.textContent = 'Saved on this device. It has not been sent to Division admin.';
    showRequests();
  });
  showRequests();
}

function trackRecent() {
  if (page !== 'game' || !gameId || trackedGameId === gameId) return;

  // Only count a published game after the real player iframe has rendered.
  // The app initially renders a loading/invalid state before Supabase returns.
  const player = document.querySelector('.game-player-card .game-iframe');
  if (!player || !player.getAttribute('src')) return;

  const stored = read(KEY, { plays: {}, unique: [], recent: [] });
  const stats = {
    plays: stored.plays && typeof stored.plays === 'object' ? stored.plays : {},
    unique: Array.isArray(stored.unique) ? stored.unique : [],
    recent: Array.isArray(stored.recent) ? stored.recent : []
  };

  stats.plays[gameId] = (Number(stats.plays[gameId]) || 0) + 1;
  if (!stats.unique.includes(gameId)) stats.unique.push(gameId);
  stats.recent = [gameId, ...stats.recent.filter(id => id !== gameId)].slice(0, 15);
  stats.lastPlayed = gameId;
  stats.xp = stats.unique.length * 10;
  save(KEY, stats);
  trackedGameId = gameId;

  const awards = [
    ['First Play', 1],
    ['Explorer', 5],
    ['Division Regular', 10],
    ['Game Master', 25]
  ];
  const box = document.createElement('section');
  box.className = 'division-achievements panel';
  box.innerHTML =
    '<h2>Division Achievements</h2><p><strong>' + stats.xp +
    ' XP</strong> · ' + stats.unique.length + ' unique games played</p>' +
    '<div class="division-badges">' + awards.map(([name, threshold]) =>
      '<span class="division-achievement ' +
      (stats.unique.length >= threshold ? 'unlocked' : 'locked') + '">' +
      (stats.unique.length >= threshold ? '✓' : '🔒') + ' ' + name +
      ' <small>' + threshold + ' games</small></span>'
    ).join('') + '</div>';

  const target = document.querySelector('.game-lower-layout');
  if (target && !document.querySelector('.division-achievements')) target.after(box);
}

function boot() {
  addHomeFeatures();
  trackRecent();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

const observer = new MutationObserver(boot);
observer.observe(document.querySelector('#app') || document.body, {
  childList: true,
  subtree: true
});
})();