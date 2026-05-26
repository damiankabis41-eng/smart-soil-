/**
 * SmartSoil+ | simulation.js
 * ─────────────────────────────────────────────────────────────────
 * REALISTIC SIMULATION ENGINE
 *
 * Replaces pure Math.random() with:
 *   - Sinusoidal diurnal weather cycles
 *   - Crop-stage evapotranspiration (Kc × ET₀)
 *   - Soil-type drainage behaviour
 *   - Irrigation event impacts
 *   - Stress accumulation memory
 *   - EC leaching model
 *   - Rainfall probabilistic events
 *   - Predictive trend projection
 *
 * FUTURE INTEGRATION:
 *   Replace tick() with WebSocket listener from Firebase/MQTT:
 *   ws.onmessage = (msg) => ingestSensorReading(JSON.parse(msg.data))
 * ─────────────────────────────────────────────────────────────────
 */

'use strict';

// ── SIMULATION STATE ──────────────────────────────────────────────
// Single source of truth — all UI reads from here
const SIM = {
  // Current readings
  moisture:     62.0,   // % Field Capacity
  moisture_20:  58.0,   // % FC at 20cm
  temp:         27.0,   // °C air temperature
  humidity:     71.0,   // % relative humidity
  soilTemp:     23.5,   // °C soil temperature
  ec:           1.80,   // dS/m electrical conductivity

  // Computed indices
  eti:          52,     // 0–100 ET Demand Index
  sciScore:     61,     // 0–100 Soil Capital Index
  sci1:         72,     // Moisture Stability
  sci2:         55,     // Recovery Efficiency
  sci3:         56,     // Saturation Persistence
  sci4:         62,     // Root-Zone Stability
  yieldRisk:    14,     // % estimated yield loss

  // Internal simulation state
  _tick:        0,           // simulation tick counter
  _hourOfDay:   new Date().getHours() + new Date().getMinutes()/60,
  _dayOfSeason: 85,          // crop day (drives stage selection)
  _weatherPhase:0,           // drives multi-day weather cycles
  _irrigationCooldown: 0,    // ticks since last irrigation
  _droughtStressHours: 0.0,  // accumulated drought stress hours
  _saturationHours:    6.2,  // accumulated saturation hours
  _ecPreIrrigation:    1.80, // EC before last irrigation event
  _lastMoisture:       62.0, // for drying rate calculation
  _dryingRate:         3.2,  // % FC/day current drying rate
  _etiHighStreak:      0,    // consecutive high-ETI ticks
  _rainfallActive:     false,// current rainfall event
  _rainfallTicks:      0,    // remaining rainfall ticks

  // History arrays (72 hours = 72 data points at 1/hr sampling)
  history: {
    moisture:   [],
    temp:       [],
    humidity:   [],
    ec:         [],
    eti:        [],
    sci:        [],
    labels:     [],
  },
};

// ── SEED HISTORY ──────────────────────────────────────────────────
// Build a realistic 72-hour back-history on startup
function seedHistory() {
  const now = Date.now();
  const crop = CROPS[APP.crop];
  const soil = SOILS[APP.soilClass];

  for (let i = 71; i >= 0; i--) {
    const hoursAgo = i;
    const d = new Date(now - hoursAgo * 3_600_000);
    const hr = d.getHours() + d.getMinutes() / 60;

    // Sinusoidal temperature
    const temp = SIM_CONFIG.temp_base +
      SIM_CONFIG.temp_amplitude * Math.sin((hr - 6) * Math.PI / 12);

    // Sinusoidal humidity (inverse of temp)
    const hum = SIM_CONFIG.humid_base -
      SIM_CONFIG.humid_amplitude * Math.sin((hr - 6) * Math.PI / 12);

    // ETI
    const hd = 100 - hum;
    const eti = Math.min(100, Math.max(0,
      Math.round((temp * 1.6 + hd * 0.9 + 8) / 1.3)
    ));

    // Moisture — realistic pattern with irrigation at ~06:00 each day
    const dayProgress = (71 - i) / 24;
    const hourInDay = hr % 24;
    const drainAfterIrrigation = hourInDay > 6 ? (hourInDay - 6) * soil.drying_pct / 24 : 0;
    const moisture = Math.min(82, Math.max(38,
      65 - drainAfterIrrigation + (hourInDay < 7 ? 12 : 0) +
      (Math.random() - 0.5) * 1.5
    ));

    // EC — drops after irrigation, recovers through day
    const ecBase = SIM_CONFIG.ec_baseline;
    const ecDrop = hourInDay > 6 && hourInDay < 8 ? -0.25 : 0;
    const ec = Math.round((ecBase + ecDrop + (Math.random() - 0.5) * 0.05) * 100) / 100;

    SIM.history.moisture.push(Math.round(moisture * 10) / 10);
    SIM.history.temp.push(Math.round(temp * 10) / 10);
    SIM.history.humidity.push(Math.round(hum * 10) / 10);
    SIM.history.ec.push(ec);
    SIM.history.eti.push(eti);
    SIM.history.sci.push(Math.round(48 + (71 - i) * 0.18 + (Math.random() - 0.5) * 1.5));
    SIM.history.labels.push(`${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`);
  }

  // Initialise current readings from last history point
  SIM.moisture  = SIM.history.moisture[71];
  SIM.temp      = SIM.history.temp[71];
  SIM.humidity  = SIM.history.humidity[71];
  SIM.ec        = SIM.history.ec[71];
  SIM.eti       = SIM.history.eti[71];
  SIM.sciScore  = SIM.history.sci[71];
}

