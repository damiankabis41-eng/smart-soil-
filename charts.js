/**
 * SmartSoil+ | charts.js
 * ─────────────────────────────────────────────────────────────────
 * All chart rendering. Uses native Canvas 2D API (no Chart.js dependency).
 * Charts are fully connected to SIM.history — not hardcoded.
 * Responsive: re-renders on resize.
 * ─────────────────────────────────────────────────────────────────
 */

'use strict';

// ── SHARED THEME ──────────────────────────────────────────────────
const THEME = {
  leaf:    '#2EA862',
  mint:    '#5ECBA1',
  amber:   '#F5A623',
  crimson: '#FF6B6B',
  fire:    '#E03434',
  sky:     '#2B7FD4',
  ice:     '#64B5F6',
  cream:   '#F0F7F2',
  fog:     'rgba(184,212,191,0.3)',
  grid:    'rgba(46,168,98,0.06)',
  text:    'rgba(184,212,191,0.4)',
  font:    '9px JetBrains Mono, monospace',
};

// ── BASE CHART RENDERER ───────────────────────────────────────────
function renderChart(canvasId, config) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const parent = canvas.parentElement;
  canvas.width  = parent.clientWidth  || 400;
  canvas.height = config.height       || 180;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const pad = { top: 16, right: 14, bottom: 28, left: 40 };
  const W   = canvas.width  - pad.left - pad.right;
  const H   = canvas.height - pad.top  - pad.bottom;

  // Draw grid
  ctx.strokeStyle = THEME.grid;
  ctx.lineWidth   = 1;
  const gridLines = config.gridLines || 5;
  for (let i = 0; i <= gridLines; i++) {
    const y = pad.top + (H * i / gridLines);
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + W, y);
    ctx.stroke();

    // Y axis label
    const val = config.yMax - ((config.yMax - config.yMin) * i / gridLines);
    ctx.fillStyle = THEME.text;
    ctx.font      = THEME.font;
    ctx.textAlign = 'right';
    ctx.fillText(Math.round(val), pad.left - 4, y + 3);
  }

  // Draw each series
  if (config.series) {
    config.series.forEach(series => {
      drawSeries(ctx, series.data, {
        pad, W, H,
        yMin:   config.yMin,
        yMax:   config.yMax,
        color:  series.color,
        fill:   series.fill || false,
        dashed: series.dashed || false,
        width:  series.width || 2,
      });
    });
  }

  // Draw threshold lines
  if (config.thresholds) {
    config.thresholds.forEach(thr => {
      const y = pad.top + H * (1 - (thr.value - config.yMin) / (config.yMax - config.yMin));
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = thr.color || THEME.amber;
      ctx.lineWidth   = 1;
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + W, y);
      ctx.stroke();
      ctx.setLineDash([]);
      if (thr.label) {
        ctx.fillStyle = thr.color || THEME.amber;
        ctx.font      = THEME.font;
        ctx.textAlign = 'left';
        ctx.fillText(thr.label, pad.left + 4, y - 3);
      }
    });
  }

  // X axis labels (every 12 points)
  const labels = SIM.history.labels;
  if (labels && labels.length > 0) {
    ctx.fillStyle = THEME.text;
    ctx.font      = THEME.font;
    ctx.textAlign = 'center';
    const n = labels.length;
    for (let i = 0; i < n; i += Math.ceil(n / 6)) {
      const x = pad.left + (W * i / (n - 1));
      ctx.fillText(labels[i] || '', x, canvas.height - 4);
    }
  }
}

