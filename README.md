# 🌱 SmartSoil+ — Intelligent Soil-Water Intelligence Platform

> **Phase 1 MVP · Simulation Prototype · UDSM Demo Farm, Tanzania**
> Built for CRDB Imbeju Innovation Challenge 2026

---

## What Is SmartSoil+?

SmartSoil+ is a rule-based agronomic intelligence platform that helps Tanzanian smallholder and commercial farmers make better irrigation decisions — protecting crop yields, conserving water, and improving soil health.

**Current state:** Phase 1 simulation prototype using scientifically modelled agronomic data.
**Phase 2:** Live ESP32 sensor integration via Firebase/MQTT.

---

## Live Demo

🔗 **[smartsoilplus.netlify.app](https://smartsoilplus.netlify.app)**

Open on any phone or laptop — no installation needed.

---

## Key Features

| Feature | Description |
|---|---|
| 🌽🍅🧅 **Crop Intelligence** | Unique threshold profiles for Maize (MAZ01), Tomato (TOM01), Onion (ONI01) with growth-stage Kc coefficients |
| 🌱 **Soil Capital Index** | 4-proxy composite score (0–100) replacing expensive lab tests |
| 🔬 **Expert Mode** | Full analytics — charts, ETI, SCI breakdown, stress timelines, formulas |
| 🌾 **Farmer Mode** | Plain-language colour-coded cards — no numbers, no technical jargon |
| 🇬🇧🇹🇿 **Bilingual** | Full English ↔ Kiswahili translation — every label, alert, and WHY explanation |
| 📡 **Multi-Factor Diagnostics** | moisture + duration + soil type + ETI + crop stage + stress history |
| ⚡ **Predictive Alerts** | Pre-stress advisories BEFORE threshold breach — not reactive |
| 📱 **Mobile-First** | Optimised for cheap Android phones — tested down to 320px width |
| ⚗ **Honest Disclosure** | Clearly labelled simulation prototype — no fake AI claims |

---

## System Architecture

```
smartsoil/
├── index.html          ← Master HTML shell (clean, semantic)
├── styles.css          ← Mobile-first CSS (no framework)
├── config.js           ← All agronomic constants & thresholds
├── translations.js     ← Full EN + SW string library
├── simulation.js       ← Realistic trend-based simulation engine
├── diagnostics.js      ← Multi-factor diagnostic engine
├── charts.js           ← Native Canvas 2D chart renderer
├── app.js              ← Main UI controller
├── netlify.toml        ← Deployment configuration
└── README.md           ← This file
```

### 4-Layer Platform Architecture

```
LAYER 1 — PHYSICAL SENSORS
  Capacitive Moisture (10cm + 20cm) · DS18B20 Soil Temp
  DHT22 Humidity/Temp · EC Conductivity Sensor

        ↓ ADC / Voltage → %FC conversion

LAYER 2 — ICT PROCESSING ENGINE
  Trend-Based Simulation · Multi-Factor Diagnostics
  SCI Computation · ETI Calculator · Yield Risk Formula
  Drying Rate Model · Stress Accumulation

        ↓ Agronomic Knowledge Modifiers

LAYER 3 — AGRONOMIC KNOWLEDGE BASE
  Crop Profiles: MAZ01, TOM01, ONI01 (Damian)
  Soil Classes: SOIL01–SOIL05 (Saida)
  Tanzania-Specific Rules · Kc Stage Coefficients

        ↓ UI Rendering

LAYER 4 — USER INTERFACE
  Expert Mode · Farmer Mode · Bilingual Engine
  Predictive Advisories · WHY Explanations
```

---

## Crop Profiles

### Maize (MAZ01)
- Seasonal demand: 500–800mm
- Optimal FC: 50–80%
- Drought flag: <50% FC → stress alert
- Critical stages: Tasseling, Grain Filling (Kc 1.15)
- Yield loss: 10–30% drought · 10–20% waterlog

### Tomato (TOM01)
- Seasonal demand: 400–600mm
- Optimal FC: 60–80%
- Drought flag: <50% FC → flower drop risk
- Critical stages: Flowering, Fruit Set (Kc 1.10)
- Yield loss: 15–25% drought · 10–15% waterlog

### Onion (ONI01)
- Seasonal demand: 350–550mm
- Optimal FC: 60–80%
- Drought flag: <50% FC → bulb size reduction
- Critical stages: Bulb Initiation, Bulb Enlargement (Kc 1.05)
- Yield loss: 20–30% drought · 15–25% waterlog

---

## Soil Capital Index (SCI)

The SCI is a 0–100 composite score computed from 4 proxy indicators — replacing expensive laboratory soil testing.

```
SCI = 0.30 × MSI + 0.25 × REI + 0.20 × SPI + 0.25 × RSD

Where:
  MSI = Moisture Stability Index     (σ of 7-day moisture, inverted)
  REI = Recovery Efficiency Index    (time to return to optimal band)
  SPI = Saturation Persistence Index (duration >90% FC, inverted)
  RSD = Root-Zone Stability Duration (days within optimal band)

Classification:
  HIGH   (71–100) → Excellent soil health · <5% yield risk
  MEDIUM (41–70)  → Moderate capacity · 10–15% yield risk
  LOW    (0–40)   → Poor health · 20–30% yield risk · needs amendment
```

---

## Yield Risk Formula

```javascript
// Source: Damian — Agriculture Module
yield_loss = base_loss + (stress_days × per_day_loss)
// Cap at 30%
if (stage.critical) yield_loss *= 1.5   // reproductive stage multiplier
if (eti_high_streak >= 3) yield_loss *= 1.3  // prolonged heat amplifier
```

---

## Diagnostic Engine

Upgrades from simple threshold checks to multi-factor intelligence:

| Factor | Old System | SmartSoil+ |
|---|---|---|
| Moisture | `IF moisture < 50` | moisture + duration + soil type + ETI |
| Drought | Binary flag | stress hours accumulated, escalation levels |
| Waterlog | Binary flag | saturation hours, soil drainage class, crop stage |
| Leaching | Not present | EC drop >20% post-irrigation → alert |
| Predictive | Not present | pre-stress advisory before breach |
| Yield | Not connected | formula-driven, stage-amplified |

### Escalation Levels
- **Level 1 — Early Warning:** Moisture approaching threshold · monitor closely
- **Level 2 — Active Stress:** Below threshold + moderate drying · irrigate within 6h
- **Level 3 — Severe Risk:** Below threshold + rapid drying + critical stage · act immediately

---

## Simulation Engine

Replaces pure `Math.random()` with scientifically realistic modelling:

| Aspect | Implementation |
|---|---|
| Temperature | Sinusoidal diurnal cycle (peak 13:00) + multi-day drift |
| Humidity | Inverse sinusoidal (trough at peak heat) |
| Moisture depletion | Base rate × ETI modifier × Kc coefficient |
| EC leaching | Drops post-irrigation, recovers via diffusion model |
| Rainfall | Probabilistic events (afternoon bias, moisture recovery) |
| Stress accumulation | Hours-based counters with recovery decay |
| Gaussian noise | Box-Muller transform — realistic variation |

---

## ESP32 Integration (Phase 2)

The simulation engine is designed as a **drop-in replacement** for real sensor data:

```javascript
// CURRENT (Phase 1):
setInterval(tick, 3000);   // simulated tick

// PHASE 2 — replace with Firebase listener:
const dbRef = firebase.database().ref('sensors/plotA');
dbRef.on('value', snap => ingestSensorReading(snap.val()));

// OR MQTT:
const client = mqtt.connect('wss://broker.smartsoil.tz');
client.subscribe('smartsoil/plotA/sensors');
client.on('message', (topic, msg) => ingestSensorReading(JSON.parse(msg)));
```

**Sensor payload format (Phase 2):**
```json
{
  "moisture_pct": 62.4,
  "moisture_20cm_pct": 58.1,
  "temp_c": 27.8,
  "humidity_pct": 71.2,
  "soil_temp_c": 23.5,
  "ec_dsm": 1.78,
  "timestamp": 1748390400000
}
```

---

## Deployment

### Netlify (Recommended)

1. Push this folder to a GitHub repository
2. Go to [netlify.com](https://netlify.com) → **Add new site → Import from GitHub**
3. Select your repository
4. Leave all build settings **empty** (no build command needed)
5. Click **Deploy site**

Your live link: `https://your-site-name.netlify.app`

### Local Development

```bash
# No build tools needed — open directly in browser
open index.html

# OR use a simple local server:
npx serve .
# → http://localhost:3000
```

---

## Performance

- **No external JavaScript dependencies** (no jQuery, no Chart.js, no React)
- **Native Canvas 2D** chart renderer — lightweight and responsive
- **No build step** — instant deployment
- **Total JS payload:** ~45KB unminified across all modules
- **Mobile tested:** Samsung Galaxy A12 (2GB RAM), Chrome Android

---

## Prototype Disclosure

This is a **Phase 1 simulation prototype**:

- ✅ Scientifically modelled agronomic data
- ✅ Real crop profiles from FAO/CGIAR parameters
- ✅ Rule-based intelligence (not fake AI)
- ⚗ No live sensors yet (simulated pipeline)
- ⚗ Yield estimates are experimental projections
- ⚗ SCI is a proxy model, not lab-certified

**We do not oversell.** Every diagnostic is labelled as a rule-based estimate.

---

## Team

| Module | Author | Description |
|---|---|---|
| Agriculture Module | Damian | Crop profiles, water demand, stress thresholds, Tanzania rules |
| Soil Hydraulics | Saida | Soil classification, drying rates, SCI framework |
| Climate Module | Team | ETI, Kc integration, predictive stress modelling |
| ICT / Platform | Team | Architecture, simulation engine, UI, bilingual system |

---

## Future Roadmap

**Phase 2 — Live Sensors**
ESP32 firmware · Firebase Realtime DB · MQTT · Live calibration · OTA updates

**Phase 3 — Scale**
Multi-plot support · GIS/satellite NDVI · Irrigation ROI · Water efficiency scoring · Loan-risk insights

**Phase 4 — AI**
AI agronomy assistant · Predictive seasonal models · Historical yield database · Tanzania agricultural API integration

---

*SmartSoil+ · UDSM Demo Farm · Tanzania · 2026*
*Phase 1 MVP — Built for CRDB Imbeju Innovation Challenge*
