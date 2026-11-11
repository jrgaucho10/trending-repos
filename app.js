const LANGS = ["Swift","Python","TypeScript","JavaScript","Go","Rust","Java","Kotlin","C++","Ruby"];
const LANG_COLORS = { Swift:"#ff6b35", Python:"#3776ab", TypeScript:"#3178c6", JavaScript:"#f7df1e", Go:"#00add8", Rust:"#dea584", Java:"#b07219", Kotlin:"#7f52ff", "C++":"#f34b7d", Ruby:"#cc342d" };

let state = {
  period: "daily",
  tab: "trending",
  repos: [],
  loading: false,
  error: null,
  search: "",
  language: null,
  sort: "stars",
  demo: false,
  favorites: new Set(JSON.parse(localStorage.getItem("fav") || "[]")),
  favRepos: JSON.parse(localStorage.getItem("favRepos") || "{}"),
};
const cache = new Map();

const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

function sinceDate(days){ const d=new Date(); d.setDate(d.getDate()-days); return d.toISOString().slice(0,10); }
const PERIOD_DAYS = { daily:1, weekly:7, monthly:30 };

async function fetchTrending(period, lang){
  const key = period+"|"+(lang||"all");
  const cached = cache.get(key);
  if (cached && Date.now()-cached.t < 5*60*1000) return cached.data;
  const days = PERIOD_DAYS[period];
  let q = "created:>"+sinceDate(days);
  if (lang) q += " language:"+lang;
  const url = "https://api.github.com/search/repositories?q="+encodeURIComponent(q)+"&sort=stars&order=desc&per_page=30";
  // Try direct, then a CORS proxy (needed when opened from file:// or restricted origins)
  const attempts = [
    () => fetch(url, { headers: { "Accept":"application/vnd.github+json", "X-GitHub-Api-Version":"2022-11-28" } }),
    () => fetch("https://api.allorigins.win/raw?url="+encodeURIComponent(url)),
  ];
  let lastErr = null;
  for (const attempt of attempts) {
    try {
      const res = await attempt();
      if (!res.ok) { lastErr = new Error("GitHub returned "+res.status); continue; }
      const data = await res.json();
      const items = data.items || (Array.isArray(data) ? data : []);
      if (!items.length) { lastErr = new Error("No results"); continue; }
      cache.set(key, { t: Date.now(), data: items });
      return items;
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error("Failed to fetch");
}

function score(repo){
  const now = Date.now();
  const ageDays = Math.max(1, (now - new Date(repo.created_at).getTime())/86400000);
  let s = 0;
  s += Math.min(40, Math.log10(repo.stargazers_count+1)*8);
  s += Math.min(15, Math.log10(repo.forks_count+1)*6);
  s += Math.min(15, (repo.stargazers_count/ageDays)*1.5);
  if (repo.description) s += 5;
  if (repo.license) s += 5;
  if (repo.topics && repo.topics.length) s += 5;
  if (repo.language) s += 5;
  const pushed = repo.pushed_at ? new Date(repo.pushed_at).getTime() : 0;
  const daysSincePush = (now-pushed)/86400000;
  if (daysSincePush <= 7) s += 10; else if (daysSincePush <= 30) s += 5;
  if (repo.stargazers_count > 0 && repo.watchers_count/repo.stargazers_count > 0.05) s += 5;
  return Math.min(100, Math.max(0, Math.round(s)));
}
function tier(sc){ if (sc<40) return "low"; if (sc<70) return "medium"; if (sc<85) return "high"; return "top"; }
function tierName(sc){ if (sc<40) return "Low"; if (sc<70) return "Medium"; if (sc<85) return "High"; return "Top"; }

function fmt(n){ return n >= 1000 ? (n/1000).toFixed(1)+"k" : n; }

function saveFavs(){ localStorage.setItem("fav", JSON.stringify([...state.favorites])); localStorage.setItem("favRepos", JSON.stringify(state.favRepos)); }

const DEMO_REPOS = [
  { id:1, full_name:"facebook/react", name:"react", owner:{login:"facebook", avatar_url:"https://avatars.githubusercontent.com/u/69631?v=4"}, description:"A declarative, efficient, and flexible JavaScript library for building user interfaces.", html_url:"https://github.com/facebook/react", stargazers_count:230000, forks_count:47000, watchers_count:6800, open_issues_count:900, language:"JavaScript", created_at:new Date(Date.now()-86400000*2).toISOString(), updated_at:new Date().toISOString(), pushed_at:new Date().toISOString(), topics:["javascript","frontend","ui"], license:{name:"MIT", spdx_id:"MIT"}, default_branch:"main" },
  { id:2, full_name:"vercel/next.js", name:"next.js", owner:{login:"vercel", avatar_url:"https://avatars.githubusercontent.com/u/14985020?v=4"}, description:"The React Framework for the Web", html_url:"https://github.com/vercel/next.js", stargazers_count:128000, forks_count:27000, watchers_count:1600, open_issues_count:2800, language:"TypeScript", created_at:new Date(Date.now()-86400000*5).toISOString(), updated_at:new Date().toISOString(), pushed_at:new Date().toISOString(), topics:["react","ssr","framework"], license:{name:"MIT", spdx_id:"MIT"}, default_branch:"canary" },
  { id:3, full_name:"tailwindlabs/tailwindcss", name:"tailwindcss", owner:{login:"tailwindlabs", avatar_url:"https://avatars.githubusercontent.com/u/67109815?v=4"}, description:"A utility-first CSS framework for rapid UI development.", html_url:"https://github.com/tailwindlabs/tailwindcss", stargazers_count:85000, forks_count:4300, watchers_count:700, open_issues_count:50, language:"TypeScript", created_at:new Date(Date.now()-86400000*10).toISOString(), updated_at:new Date().toISOString(), pushed_at:new Date().toISOString(), topics:["css","tailwind"], license:{name:"MIT", spdx_id:"MIT"}, default_branch:"main" },
  { id:4, full_name:"sveltejs/svelte", name:"svelte", owner:{login:"sveltejs", avatar_url:"https://avatars.githubusercontent.com/u/23617963?v=4"}, description:"Cybernetically enhanced web apps", html_url:"https://github.com/sveltejs/svelte", stargazers_count:79000, forks_count:4100, watchers_count:900, open_issues_count:800, language:"JavaScript", created_at:new Date(Date.now()-86400000*3).toISOString(), updated_at:new Date().toISOString(), pushed_at:new Date().toISOString(), topics:["compiler","ui"], license:{name:"MIT", spdx_id:"MIT"}, default_branch:"main" },
  { id:5, full_name:"vuejs/core", name:"core", owner:{login:"vuejs", avatar_url:"https://avatars.githubusercontent.com/u/6128107?v=4"}, description:"The progressive JavaScript framework", html_url:"https://github.com/vuejs/core", stargazers_count:48000, forks_count:8400, watchers_count:1100, open_issues_count:600, language:"TypeScript", created_at:new Date(Date.now()-86400000*7).toISOString(), updated_at:new Date().toISOString(), pushed_at:new Date().toISOString(), topics:["vue","framework"], license:{name:"MIT", spdx_id:"MIT"}, default_branch:"main" },
];

async function load(){
  state.loading = true; state.error = null; render();
  try {
    state.repos = await fetchTrending(state.period, state.language);
    state.demo = false;
  } catch (e) {
    // Fallback to demo data so the app is never empty
    state.repos = DEMO_REPOS;
    state.demo = true;
    state.error = "Live fetch failed ("+e.message+"). Showing demo data. Host this page over HTTPS for live data.";
  }
  state.loading = false;
  render();
}

function filtered(){
  let base = state.repos;
  if (state.search) {
    const q = state.search.toLowerCase();
    base = base.filter(r => r.full_name.toLowerCase().includes(q) || (r.description||"").toLowerCase().includes(q) || (r.language||"").toLowerCase().includes(q));
  }
  if (state.sort === "stars") base = [...base].sort((a,b)=>b.stargazers_count-a.stargazers_count);
  else base = [...base].sort((a,b)=>score(b)-score(a));
  return base;
}

function langColor(l){ return LANG_COLORS[l] || "#888"; }

function cardHTML(repo){
  const sc = score(repo);
  const fav = state.favorites.has(repo.full_name);
  return `
  <div class="card" data-repo="${encodeURIComponent(repo.full_name)}">
    <img class="avatar" src="${repo.owner.avatar_url}" alt="" onerror="this.src=''" />
    <div class="card-body">
      <div class="card-title">${repo.full_name}</div>
      <div class="card-desc">${repo.description || ""}</div>
      <div class="card-meta">
        <span><span class="lang-dot" style="background:${langColor(repo.language)}"></span>${repo.language || "Unknown"}</span>
        <span class="star">★ ${fmt(repo.stargazers_count)}</span>
        <span>⑂ ${fmt(repo.forks_count)}</span>
      </div>
    </div>
    <button class="heart ${fav?'active':''}" data-fav="${encodeURIComponent(repo.full_name)}">${fav?'♥':'♡'}</button>
    <div class="badge ${tier(sc)}"><span class="score">${sc}</span><span class="tier">${tierName(sc)}</span></div>
  </div>`;
}

function render(){
  const list = $("#list"), loading = $("#loading"), empty = $("#empty"), err = $("#error");
  $("#demoBanner").hidden = !state.demo;
  loading.hidden = !state.loading;
  err.hidden = !state.error || state.loading;
  if (state.error) $("#errorMsg").textContent = state.error;

  if (state.loading) { list.innerHTML = ""; empty.hidden = true; return; }
  if (state.error) { list.innerHTML = ""; empty.hidden = true; return; }

  const data = state.tab === "favorites"
    ? Object.values(state.favRepos).filter(r => state.favorites.has(r.full_name))
    : filtered();

  if (!data.length) { list.innerHTML = ""; empty.hidden = false; return; }
  empty.hidden = true;
  list.innerHTML = data.map(cardHTML).join("");

  // click handlers
  list.querySelectorAll(".card").forEach(el => {
    el.addEventListener("click", (e) => {
      if (e.target.classList.contains("heart")) return;
      const name = decodeURIComponent(el.dataset.repo);
      const repo = state.repos.find(r=>r.full_name===name);
      if (repo) openDetail(repo);
    });
  });
  list.querySelectorAll(".heart").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const name = decodeURIComponent(btn.dataset.fav);
      if (state.favorites.has(name)) { state.favorites.delete(name); delete state.favRepos[name]; }
      else { state.favorites.add(name); const r = state.repos.find(x=>x.full_name===name); if (r) state.favRepos[name]=r; }
      saveFavs();
      render();
    });
  });
}