function drawSeries(ctx, data, opts) {
  if (!data || data.length < 2) return;
  const { pad, W, H, yMin, yMax, color, fill, dashed, width } = opts;
  const n = data.length;

  ctx.beginPath();
  ctx.lineJoin    = 'round';
  ctx.lineCap     = 'round';
  ctx.lineWidth   = width;
  ctx.strokeStyle = color;
  if (dashed) ctx.setLineDash([4, 4]);

  data.forEach((v, i) => {
    const x = pad.left + (W * i / (n - 1));
    const y = pad.top  + H * (1 - (v - yMin) / (yMax - yMin));
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.setLineDash([]);

  if (fill) {
    const lastX = pad.left + W;
    const baseY = pad.top + H;
    ctx.lineTo(lastX, baseY);
    ctx.lineTo(pad.left, baseY);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + H);
    const rgba = hexToRgba(color, 0.18);
    grad.addColorStop(0, rgba);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fill();
  }
}

// ── INDIVIDUAL CHARTS ─────────────────────────────────────────────

function drawMainMoistureChart() {
  const crop  = CROPS[APP.crop];
  const stage = getCropStage(APP.crop, SIM._dayOfSeason);
  renderChart('moisture-chart', {
    height: 180,
    yMin: 0, yMax: 100,
    series: [
      {
        data:  SIM.history.moisture,
        color: THEME.leaf,
        fill:  true,
        width: 2.5,
      },
    ],
    thresholds: [
      { value: crop.fc_optimal[1], color: 'rgba(46,168,98,0.35)',  label: `Opt.Hi ${crop.fc_optimal[1]}%` },
      { value: crop.fc_optimal[0], color: 'rgba(245,166,35,0.5)',  label: `Opt.Lo ${crop.fc_optimal[0]}%` },
      { value: crop.drought_flag,  color: 'rgba(224,52,52,0.5)',   label: `Drought ${crop.drought_flag}%` },
    ],
  });
}

function drawDualDepthChart() {
  renderChart('dual-moisture-chart', {
    height: 180,
    yMin: 0, yMax: 100,
    series: [
      { data: SIM.history.moisture,                                         color: THEME.leaf, fill: false, width: 2 },
      { data: SIM.history.moisture.map((v, i) => Math.max(10, v * 0.87 + (i%3)*0.3 - 1)), color: THEME.sky,  fill: false, width: 2 },
    ],
  });
}

function drawECChart() {
  renderChart('ec-chart', {
    height: 120,
    yMin: 0.3, yMax: 2.5,
    series: [
      { data: SIM.history.ec, color: THEME.sky, fill: true, width: 1.5 },
    ],
    thresholds: [
      { value: SIM._ecPreIrrigation * (1 - DIAG.ec_leach_threshold), color: 'rgba(224,52,52,0.4)', label: 'Leach risk' },
    ],
  });
}

function drawSCITrendChart() {
  renderChart('sci-trend-chart', {
    height: 160,
    yMin: 0, yMax: 100,
    series: [
      { data: SIM.history.sci, color: THEME.amber, fill: true, width: 2 },
    ],
    thresholds: [
      { value: 70, color: 'rgba(46,168,98,0.5)',  label: 'HIGH' },
      { value: 40, color: 'rgba(224,52,52,0.4)',  label: 'LOW'  },
    ],
  });
}

function drawYieldComparisonChart() {
  // Guided (Plot A) vs unguided (Plot B) simulated comparison
  const guided   = SIM.history.sci.map(s => Math.round(Math.max(0, 30 - s * 0.28)));
  const control  = guided.map((v, i) => Math.min(35, v + 6 + (i / guided.length) * 8));
  renderChart('yield-chart', {
    height: 200,
    yMin: 0, yMax: 40,
    series: [
      { data: guided,  color: THEME.leaf,    fill: true,  width: 2, label: 'Plot A' },
      { data: control, color: THEME.crimson, fill: false, width: 2, label: 'Plot B' },
    ],
  });
}

function drawTempHumidityChart() {
  renderChart('temp-hum-chart', {
    height: 180,
    yMin: 10, yMax: 100,
    series: [
      { data: SIM.history.temp,     color: THEME.amber, fill: false, width: 2 },
      { data: SIM.history.humidity, color: THEME.sky,   fill: false, width: 2 },
    ],
    thresholds: [
      { value: 30, color: 'rgba(224,52,52,0.3)', label: 'Heat threshold' },
      { value: 50, color: 'rgba(43,127,212,0.3)', label: 'Humidity low' },
    ],
  });
}

// ── RING GAUGE ────────────────────────────────────────────────────
function drawRing(canvasId, pct, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  canvas.width = 130; canvas.height = 130;
  const ctx = canvas.getContext('2d');
  const cx = 65, cy = 65, r = 52;
  const start = -Math.PI / 2;
  const end   = start + (2 * Math.PI * Math.min(100, Math.max(0, pct)) / 100);

  // Background track
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, 2 * Math.PI);
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 11;
  ctx.stroke();

  // Filled arc
  ctx.beginPath();
  ctx.arc(cx, cy, r, start, end);
  ctx.strokeStyle = color;
  ctx.lineWidth   = 11;
  ctx.lineCap     = 'round';
  ctx.stroke();

  // Percentage text
  ctx.fillStyle = '#F0F7F2';
  ctx.font      = 'bold 22px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(Math.round(pct) + '%', cx, cy - 6);
  ctx.font      = '9px JetBrains Mono, monospace';
  ctx.fillStyle = 'rgba(184,212,191,0.5)';
  ctx.fillText('Field Cap.', cx, cy + 12);
}

// ── DRAW ALL ACTIVE CHARTS ────────────────────────────────────────
function drawAllCharts() {
  const activePage = document.querySelector('.page.active');
  if (!activePage) return;
  const id = activePage.id.replace('page-', '');
  switch(id) {
    case 'dashboard':
      drawMainMoistureChart();
      drawRing('ring-m1-canvas', SIM.moisture,    moistureColor(SIM.moisture));
      drawRing('ring-m2-canvas', SIM.moisture_20, THEME.mint);
      drawRing('ring-hum-canvas',SIM.humidity,    THEME.sky);
      break;
    case 'sensors':
      drawDualDepthChart();
      drawECChart();
      drawRing('ring-m1-canvas', SIM.moisture,    moistureColor(SIM.moisture));
      drawRing('ring-m2-canvas', SIM.moisture_20, THEME.mint);
      drawRing('ring-hum-canvas',SIM.humidity,    THEME.sky);
      break;
    case 'sci':
      drawSCITrendChart();
      break;
    case 'yield':
      drawYieldComparisonChart();
      break;
    case 'climate':
      drawTempHumidityChart();
      break;
  }
}

// ── HELPERS ───────────────────────────────────────────────────────
function moistureColor(m) {
  const crop = CROPS[APP.crop];
  if (m < crop.drought_flag) return THEME.crimson;
  if (m > crop.waterlog_pct)  return THEME.fire;
  if (m < crop.fc_optimal[0] || m > crop.fc_optimal[1]) return THEME.amber;
  return THEME.leaf;
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── RESPONSIVE ────────────────────────────────────────────────────
let _resizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(_resizeTimer);
  _resizeTimer = setTimeout(drawAllCharts, 150);
});

// Export
if (typeof window !== 'undefined') {
  window.drawAllCharts         = drawAllCharts;
  window.drawMainMoistureChart = drawMainMoistureChart;
  window.drawSCITrendChart     = drawSCITrendChart;
  window.drawYieldComparisonChart = drawYieldComparisonChart;
  window.drawTempHumidityChart = drawTempHumidityChart;
  window.moistureColor         = moistureColor;
}