// ── COMPUTE ETI ───────────────────────────────────────────────────
// ETI = weighted: temperature (50%) + humidity deficit (35%) + radiation proxy (15%)
function computeETI(temp, humidity) {
  const hd = Math.max(0, 100 - humidity);           // humidity deficit
  const tempScore  = Math.min(100, ((temp - 15) / 25) * 100);
  const humScore   = Math.min(100, (hd / 65) * 100);
  const radProxy   = Math.min(100, tempScore * 0.6); // simple radiation proxy
  const eti = Math.round(tempScore * 0.50 + humScore * 0.35 + radProxy * 0.15);
  return Math.min(100, Math.max(0, eti));
}

// ── GET CROP STAGE ────────────────────────────────────────────────
function getCropStage(cropKey, dayOfSeason) {
  const stages = CROPS[cropKey].stages;
  for (const stage of stages) {
    if (dayOfSeason >= stage.days[0] && dayOfSeason <= stage.days[1]) {
      return stage;
    }
  }
  return stages[stages.length - 1]; // default to last stage
}

// ── COMPUTE DRYING RATE ───────────────────────────────────────────
// Rate = base soil drying × ETI modifier × Kc weight
function computeDryingRate(soilKey, eti, kc) {
  const soil = SOILS[soilKey];
  const etiCat = eti < 35 ? ETI.LOW : eti < 65 ? ETI.MODERATE : ETI.HIGH;
  const baseRate = soil.drying_pct;
  const etiMod   = 1 + etiCat.drying_modifier;
  const kcMod    = kc / 1.0; // normalised relative to Kc = 1.0
  return baseRate * etiMod * kcMod;
}

// ── COMPUTE SCI ───────────────────────────────────────────────────
function computeSCI() {
  // Proxy 1: Moisture Stability Index
  // stddev of last 7 data points (1/hr) → inverted (high stability = high score)
  const recent = SIM.history.moisture.slice(-7);
  const mean = recent.reduce((a,b)=>a+b,0) / recent.length;
  const variance = recent.reduce((sum,v)=>sum+Math.pow(v-mean,2),0) / recent.length;
  const stddev = Math.sqrt(variance);
  const msi = Math.max(0, Math.min(100, 100 - stddev * 8));

  // Proxy 2: Recovery Efficiency
  // Score based on how quickly moisture returned to optimal after last irrigation
  // Simplified: score is higher when moisture is in optimal range after irrigation
  const crop = CROPS[APP.crop];
  const inOptimal = SIM.moisture >= crop.fc_optimal[0] && SIM.moisture <= crop.fc_optimal[1];
  const rei = inOptimal
    ? Math.min(100, SIM.sci2 + 0.3)   // slow improvement
    : Math.max(20,  SIM.sci2 - 0.5);  // deteriorate when stressed

  // Proxy 3: Saturation Persistence Index (inverted — less saturation = higher score)
  const spi = Math.max(0, Math.min(100, 100 - (SIM._saturationHours / 72) * 100));

  // Proxy 4: Root-Zone Stability Duration
  const rzsd = inOptimal
    ? Math.min(100, SIM.sci4 + 0.2)
    : Math.max(10,  SIM.sci4 - 0.4);

  SIM.sci1 = Math.round(msi);
  SIM.sci2 = Math.round(rei);
  SIM.sci3 = Math.round(spi);
  SIM.sci4 = Math.round(rzsd);

  const composite = Math.round(
    SIM.sci1 * SCI_WEIGHTS.moisture_stability +
    SIM.sci2 * SCI_WEIGHTS.recovery_efficiency +
    SIM.sci3 * SCI_WEIGHTS.saturation_persistence +
    SIM.sci4 * SCI_WEIGHTS.rootzone_stability
  );
  SIM.sciScore = Math.min(100, Math.max(0, composite));
}