function openDetail(repo){
  const sc = score(repo);
  const fav = state.favorites.has(repo.full_name);
  $("#detailContent").innerHTML = `
    <div class="detail-header">
      <img src="${repo.owner.avatar_url}" alt="" />
      <div>
        <div class="detail-title">${repo.full_name}</div>
        <span class="lang-dot" style="background:${langColor(repo.language)}"></span> ${repo.language || "Unknown"}
      </div>
      <div class="badge ${tier(sc)}" style="margin-left:auto"><span class="score">${sc}</span><span class="tier">${tierName(sc)}</span></div>
    </div>
    <div class="detail-desc">${repo.description || "No description."}</div>
    <div class="stats-grid">
      <div class="stat-tile"><div class="v">★ ${fmt(repo.stargazers_count)}</div><div class="l">Stars</div></div>
      <div class="stat-tile"><div class="v">${fmt(repo.forks_count)}</div><div class="l">Forks</div></div>
      <div class="stat-tile"><div class="v">${fmt(repo.watchers_count)}</div><div class="l">Watchers</div></div>
      <div class="stat-tile"><div class="v">${fmt(repo.open_issues_count)}</div><div class="l">Open Issues</div></div>
    </div>
    <div class="detail-row"><span class="k">Created</span><span>${new Date(repo.created_at).toLocaleDateString()}</span></div>
    <div class="detail-row"><span class="k">Last Push</span><span>${repo.pushed_at ? new Date(repo.pushed_at).toLocaleDateString() : "—"}</span></div>
    <div class="detail-row"><span class="k">License</span><span>${repo.license ? repo.license.name : "None"}</span></div>
    <div class="detail-row"><span class="k">Default Branch</span><span>${repo.default_branch || "—"}</span></div>
    ${repo.topics && repo.topics.length ? `<div class="detail-row"><span class="k">Topics</span><span>${repo.topics.join(", ")}</span></div>` : ""}
    <a class="link-btn" href="${repo.html_url}" target="_blank" rel="noopener">Open on GitHub ↗</a>
    <button class="primary-btn" id="favToggle">${fav ? "Remove from Favorites" : "Add to Favorites"}</button>
  `;
  $("#detail").hidden = false;
  $("#favToggle").onclick = () => {
    if (state.favorites.has(repo.full_name)) { state.favorites.delete(repo.full_name); delete state.favRepos[repo.full_name]; }
    else { state.favorites.add(repo.full_name); state.favRepos[repo.full_name] = repo; }
    saveFavs(); $("#detail").hidden = true; render();
  };
}
$("#closeDetail").onclick = () => $("#detail").hidden = true;

