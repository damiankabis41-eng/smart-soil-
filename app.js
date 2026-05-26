/**
 * SmartSoil+ | app.js
 * ─────────────────────────────────────────────────────────────────
 * MAIN APPLICATION CONTROLLER
 *
 * Responsibilities:
 *   - Application state (APP)
 *   - Page navigation
 *   - UI rendering (reads from SIM, calls diagnostics, renders UI)
 *   - Farmer/Expert mode
 *   - Language switching
 *   - Crop/soil switching
 *   - Notification system
 *   - Mobile sidebar
 *   - Loading states
 *   - Clock
 * ─────────────────────────────────────────────────────────────────
 */

'use strict';

// ── APPLICATION STATE ─────────────────────────────────────────────
const APP = {
  lang:      'en',
  mode:      'expert',
  crop:      'tomato',
  soilClass: 'SOIL02',
  activePage:'dashboard',
};

// ── CLOCK ─────────────────────────────────────────────────────────
function startClock() {
  function update() {
    const now = new Date();
    const str = now.toLocaleTimeString('en-GB', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    setEl('clock', str);
  }
  update();
  setInterval(update, 1000);
}

// ── PAGE NAVIGATION ───────────────────────────────────────────────
function showPage(pageId, navEl) {
  // Prevent double-tap lag on mobile
  APP.activePage = pageId;

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pg = document.getElementById('page-' + pageId);
  if (pg) {
    pg.classList.add('active');
    pg.scrollTop = 0;
  }

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (navEl) navEl.classList.add('active');

  // Page title
  const titleKey = 'nav_' + pageId;
  setEl('page-title', t(titleKey) || pageId);

  // Close sidebar on mobile immediately
  closeSidebar();

  // Render page content
  renderAll();

  // Charts with slight delay for layout
  requestAnimationFrame(() => {
    setTimeout(drawAllCharts, 60);
  });
}

// ── SIDEBAR ───────────────────────────────────────────────────────
function toggleSidebar() {
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('overlay');
  const isOpen   = sidebar.classList.contains('open');
  sidebar.classList.toggle('open', !isOpen);
  overlay.classList.toggle('open', !isOpen);
  // Prevent body scroll when sidebar open on mobile
  document.body.style.overflow = isOpen ? '' : 'hidden';
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ── LANGUAGE SWITCH ───────────────────────────────────────────────
function setLang(lang) {
  APP.lang      = lang;
  window._lang  = lang;
  document.documentElement.lang = lang;
  document.getElementById('btn-en').classList.toggle('active', lang === 'en');
  document.getElementById('btn-sw').classList.toggle('active', lang === 'sw');
  renderAll();
  showNotif(lang === 'sw' ? '🇹🇿 Kiswahili kimewashwa' : '🇬🇧 English activated', 'green');
}

// ── MODE SWITCH ───────────────────────────────────────────────────
function setMode(mode) {
  APP.mode = mode;
  document.body.classList.toggle('farmer-mode', mode === 'farmer');
  document.getElementById('btn-expert').classList.toggle('active', mode === 'expert');
  document.getElementById('btn-farmer').classList.toggle('active', mode === 'farmer');
  renderAll();
  showNotif(t(mode === 'farmer' ? 'mode_farmer_on' : 'mode_expert_on'), 'green');
}

// ── CROP SWITCH ───────────────────────────────────────────────────
function setCrop(cropKey) {
  APP.crop = cropKey;
  // Update tab styles
  ['maize','tomato','onion'].forEach(c => {
    document.getElementById('crop-' + c)?.classList.toggle('active', c === cropKey);
  });
  const cName = APP.lang === 'sw' ? CROPS[cropKey].name_sw : CROPS[cropKey].name_en;
  showNotif(t('crop_switched', cName), 'green');
  renderAll();
  requestAnimationFrame(() => setTimeout(drawAllCharts, 60));
}

// ── MAIN RENDER ───────────────────────────────────────────────────
// Called on every tick, language change, crop change, mode change
function renderAll() {
  renderTopBar();
  renderSidebarLabels();
  renderCropContext();
  renderKPIs();
  renderSensors();
  renderDiagnosticsPanel();
  renderFarmerCards();
  renderRecommendations();
  renderSCIPanel();
  renderYieldPanel();
  renderClimatePanel();
  renderPrototypeDisclosure();
  updateAlertBadge();
}

// ── onSimTick — called by simulation.js every tick ────────────────
function onSimTick() {
  renderAll();
  drawAllCharts();
}

// ── TOP BAR ───────────────────────────────────────────────────────
function renderTopBar() {
  const crop   = CROPS[APP.crop];
  const cName  = APP.lang === 'sw' ? crop.name_sw : crop.name_en;
  setEl('plot-badge-top', `${crop.emoji} ${cName} — ${SYS.plot}`);
  setEl('page-title', t('nav_' + APP.activePage) || APP.activePage);
}

// ── SIDEBAR LABELS ────────────────────────────────────────────────
function renderSidebarLabels() {
  // Update all [data-key] translation elements
  document.querySelectorAll('[data-tkey]').forEach(el => {
    const key = el.dataset.tkey;
    const val = t(key);
    if (val) el.textContent = val;
  });
  // Update crop label
  setEl('crop-label-text', t('crop_label'));
  setEl('system-status-text', t('system_online'));
}

// ── CROP CONTEXT BAR ──────────────────────────────────────────────
function renderCropContext() {
  const crop   = CROPS[APP.crop];
  const stage  = getCropStage(APP.crop, SIM._dayOfSeason);
  const lang   = APP.lang;
  const cName  = lang === 'sw' ? crop.name_sw : crop.name_en;
  const cStage = lang === 'sw' ? stage.name_sw : stage.name_en;

  setEl('ctx-icon',   crop.emoji);
  setEl('ctx-name',   `${cName} (${crop.id})`);
  setEl('ctx-detail', `${lang==='sw'?'Hatua ya Ukuaji':'Growth Stage'}: ${cStage} · Day ${SIM._dayOfSeason} · ${lang==='sw'?'Mahitaji':'Demand'}: ${crop.demand_mm[0]}–${crop.demand_mm[1]}mm`);

  const soil = SOILS[APP.soilClass];
  const thr  = crop.drought_flag + soil.drought_adjust;
  const el   = document.getElementById('ctx-thresholds');
  if (el) {
    el.innerHTML = [
      `${lang==='sw'?'Bora':'Optimal'}: <span>${crop.fc_optimal[0]}–${crop.fc_optimal[1]}%</span>`,
      `${lang==='sw'?'Ukame':'Drought'}: <span>&lt;${thr}%</span>`,
      `${lang==='sw'?'Mafuriko':'Waterlog'}: <span>&gt;${crop.waterlog_pct}% &gt;${crop.waterlog_hrs}h</span>`,
    ].map(s => `<div class="crop-threshold-tag">${s}</div>`).join('');
  }
}

// ── KPI CARDS ─────────────────────────────────────────────────────
function renderKPIs() {
  const crop   = CROPS[APP.crop];
  const stage  = getCropStage(APP.crop, SIM._dayOfSeason);
  const lang   = APP.lang;
  const m      = Math.round(SIM.moisture * 10) / 10;
  const cName  = lang === 'sw' ? crop.name_sw : crop.name_en;
  const cStage = lang === 'sw' ? stage.name_sw : stage.name_en;

  // ── Moisture ──
  const mColor = moistureColor(m);
  const mCard  = m < crop.drought_flag ? 'status-danger' : m > crop.waterlog_pct ? 'status-danger' : m < crop.fc_optimal[0] || m > crop.fc_optimal[1] ? 'status-warning' : 'status-ok';
  setElHTML('kpi-moisture', `${m}<span style="font-size:18px;opacity:.5">%</span>`);
  setElStyle('kpi-moisture', 'color', mColor);
  setCardClass('kpi-card-moisture', mCard);
  setEl('kpi-moisture-fc', `${m}${t('field_capacity')}`);
  setEl('kpi-moisture-label', t('kpi_moisture'));

  // WHY box
  let whyText;
  if      (m < crop.drought_flag)  whyText = t('moisture_drought',   m, cName, cStage, crop.drought_flag + SOILS[APP.soilClass].drought_adjust);
  else if (m > crop.waterlog_pct)  whyText = t('moisture_waterlog',  m, cName, cStage, crop.fc_optimal[1]);
  else if (m < crop.fc_optimal[0] + 8) whyText = t('moisture_approaching', m, cName, crop.drought_flag);
  else                             whyText = t('moisture_optimal',   m, cName, cStage, crop.fc_optimal[0], crop.fc_optimal[1]);
  setEl('kpi-moisture-why-text', whyText);

  // ── Temperature ──
  const temp = Math.round(SIM.temp * 10) / 10;
  setElHTML('kpi-temp', `${temp}<span style="font-size:18px;opacity:.5">°C</span>`);
  setEl('kpi-moisture-label', t('kpi_moisture'));

  const etiCatStr = SIM.eti < ETI.LOW.max ? (lang==='sw'?'Chini':'Low') : SIM.eti < ETI.MODERATE.max ? (lang==='sw'?'Wastani':'Moderate') : (lang==='sw'?'Juu':'High');
  setEl('kpi-eti-label', t('kpi_eti', etiCatStr));

  let tempWhy;
  if      (temp > 33) tempWhy = t('temp_high', temp, cName);
  else if (temp > 27) tempWhy = t('temp_mod',  temp, cName);
  else                tempWhy = t('temp_low',  temp, cName);
  setEl('kpi-temp-why-text', tempWhy);

  // ── SCI ──
  const sciColor = SIM.sciScore > 70 ? '#2EA862' : SIM.sciScore > 40 ? '#F5A623' : '#FF6B6B';
  setElHTML('kpi-sci', `${SIM.sciScore}<span style="font-size:18px;opacity:.5">/100</span>`);
  setElStyle('kpi-sci', 'color', sciColor);
  const sciLblKey = SIM.sciScore > 70 ? 'sci_high' : SIM.sciScore > 40 ? 'sci_medium' : 'sci_low';
  setEl('kpi-sci-label', t(sciLblKey));

  // ── Yield risk ──
  const yrColor = SIM.yieldRisk > 20 ? '#FF6B6B' : SIM.yieldRisk > 10 ? '#F5A623' : '#2EA862';
  setElHTML('kpi-yield-risk', `${SIM.yieldRisk}<span style="font-size:18px;opacity:.5">%</span>`);
  setElStyle('kpi-yield-risk', 'color', yrColor);

  let yrCause = '';
  let yrWhy   = '';
  if (m > crop.waterlog_pct) {
    yrCause = lang==='sw' ? 'Msongo wa maji mengi' : 'Saturation stress';
    yrWhy   = t('yield_waterlog', m, cName, cStage, `${crop.yield_waterlog[0]}–${crop.yield_waterlog[1]}`);
  } else if (m < crop.drought_flag) {
    yrCause = lang==='sw' ? 'Msongo wa ukame' : 'Drought stress';
    yrWhy   = t('yield_drought',  m, cName, cStage, `${crop.yield_drought[0]}–${crop.yield_drought[1]}`);
  } else {
    yrCause = lang==='sw' ? 'Wastani — masalia ya msongo' : 'Moderate — residual stress';
    yrWhy   = t('yield_ok', m, cName);
  }
  setEl('kpi-yield-cause', yrCause);
  setEl('kpi-yield-why',   yrWhy);

  // Yield big (on yield page)
  setElHTML('yield-risk-big', `${SIM.yieldRisk}<span style="font-size:18px">%</span>`);
  setElStyle('yield-risk-big', 'color', yrColor);
  setEl('yield-cause-detail', yrCause);

  // Dashboard subtitle
  const cNameU = cName.toUpperCase();
  const sub    = `${SYS.plot} · ${SYS.location} · ${cNameU}`;
  setEl('dash-sub', sub);
  setEl('dash-sub-expert', sub);
}

// ── SENSORS ───────────────────────────────────────────────────────
function renderSensors() {
  setEl('sv-m1',       Math.round(SIM.moisture));
  setEl('sv-m2',       Math.round(SIM.moisture_20));
  setEl('sv-hum',      Math.round(SIM.humidity));
  setEl('sv-soil-temp',Math.round(SIM.soilTemp * 10) / 10);
  setEl('sv-temp2',    Math.round(SIM.soilTemp * 10) / 10);
  setEl('sv-ec',       SIM.ec.toFixed(2));
  setEl('ec-display',  SIM.ec.toFixed(2) + ' dS/m');

  // Sensor bars
  const crop  = CROPS[APP.crop];
  const mCol  = moistureColor(SIM.moisture);
  setSensorBar('bar-m1',  SIM.moisture,    mCol);
  setSensorBar('bar-m2',  SIM.moisture_20, mCol);
  setSensorBar('bar-hum', SIM.humidity,    '#2B7FD4');
  setSensorBar('bar-ec',  Math.min(100, SIM.ec / 3 * 100), '#9B59B6');

  // Ring gauge center text
  setEl('ring-m1-val', Math.round(SIM.moisture)    + '%');
  setEl('ring-m2-val', Math.round(SIM.moisture_20) + '%');
  setEl('ring-hum-val',Math.round(SIM.humidity)    + '%');

  // Ring WHY
  const lang  = APP.lang;
  const m     = Math.round(SIM.moisture);
  const cName = lang === 'sw' ? crop.name_sw : crop.name_en;
  const stage = getCropStage(APP.crop, SIM._dayOfSeason);
  const cStage = lang === 'sw' ? stage.name_sw : stage.name_en;
  let rwhy;
  if      (m < crop.drought_flag) rwhy = t('moisture_drought',   m, cName, cStage, crop.drought_flag);
  else if (m > crop.waterlog_pct) rwhy = t('moisture_waterlog',  m, cName, cStage, crop.fc_optimal[1]);
  else                            rwhy = t('moisture_optimal',   m, cName, cStage, crop.fc_optimal[0], crop.fc_optimal[1]);
  setEl('ring-m1-why', rwhy);
}

// ── DIAGNOSTICS PANEL ─────────────────────────────────────────────
function renderDiagnosticsPanel() {
  const diags    = runDiagnostics();
  const dashList = document.getElementById('dash-alerts');
  const fullList = document.getElementById('diagnostics-list');

  const html = (items, maxItems) => items.slice(0, maxItems).map(d => `
    <div class="alert-item ${d.severity}" role="alert">
      <div class="alert-dot" aria-hidden="true"></div>
      <div style="flex:1;min-width:0">
        <div class="alert-title">${escHtml(d.title)}</div>
        <div class="alert-desc">${escHtml(d.desc)}</div>
        <div class="alert-why ${d.severity === 'critical' ? 'danger-border' : d.severity === 'warning' ? 'warn-border' : ''}">${escHtml(d.why)}</div>
        <div class="alert-fix">${escHtml(d.fix)}</div>
        <div class="alert-time">${escHtml(d.time)}</div>
        ${APP.mode === 'expert' && d.factors ? `
          <details style="margin-top:8px;">
            <summary style="font-family:var(--font-mono);font-size:9px;color:var(--fog);cursor:pointer;opacity:0.6;">
              ${APP.lang==='sw'?'Sababu za kiufundi':'Contributing factors'}
            </summary>
            <div style="margin-top:5px;padding:6px 8px;background:rgba(0,0,0,0.2);border-radius:6px;">
              ${d.factors.map(f => `<div style="font-family:var(--font-mono);font-size:9px;color:var(--mist);opacity:0.6;line-height:1.8;">${escHtml(f)}</div>`).join('')}
            </div>
          </details>` : ''}
      </div>
    </div>`).join('');

  if (dashList) dashList.innerHTML = html(diags, 3);
  if (fullList) fullList.innerHTML = html(diags, 10);
}

// ── FARMER CARDS ──────────────────────────────────────────────────
function renderFarmerCards() {
  const container = document.getElementById('farmer-cards-container');
  if (!container) return;
  const crop  = CROPS[APP.crop];
  const lang  = APP.lang;
  const m     = Math.round(SIM.moisture);
  const cName = lang === 'sw' ? crop.name_sw : crop.name_en;

  let statusTitle, statusAction, bgColor, borderColor;
  if (m < crop.drought_flag) {
    statusTitle  = t('farmer_drought_title');
    statusAction = t('farmer_drought_action', cName);
    bgColor      = 'rgba(224,52,52,0.12)';
    borderColor  = 'rgba(224,52,52,0.35)';
  } else if (m > crop.waterlog_pct) {
    statusTitle  = t('farmer_waterlog_title');
    statusAction = t('farmer_waterlog_action', cName);
    bgColor      = 'rgba(245,166,35,0.12)';
    borderColor  = 'rgba(245,166,35,0.35)';
  } else {
    statusTitle  = t('farmer_ok_title');
    statusAction = t('farmer_ok_action', cName);
    bgColor      = 'rgba(46,168,98,0.12)';
    borderColor  = 'rgba(46,168,98,0.35)';
  }

  const sciLabel = SIM.sciScore > 70
    ? t('farmer_sci_good')
    : SIM.sciScore > 40 ? t('farmer_sci_medium')
    : t('farmer_sci_low');

  container.innerHTML = `
    <div class="farmer-card" style="background:linear-gradient(135deg,${bgColor},rgba(20,32,25,0.95));border:2px solid ${borderColor};border-radius:16px;padding:22px;margin-bottom:14px;">
      <div style="font-size:40px;margin-bottom:10px;">${m < crop.drought_flag ? '🚨' : m > crop.waterlog_pct ? '⚠️' : '✅'}</div>
      <div style="font-family:var(--font-head);font-size:20px;font-weight:800;color:var(--cream);margin-bottom:8px;">${escHtml(statusTitle)}</div>
      <div style="font-size:14px;color:var(--mist);line-height:1.7;margin-bottom:14px;">${escHtml(statusAction)}</div>
      <button class="fc-btn" onclick="triggerIrrigation()" aria-label="${lang==='sw'?'Simula Umwagiliaji':'Simulate Irrigation'}">
        💧 ${lang==='sw'?'Simula Umwagiliaji':'Simulate Irrigation'}
      </button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">
      <div class="farmer-card" style="background:rgba(20,32,25,0.85);border:1px solid rgba(46,168,98,0.25);border-radius:14px;padding:18px;text-align:center;">
        <div style="font-size:32px;">💧</div>
        <div style="font-family:var(--font-head);font-size:22px;font-weight:800;color:${moistureColor(m)};margin:4px 0;">
          ${m < crop.drought_flag ? (lang==='sw'?'KAVU':'DRY') : m > crop.waterlog_pct ? (lang==='sw'?'MAJI MENGI':'SATURATED') : (lang==='sw'?'VIZURI':'GOOD')}
        </div>
        <div style="font-size:11px;color:var(--mist);opacity:0.6;">${lang==='sw'?'Unyevu wa Udongo':'Soil Moisture'}</div>
      </div>
      <div class="farmer-card" style="background:rgba(20,32,25,0.85);border:1px solid rgba(46,168,98,0.25);border-radius:14px;padding:18px;text-align:center;">
        <div style="font-size:32px;">🌡️</div>
        <div style="font-family:var(--font-head);font-size:22px;font-weight:800;color:var(--amber);margin:4px 0;">${Math.round(SIM.temp)}°C</div>
        <div style="font-size:11px;color:var(--mist);opacity:0.6;">${lang==='sw'?'Joto la Hewa':'Air Temperature'}</div>
      </div>
    </div>
    <div class="farmer-card" style="background:rgba(20,32,25,0.85);border:1px solid rgba(46,168,98,0.2);border-radius:14px;padding:18px;margin-bottom:12px;">
      <div style="font-size:28px;margin-bottom:6px;">🌱</div>
      <div style="font-family:var(--font-head);font-size:16px;font-weight:700;color:var(--cream);margin-bottom:6px;">${escHtml(sciLabel)}</div>
      <div style="font-size:13px;color:var(--mist);line-height:1.6;">${escHtml(t('farmer_sci_desc', SIM.sciScore))}</div>
    </div>
    <div class="farmer-card" style="background:rgba(20,32,25,0.85);border:1px solid rgba(224,52,52,0.2);border-radius:14px;padding:18px;">
      <div style="font-size:28px;margin-bottom:6px;">📉</div>
      <div style="font-family:var(--font-head);font-size:22px;font-weight:800;color:${SIM.yieldRisk>15?'var(--crimson)':'var(--amber)'};margin-bottom:6px;">
        ${SIM.yieldRisk}% ${lang==='sw'?'HATARI':'RISK'}
      </div>
      <div style="font-size:13px;color:var(--mist);line-height:1.6;">${escHtml(t('farmer_yield_desc', SIM.yieldRisk))}</div>
    </div>`;
}

// ── RECOMMENDATIONS ───────────────────────────────────────────────
function renderRecommendations() {
  const crop   = CROPS[APP.crop];
  const lang   = APP.lang;
  const m      = Math.round(SIM.moisture);
  const cName  = lang === 'sw' ? crop.name_sw : crop.name_en;
  const ecDrop = SIM._ecPreIrrigation > 0
    ? Math.max(0, 1 - SIM.ec / SIM._ecPreIrrigation) : 0.18;

  const recSub = document.querySelector('#page-recommendations .page-header-sub');
  if (recSub) recSub.textContent =
    lang === 'sw'
      ? `KULINGANA NA ${cName.toUpperCase()} · UDONGO · HALI YA HEWA`
      : `CROP-SPECIFIC: ${cName.toUpperCase()} · SOIL-ADJUSTED · CLIMATE-AWARE`;

  const recList = document.getElementById('rec-list');
  if (!recList) return;

  const recs = [
    {
      priority: 'high',
      title:    t('rec_title_reduce', cName),
      body:     t('rec_body_reduce',  m, crop.fc_optimal[1]),
      class:    'danger-rec',
    },
    {
      priority: 'medium',
      title:    t('rec_title_split'),
      body:     t('rec_body_split', ecDrop),
      class:    'warn-rec',
    },
    {
      priority: 'low',
      title:    t('rec_title_timing'),
      body:     t('rec_body_timing'),
      class:    '',
    },
  ];

  recList.innerHTML = recs.map((r, i) => `
    <div class="rec-card ${r.class}">
      <div class="rec-priority ${r.priority}">
        ${r.priority==='high' ? (lang==='sw'?'⚠ KIPAUMBELE KIKUBWA — FANYA LEO':'⚠ HIGH PRIORITY — ACT TODAY') :
          r.priority==='medium' ? (lang==='sw'?'◆ KIPAUMBELE CHA KATI':'◆ MEDIUM PRIORITY') :
          (lang==='sw'?'▸ UBORESHAJI WA KAWAIDA':'▸ ROUTINE OPTIMISATION')}
      </div>
      <div class="rec-title">${escHtml(r.title)}</div>
      <div class="rec-body">${escHtml(r.body)}</div>
      <button class="rec-action" onclick="markApplied(this)" data-rec="${i}">
        ${t('rec_mark_applied')}
      </button>
    </div>`).join('');
}

// ── SCI PANEL ─────────────────────────────────────────────────────
function renderSCIPanel() {
  const lang = APP.lang;
  setEl('sci-big', SIM.sciScore);
  setEl('sci-formula-val', SIM.sciScore);
  setElStyle('sci-big', 'color', SIM.sciScore > 70 ? '#2EA862' : SIM.sciScore > 40 ? '#F5A623' : '#FF6B6B');

  const clsKey = SIM.sciScore > 70 ? 'sci_high_class' : SIM.sciScore > 40 ? 'sci_med_class' : 'sci_low_class';
  setEl('sci-class-label', t(clsKey));
  setEl('sci-why-text',    t('sci_why', SIM.sciScore));

  // SCI component bars + values
  [['sci-bar-1','sci-val-1',SIM.sci1],['sci-bar-2','sci-val-2',SIM.sci2],
   ['sci-bar-3','sci-val-3',SIM.sci3],['sci-bar-4','sci-val-4',SIM.sci4],
   ['sci-p1-bar','sci-p1-val',SIM.sci1],['sci-p2-bar','sci-p2-val',SIM.sci2],
   ['sci-p3-bar','sci-p3-val',SIM.sci3],['sci-p4-bar','sci-p4-val',SIM.sci4],
  ].forEach(([barId, valId, val]) => {
    setSciBar(barId, val);
    setEl(valId, val);
  });
}

// ── YIELD PANEL ───────────────────────────────────────────────────
function renderYieldPanel() {
  const crop  = CROPS[APP.crop];
  const lang  = APP.lang;
  const cName = lang === 'sw' ? crop.name_sw : crop.name_en;

  // Yield plot label
  const lbl = document.getElementById('yield-plot-label');
  if (lbl) lbl.textContent = lang === 'sw'
    ? `${crop.emoji} ${cName} — Shamba A (SmartSoil+) vs Shamba B (Udhibiti)`
    : `${crop.emoji} ${cName} — Plot A (SmartSoil+) vs Plot B (Unguided)`;

  // Crop thresholds reference
  renderCropThresholdsTable();
}

// ── CLIMATE PANEL ─────────────────────────────────────────────────
function renderClimatePanel() {
  const lang  = APP.lang;
  const crop  = CROPS[APP.crop];
  const stage = getCropStage(APP.crop, SIM._dayOfSeason);
  const cName = lang === 'sw' ? crop.name_sw : crop.name_en;
  const cStage = lang === 'sw' ? stage.name_sw : stage.name_en;

  setEl('eti-val',   SIM.eti);
  setEl('eti-streak',SIM._etiHighStreak);
  setEl('clim-temp', Math.round(SIM.temp));
  setEl('clim-hum',  Math.round(SIM.humidity));
  setEl('clim-hd',   Math.round(100 - SIM.humidity));

  const etiKey = SIM.eti < ETI.LOW.max ? 'eti_low' : SIM.eti < ETI.MODERATE.max ? 'eti_mod' : 'eti_high';
  setEl('eti-class', t(etiKey));
  setElStyle('eti-class', 'color',
    SIM.eti < ETI.LOW.max ? '#2EA862' : SIM.eti < ETI.MODERATE.max ? '#F5A623' : '#FF6B6B');

  const etiWhyKey = SIM.eti < ETI.LOW.max ? 'eti_why_low' : SIM.eti < ETI.MODERATE.max ? 'eti_why_mod' : 'eti_why_high';
  setEl('eti-why-text', t(etiWhyKey, cName));

  const needle = document.getElementById('eti-needle');
  if (needle) needle.style.left = `${Math.min(95, Math.max(5, SIM.eti))}%`;

  // Kc display
  const kcEl = document.getElementById('kc-display');
  if (kcEl) {
    const depletion = (SOILS[APP.soilClass].drying_pct * (1 + (SIM.eti < 35 ? -0.1 : SIM.eti < 65 ? 0 : 0.2)) * stage.kc).toFixed(1);
    kcEl.innerHTML = `
      <div style="font-family:var(--font-mono);font-size:9px;color:var(--fog);margin-bottom:8px;">${crop.emoji} ${cName.toUpperCase()} · ${cStage.toUpperCase()}</div>
      <div style="font-family:var(--font-head);font-size:36px;font-weight:800;color:var(--leaf);line-height:1;">${stage.kc.toFixed(2)}</div>
      <div style="font-size:11px;color:var(--mist);opacity:0.6;margin-top:4px;margin-bottom:12px;">${stage.name_en} — ${lang==='sw'?'Mgawo wa mazao':'Crop coefficient'}</div>
      <div class="why-box">
        <div class="why-label">${lang==='sw'?'Fomula ya upotezaji':'Depletion rate formula'}</div>
        ${lang==='sw'?'Kiwango':'Rate'} = ${SOILS[APP.soilClass].drying_pct}%/day × ETI modifier × Kc (${stage.kc}) = <strong style="color:var(--leaf);">${depletion}% FC/day</strong>
      </div>`;
  }
}

// ── PROTOTYPE DISCLOSURE ──────────────────────────────────────────
function renderPrototypeDisclosure() {
  setEl('proto-title', t('proto_title'));
  setEl('proto-body',  t('proto_body'));
}

// ── ALERT BADGE ───────────────────────────────────────────────────
function updateAlertBadge() {
  const diags = runDiagnostics();
  const crit  = countCriticalAlerts(diags);
  const badge    = document.getElementById('alert-badge');
  const navBadge = document.getElementById('alert-nav-badge');
  if (badge) {
    badge.style.display = crit > 0 ? 'inline-block' : 'none';
    if (crit > 0) badge.textContent = t('alerts_badge', crit);
  }
  if (navBadge) navBadge.textContent = crit;
}

// ── CROP THRESHOLDS TABLE ─────────────────────────────────────────
function renderCropThresholdsTable() {
  const el   = document.getElementById('crop-thresholds-table');
  if (!el) return;
  const crop = CROPS[APP.crop];
  const lang = APP.lang;
  const cName = lang === 'sw' ? crop.name_sw : crop.name_en;
  const thresholds = lang === 'sw' ? crop.stages.map(s=>
    `${s.name_sw}: Kc ${s.kc} · ${s.critical ? '🔴 Hatari' : '🟢 Kawaida'}`
  ) : crop.stages.map(s =>
    `${s.name_en} (Day ${s.days[0]}–${s.days[1]}): Kc ${s.kc} · ${s.critical ? '🔴 Critical' : '🟢 Normal'}`
  );

  el.innerHTML = `
    <div style="font-family:var(--font-mono);font-size:9px;color:var(--fog);margin-bottom:10px;letter-spacing:1.5px;">
      ${crop.emoji} ${cName} (${crop.id}) — ${lang==='sw'?'Hatua za Ukuaji':'Growth Stages & Kc'}
    </div>
    ${thresholds.map((thr,i) => `
      <div style="padding:9px 12px;border-radius:8px;margin-bottom:6px;background:${i===0?'rgba(46,168,98,0.07)':'rgba(46,168,98,0.04)'};border:1px solid rgba(46,168,98,0.12);">
        <div style="font-size:11px;color:var(--cream);opacity:0.85;">${escHtml(thr)}</div>
      </div>`).join('')}
    <div class="why-box" style="margin-top:12px;">
      <div class="why-label">${lang==='sw'?'Hasara ya mavuno inayokadiriwa':'Estimated yield loss range'}</div>
      ${lang==='sw'?'Ukame':'Drought'}: <strong style="color:var(--amber);">${crop.yield_drought[0]}–${crop.yield_drought[1]}%</strong> ·
      ${lang==='sw'?'Mafuriko':'Waterlog'}: <strong style="color:var(--crimson);">${crop.yield_waterlog[0]}–${crop.yield_waterlog[1]}%</strong>
    </div>`;
}

// ── MARK RECOMMENDATION AS APPLIED ───────────────────────────────
function markApplied(btn) {
  btn.textContent = t('rec_applied');
  btn.classList.add('applied');
  btn.disabled = true;
  showNotif(APP.lang === 'sw' ? '✓ Uamuzi umerekodiwa' : '✓ Recommendation applied', 'green');
}

// ── LOADING BUTTON STATE ──────────────────────────────────────────
function withLoading(btnEl, asyncFn) {
  const orig = btnEl.innerHTML;
  btnEl.disabled   = true;
  btnEl.innerHTML  = `<span class="spinner"></span> ${APP.lang==='sw'?'Inashughulika...':'Processing...'}`;
  setTimeout(() => {
    asyncFn();
    btnEl.disabled  = false;
    btnEl.innerHTML = orig;
  }, 600);
}

// ── NOTIFICATION SYSTEM ───────────────────────────────────────────
let _notifQueue = [];
function showNotif(msg, type = 'green') {
  _notifQueue.push({ msg, type });
  if (_notifQueue.length === 1) _processNotifQueue();
}
function _processNotifQueue() {
  if (_notifQueue.length === 0) return;
  const { msg, type } = _notifQueue[0];
  const c  = document.getElementById('notif-container');
  const el = document.createElement('div');
  el.className = `notif ${type}`;
  el.setAttribute('role', 'alert');
  el.textContent = msg;
  c.appendChild(el);
  setTimeout(() => {
    el.style.opacity    = '0';
    el.style.transition = 'opacity 0.3s';
    setTimeout(() => {
      el.remove();
      _notifQueue.shift();
      _processNotifQueue();
    }, 300);
  }, 3000);
}

// ── DOM HELPERS ───────────────────────────────────────────────────
function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
function setElHTML(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}
function setElStyle(id, prop, val) {
  const el = document.getElementById(id);
  if (el) el.style[prop] = val;
}
function setCardClass(id, statusClass) {
  const el = document.getElementById(id);
  if (el) el.className = `card ${statusClass}`;
}
function setSensorBar(id, pct, color) {
  const el = document.getElementById(id);
  if (el) { el.style.width = `${Math.min(100,Math.max(0,pct))}%`; el.style.background = color; }
}
function setSciBar(id, val) {
  const el = document.getElementById(id);
  if (el) {
    el.style.width      = `${val}%`;
    el.style.background = val > 65 ? '#2EA862' : '#F5A623';
  }
}
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── INIT ──────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  startClock();
  startSimulation();    // from simulation.js — seeds history and starts tick
  renderAll();
  requestAnimationFrame(() => setTimeout(drawAllCharts, 100));
});

// Export for HTML onclick handlers
if (typeof window !== 'undefined') {
  window.APP            = APP;
  window.showPage       = showPage;
  window.toggleSidebar  = toggleSidebar;
  window.closeSidebar   = closeSidebar;
  window.setLang        = setLang;
  window.setMode        = setMode;
  window.setCrop        = setCrop;
  window.markApplied    = markApplied;
  window.withLoading    = withLoading;
  window.showNotif      = showNotif;
  window.renderAll      = renderAll;
  window.onSimTick      = onSimTick;
  window.renderCropThresholdsTable = renderCropThresholdsTable;
}