// ── COMPUTE YIELD RISK ────────────────────────────────────────────
// Formula: base_loss + (stress_days × per_day), cap at 30%
// Reproductive stage multiplier: × 1.5
function computeYieldRisk() {
  const crop = CROPS[APP.crop];
  const stage = getCropStage(APP.crop, SIM._dayOfSeason);
  const stressDays = (SIM._droughtStressHours + SIM._saturationHours) / 24;

  let risk = 0;
  if (SIM._droughtStressHours > DIAG.drought_warn_hrs ||
      SIM._saturationHours    > DIAG.waterlog_warn_hrs) {
    risk = crop.yield_base + (stressDays * crop.yield_per_day);
  } else {
    risk = Math.max(0, stressDays * 1.5);
  }

  if (stage.critical) risk *= crop.repro_multiplier;
  if (SIM._etiHighStreak >= DIAG.eti_high_streak_days) risk *= 1.3;

  SIM.yieldRisk = Math.round(Math.min(crop.yield_cap, risk));
}

// ── MAIN SIMULATION TICK ──────────────────────────────────────────
// Called every SIM_CONFIG.tick_ms milliseconds
function tick() {
  SIM._tick++;

  // 1. Advance hour of day (each tick = ~1/20 hour for smooth animation)
  SIM._hourOfDay = (SIM._hourOfDay + 1/20) % 24;
  const hr = SIM._hourOfDay;

  // 2. WEATHER — sinusoidal diurnal cycle with multi-day drift
  const dayDrift = Math.sin(SIM._tick / 200) * 2; // slow multi-day weather pattern
  SIM.temp = SIM_CONFIG.temp_base +
    SIM_CONFIG.temp_amplitude * Math.sin((hr - 6) * Math.PI / 12) +
    dayDrift + gaussianNoise(0.15);

  SIM.humidity = SIM_CONFIG.humid_base -
    SIM_CONFIG.humid_amplitude * Math.sin((hr - 6) * Math.PI / 12) -
    dayDrift * 1.2 + gaussianNoise(0.3);

  SIM.temp     = clamp(SIM.temp,     14, 42);
  SIM.humidity = clamp(SIM.humidity, 28, 96);

  // Soil temp lags air temp by ~2 hours (thermal mass)
  SIM.soilTemp = SIM_CONFIG.temp_base +
    SIM_CONFIG.temp_amplitude * 0.6 * Math.sin((hr - 8) * Math.PI / 12) +
    gaussianNoise(0.08);

  // 3. ETI computation
  SIM.eti = computeETI(SIM.temp, SIM.humidity);
  SIM._etiHighStreak = SIM.eti >= ETI.HIGH.min
    ? SIM._etiHighStreak + 1
    : Math.max(0, SIM._etiHighStreak - 1);

  // 4. Get crop stage and Kc
  const stage = getCropStage(APP.crop, SIM._dayOfSeason);
  const kc    = stage.kc;
  const soil  = SOILS[APP.soilClass];

  // 5. MOISTURE — trend-based depletion
  // Only deplete during daylight hours when ET is active
  const dryingRate  = computeDryingRate(APP.soilClass, SIM.eti, kc);
  SIM._dryingRate   = dryingRate;
  const ticksPerDay = (24 * 3600 * 1000) / SIM_CONFIG.tick_ms;
  const tickDepletion = (dryingRate / ticksPerDay) * 1.5; // scaled for demo speed

  // Rainfall event handler
  if (SIM._rainfallActive) {
    SIM._rainfallTicks--;
    SIM.moisture += 0.4 + gaussianNoise(0.1);
    if (SIM._rainfallTicks <= 0) {
      SIM._rainfallActive = false;
    }
  } else {
    // Normal evapotranspiration depletion (more active during daylight)
    const daytimeFactor = hr >= 7 && hr <= 18 ? 1.4 : 0.3;
    SIM.moisture -= tickDepletion * daytimeFactor;

    // Random rainfall event
    if (Math.random() < SIM_CONFIG.rain_probability && hr > 14 && hr < 18) {
      const rainAdd = SIM_CONFIG.rain_moisture_add[0] +
        Math.random() * (SIM_CONFIG.rain_moisture_add[1] - SIM_CONFIG.rain_moisture_add[0]);
      SIM.moisture += rainAdd * 0.3;
      SIM._rainfallActive = true;
      SIM._rainfallTicks  = 8;
      showNotif(APP.lang === 'sw' ? '🌧 Mvua imeanza' : '🌧 Rainfall event detected', 'blue');
    }
  }

  // 20cm moisture lags 10cm by soil drainage speed
  const lagFactor = soil.drainage === 'Rapid' ? 0.7 : soil.drainage === 'Slow' ? 0.95 : 0.85;
  SIM.moisture_20 = SIM.moisture * lagFactor + gaussianNoise(0.3);

  SIM.moisture    = clamp(SIM.moisture,    15, 96);
  SIM.moisture_20 = clamp(SIM.moisture_20, 12, 92);

  // 6. EC — recovers slowly after irrigation leaching event
  if (SIM._irrigationCooldown < 5) {
    SIM.ec = Math.max(
      SIM._ecPreIrrigation * (1 - SIM_CONFIG.ec_leach_drop),
      SIM.ec + SIM_CONFIG.ec_recovery_rate + gaussianNoise(0.01)
    );
  } else {
    SIM.ec += gaussianNoise(0.01);
  }
  SIM.ec = clamp(SIM.ec, 0.4, 3.2);
  SIM._irrigationCooldown = Math.max(0, SIM._irrigationCooldown - 1);

  // 7. STRESS ACCUMULATION
  const crop = CROPS[APP.crop];
  const droughtThreshold = crop.drought_flag + soil.drought_adjust;
  const waterlogThreshold = crop.waterlog_pct;
  const tickHours = SIM_CONFIG.tick_ms / 3_600_000;

  if (SIM.moisture < droughtThreshold) {
    SIM._droughtStressHours += tickHours;
  } else {
    SIM._droughtStressHours = Math.max(0, SIM._droughtStressHours - tickHours * 0.5);
  }
  if (SIM.moisture > waterlogThreshold) {
    SIM._saturationHours += tickHours;
  } else {
    SIM._saturationHours = Math.max(0, SIM._saturationHours - tickHours * 0.3);
  }

  // 8. SCI + YIELD
  computeSCI();
  computeYieldRisk();

  // 9. UPDATE HISTORY (push + trim to 72 points)
  const now = new Date();
  const label = `${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;
  pushHistory('moisture',  Math.round(SIM.moisture * 10) / 10);
  pushHistory('temp',      Math.round(SIM.temp     * 10) / 10);
  pushHistory('humidity',  Math.round(SIM.humidity * 10) / 10);
  pushHistory('ec',        Math.round(SIM.ec       * 100) / 100);
  pushHistory('eti',       SIM.eti);
  pushHistory('sci',       SIM.sciScore);
  pushHistory('labels',    label);

  // 10. Notify UI
  if (typeof onSimTick === 'function') onSimTick();
}

// ── IRRIGATION EVENT ──────────────────────────────────────────────
function triggerIrrigation() {
  const add = SIM_CONFIG.irrigation_add[0] +
    Math.random() * (SIM_CONFIG.irrigation_add[1] - SIM_CONFIG.irrigation_add[0]);
  SIM._ecPreIrrigation    = SIM.ec;
  SIM.moisture            = clamp(SIM.moisture + add, 0, 96);
  SIM._irrigationCooldown = 20;  // ticks before EC recovers
  SIM._saturationHours   += (SIM.moisture > CROPS[APP.crop].waterlog_pct) ? 1 : 0;

  const msg = APP.lang === 'sw'
    ? `💧 Umwagiliaji umesimuliwa — unyevu +${add.toFixed(1)}%`
    : `💧 Irrigation simulated — moisture +${add.toFixed(1)}%`;
  showNotif(msg, 'green');
  if (typeof onSimTick === 'function') onSimTick();
}

// ── DROUGHT STRESS EVENT ──────────────────────────────────────────
function triggerDrought() {
  SIM.moisture = clamp(SIM.moisture - 20 - Math.random() * 5, 15, 96);
  SIM.temp     = clamp(SIM.temp + 3, 14, 42);
  SIM.humidity = clamp(SIM.humidity - 15, 28, 96);
  SIM._droughtStressHours += 6;

  const msg = APP.lang === 'sw'
    ? '☀ Hali ya ukame imewashwa — joto na upungufu wa unyevu vimeongezeka'
    : '☀ Drought conditions simulated — temp ↑ humidity ↓ moisture ↓';
  showNotif(msg, 'red');
  if (typeof onSimTick === 'function') onSimTick();
}

// ── OVER-WATER EVENT ──────────────────────────────────────────────
function triggerOverwater() {
  SIM._ecPreIrrigation = SIM.ec;
  SIM.moisture         = clamp(SIM.moisture + 32, 0, 98);
  SIM._saturationHours += 4;
  SIM._irrigationCooldown = 20;
  SIM.ec = clamp(SIM.ec * 0.75, 0.4, 3.2);

  const msg = APP.lang === 'sw'
    ? '⚠ Maji mengi yamewekwa — hatari ya uozo na upotevu wa virutubisho'
    : '⚠ Over-irrigation triggered — saturation + leaching risk';
  showNotif(msg, 'red');
  if (typeof onSimTick === 'function') onSimTick();
}

// ── UTILS ─────────────────────────────────────────────────────────
// Box-Muller gaussian noise — more realistic than Math.random()
function gaussianNoise(sigma) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return sigma * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

function pushHistory(key, val) {
  SIM.history[key].push(val);
  if (SIM.history[key].length > SIM_CONFIG.history_hours) {
    SIM.history[key].shift();
  }
}

// ── SENSOR INGESTION LAYER ────────────────────────────────────────
/**
 * FUTURE ESP32 / FIREBASE INTEGRATION POINT
 *
 * In Phase 2, replace tick() with this:
 *
 * function ingestSensorReading(payload) {
 *   // payload = { moisture_pct, temp_c, humidity_pct, ec_dsm, timestamp }
 *   SIM.moisture  = payload.moisture_pct;
 *   SIM.temp      = payload.temp_c;
 *   SIM.humidity  = payload.humidity_pct;
 *   SIM.ec        = payload.ec_dsm;
 *   computeETI(SIM.temp, SIM.humidity);
 *   computeSCI();
 *   computeYieldRisk();
 *   pushHistory(...);
 *   onSimTick();
 * }
 *
 * // Firebase Realtime DB:
 * const dbRef = firebase.database().ref('sensors/plotA');
 * dbRef.on('value', snap => ingestSensorReading(snap.val()));
 *
 * // MQTT (via MQTT.js):
 * const client = mqtt.connect('wss://broker.smartsoil.tz');
 * client.subscribe('smartsoil/plotA/sensors');
 * client.on('message', (topic, msg) => ingestSensorReading(JSON.parse(msg)));
 */

// ── START ENGINE ──────────────────────────────────────────────────
let _simInterval = null;

function startSimulation() {
  seedHistory();
  _simInterval = setInterval(tick, SIM_CONFIG.tick_ms);
}

function stopSimulation() {
  if (_simInterval) clearInterval(_simInterval);
}

// Export
if (typeof window !== 'undefined') {
  window.SIM              = SIM;
  window.startSimulation  = startSimulation;
  window.stopSimulation   = stopSimulation;
  window.triggerIrrigation= triggerIrrigation;
  window.triggerDrought   = triggerDrought;
  window.triggerOverwater = triggerOverwater;
  window.getCropStage     = getCropStage;
  window.computeETI       = computeETI;
}