// Tabs (period)
$$(".tab").forEach(t => t.addEventListener("click", () => {
  $$(".tab").forEach(x=>x.classList.remove("active"));
  t.classList.add("active");
  state.period = t.dataset.period;
  load();
}));

// Bottom nav
$$(".bnav").forEach(b => b.addEventListener("click", () => {
  $$(".bnav").forEach(x=>x.classList.remove("active"));
  b.classList.add("active");
  state.tab = b.dataset.tab;
  render();
}));

// Search
$("#search").addEventListener("input", (e) => { state.search = e.target.value; render(); });

// Filter
$("#filterBtn").onclick = () => {
  const list = $("#langList");
  list.innerHTML = `<button class="lang-chip ${!state.language?'active':''}" data-lang="">All Languages</button>` +
    LANGS.map(l => `<button class="lang-chip ${state.language===l?'active':''}" data-lang="${l}">${l}</button>`).join("");
  list.querySelectorAll(".lang-chip").forEach(c => c.onclick = () => {
    state.language = c.dataset.lang || null;
    $("#filterSheet").hidden = true;
    load();
  });
  $("#filterSheet").hidden = false;
};
$("#closeFilter").onclick = () => $("#filterSheet").hidden = true;

// Sort
$("#sortBtn").onclick = () => {
  $$(".sort-opt").forEach(o => o.classList.toggle("active", o.dataset.sort === state.sort));
  $("#sortSheet").hidden = false;
};
$$(".sort-opt").forEach(o => o.onclick = () => {
  state.sort = o.dataset.sort;
  $$(".sort-opt").forEach(x=>x.classList.remove("active"));
  o.classList.add("active");
});
$("#closeSort").onclick = () => $("#sortSheet").hidden = true;

// Retry
$("#retryBtn").onclick = load;

// Close sheets on backdrop
["filterSheet","sortSheet","detail"].forEach(id => {
  $("#"+id).addEventListener("click", (e) => { if (e.target.id === id) $("#"+id).hidden = true; });
});

load();
