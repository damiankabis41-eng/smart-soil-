/**
 * SmartSoil+ | config.js
 * ─────────────────────────────────────────────────────────────────
 * Single source of truth for all agronomic parameters.
 * Source: Damian (Agriculture Module) + Saida (Soil Module).
 * These values feed the simulation engine, diagnostics, SCI, and UI.
 * ─────────────────────────────────────────────────────────────────
 * PROTOTYPE NOTICE:
 * All thresholds are rule-based agronomic estimates.
 * Not calibrated from live sensor data yet.
 * Designed for ESP32 sensor integration in Phase 2.
 * ─────────────────────────────────────────────────────────────────
 */

'use strict';

// ── SYSTEM METADATA ───────────────────────────────────────────────
const SYS = {
  version:     '2.1.0-mvp',
  releaseDate: '2026-05',
  phase:       'Phase 1 — Simulation Prototype',
  plot:        'Plot A',
  location:    'UDSM Demo Farm, Tanzania',
  timezone:    'Africa/Dar_es_Salaam',
  sensorMode:  'SIMULATED',   // future: 'LIVE_ESP32' | 'LIVE_FIREBASE'
  mqttBroker:  null,          // future: 'mqtt://broker.smartsoil.tz'
  apiEndpoint: null,          // future: 'https://api.smartsoil.tz/v1'
};

// ── CROP PROFILES (MAZ01 / TOM01 / ONI01) ────────────────────────
// Source: Damian — Agriculture / Environmental Science Module
const CROPS = {
  maize: {
    id:            'MAZ01',
    emoji:         '🌽',
    name_en:       'Maize',
    name_sw:       'Mahindi',
    // Growth stages with Kc and typical day ranges
    stages: [
      { name_en: 'Establishment',  name_sw: 'Kuota',           days: [0,25],   kc: 0.40, critical: false },
      { name_en: 'Vegetative',     name_sw: 'Ukuaji wa Majani',days: [26,70],  kc: 0.80, critical: false },
      { name_en: 'Tasseling',      name_sw: 'Kutoa Ua',        days: [71,100], kc: 1.15, critical: true  },
      { name_en: 'Grain Filling',  name_sw: 'Kujaza Nafaka',   days: [101,140],kc: 1.10, critical: true  },
      { name_en: 'Maturity',       name_sw: 'Kuiva',           days: [141,180],kc: 0.70, critical: false },
    ],
    demand_mm:     [500, 800],
    duration_days: [125, 180],
    fc_optimal:    [50, 80],    // % Field Capacity
    drought_flag:  50,          // % FC → drought stress flag
    drought_risk:  40,          // % FC for >3 days → high yield loss
    waterlog_pct:  90,          // % FC threshold
    waterlog_hrs:  72,          // hours before waterlog stress
    yield_drought: [10, 30],    // % yield loss range (drought)
    yield_waterlog:[10, 20],    // % yield loss range (waterlog)
    // Diagnostic yield loss formula: base + (stress_days × 2), cap 30%
    // Reproductive stage multiplier: ×1.5
    yield_base:    10,
    yield_per_day: 2,
    yield_cap:     30,
    repro_multiplier: 1.5,
  },

  tomato: {
    id:            'TOM01',
    emoji:         '🍅',
    name_en:       'Tomato',
    name_sw:       'Nyanya',
    stages: [
      { name_en: 'Transplanting',  name_sw: 'Kupanda',         days: [0,20],   kc: 0.50, critical: false },
      { name_en: 'Vegetative',     name_sw: 'Ukuaji wa Majani',days: [21,50],  kc: 0.75, critical: false },
      { name_en: 'Flowering',      name_sw: 'Kutoa Maua',      days: [51,80],  kc: 1.05, critical: true  },
      { name_en: 'Fruit Set',      name_sw: 'Kuweka Matunda',  days: [81,110], kc: 1.10, critical: true  },
      { name_en: 'Fruit Enlargement',name_sw:'Kukua Matunda',  days: [111,145],kc: 1.05, critical: true  },
      { name_en: 'Maturity',       name_sw: 'Kuiva',           days: [146,180],kc: 0.80, critical: false },
    ],
    demand_mm:     [400, 600],
    duration_days: [135, 180],
    fc_optimal:    [60, 80],
    drought_flag:  50,
    drought_risk:  45,
    waterlog_pct:  90,
    waterlog_hrs:  72,
    yield_drought: [15, 25],
    yield_waterlog:[10, 15],
    yield_base:    10,
    yield_per_day: 2,
    yield_cap:     30,
    repro_multiplier: 1.5,
  },

  onion: {
    id:            'ONI01',
    emoji:         '🧅',
    name_en:       'Onion',
    name_sw:       'Vitunguu',
    stages: [
      { name_en: 'Germination',    name_sw: 'Kuota',           days: [0,20],   kc: 0.40, critical: false },
      { name_en: 'Vegetative',     name_sw: 'Ukuaji wa Majani',days: [21,70],  kc: 0.70, critical: false },
      { name_en: 'Bulb Initiation',name_sw: 'Kuanza Tunda',    days: [71,120], kc: 1.00, critical: true  },
      { name_en: 'Bulb Enlargement',name_sw:'Kukua Tunda',     days: [121,170],kc: 1.05, critical: true  },
      { name_en: 'Maturity',       name_sw: 'Kuiva',           days: [171,210],kc: 0.75, critical: false },
    ],
    demand_mm:     [350, 550],
    duration_days: [150, 210],
    fc_optimal:    [60, 80],
    drought_flag:  50,
    drought_risk:  45,
    waterlog_pct:  90,
    waterlog_hrs:  72,
    yield_drought: [20, 30],
    yield_waterlog:[15, 25],
    yield_base:    10,
    yield_per_day: 2,
    yield_cap:     30,
    repro_multiplier: 1.5,
  },
};

// ── SOIL CLASSES (SOIL01–SOIL05) ──────────────────────────────────
// Source: Saida — Soil Hydraulic Behaviour Module
const SOILS = {
  SOIL01: {
    name:           'Sandy Soil',
    fc_range:       [10, 20],   // % volumetric moisture
    stress_thresh:  [10, 12],   // % stress threshold
    drainage:       'Rapid',
    drying_rate:    'Rapid',    // Category 3: >5% FC/day
    drying_pct:     6.0,        // % FC/day base
    waterlog_fc:    85,
    waterlog_hrs:   24,
    leach_risk:     'High',
    drought_adjust: +5,         // add to crop threshold (safety margin)
    waterlog_adjust:-5,
  },
  SOIL02: {
    name:           'Sandy Clay Loam',
    fc_range:       [20, 30],
    stress_thresh:  [15, 18],
    drainage:       'Moderate',
    drying_rate:    'Moderate', // Category 2: 2–5% FC/day
    drying_pct:     3.2,
    waterlog_fc:    90,
    waterlog_hrs:   48,
    leach_risk:     'Moderate',
    drought_adjust: 0,
    waterlog_adjust: 0,
  },
  SOIL03: {
    name:           'Alluvial Loam',
    fc_range:       [22, 32],
    stress_thresh:  [16, 20],
    drainage:       'Moderate-High',
    drying_rate:    'Moderate',
    drying_pct:     3.8,
    waterlog_fc:    92,
    waterlog_hrs:   48,
    leach_risk:     'Elevated',
    drought_adjust: 0,
    waterlog_adjust:+2,
  },
  SOIL04: {
    name:           'Clay / Vertisol',
    fc_range:       [30, 40],
    stress_thresh:  [22, 25],
    drainage:       'Slow',
    drying_rate:    'Slow',     // Category 1: <2% FC/day
    drying_pct:     1.5,
    waterlog_fc:    90,
    waterlog_hrs:   72,
    leach_risk:     'Low',
    drought_adjust: -2,         // lower trigger (high retention)
    waterlog_adjust:+5,         // risk applies sooner
  },
  SOIL05: {
    name:           'Volcanic / Andosol',
    fc_range:       [25, 35],
    stress_thresh:  [20, 23],
    drainage:       'Moderate',
    drying_rate:    'Moderate',
    drying_pct:     2.8,
    waterlog_fc:    90,
    waterlog_hrs:   60,
    leach_risk:     'Moderate',
    drought_adjust: 0,
    waterlog_adjust:+3,
  },
};

// ── ETI CLASSIFICATION ────────────────────────────────────────────
// Source: Climate Dynamics & ET Modelling Framework
const ETI = {
  LOW:      { min: 0,  max: 35, drying_modifier: -0.10, label_en: 'Low Demand',      label_sw: 'Mahitaji Madogo'  },
  MODERATE: { min: 35, max: 65, drying_modifier:  0.00, label_en: 'Moderate Demand', label_sw: 'Mahitaji ya Wastani' },
  HIGH:     { min: 65, max: 100,drying_modifier: +0.20, label_en: 'High Demand',     label_sw: 'Mahitaji Makubwa' },
};

// ── SIMULATION ENGINE CONFIG ──────────────────────────────────────
const SIM_CONFIG = {
  tick_ms:           3000,   // simulation tick interval
  history_hours:     72,     // data history window
  // Weather pattern cycle (simulates seasonal variation)
  weather_cycle_hrs: 24,
  // Realistic drift coefficients — NOT pure random
  temp_base:         27,     // °C base temperature
  temp_amplitude:    5,      // daily swing °C
  temp_peak_hour:    13,     // peak heat hour
  humid_base:        70,     // % base humidity
  humid_amplitude:   18,     // daily swing
  humid_trough_hour: 13,     // lowest humidity at peak heat
  // EC parameters
  ec_baseline:       1.80,   // dS/m healthy baseline
  ec_leach_drop:     0.22,   // post-irrigation drop fraction
  ec_recovery_rate:  0.03,   // dS/m recovery per tick
  // Rainfall events (probabilistic)
  rain_probability:  0.04,   // per tick probability of rain event
  rain_moisture_add: [8, 20],// % FC added per rain event
  // Irrigation event defaults
  irrigation_add:    [15, 25],// % FC added per irrigation
};

// ── SCI WEIGHTS ───────────────────────────────────────────────────
// Soil Capital Index = weighted composite of 4 proxy indicators
const SCI_WEIGHTS = {
  moisture_stability:  0.30,  // Proxy 1: σ of 7-day moisture (inverted)
  recovery_efficiency: 0.25,  // Proxy 2: time to return to optimal band
  saturation_persistence: 0.20,// Proxy 3: duration >90% FC (inverted)
  rootzone_stability:  0.25,  // Proxy 4: days within optimal band
};

// ── ALERT SEVERITY LEVELS ─────────────────────────────────────────
const SEVERITY = {
  CRITICAL: 'critical',
  WARNING:  'warning',
  INFO:     'info',
  SUCCESS:  'success',
};

// ── DIAGNOSTIC ESCALATION THRESHOLDS ─────────────────────────────
const DIAG = {
  // Stress duration before escalation (hours)
  drought_warn_hrs:    6,
  drought_critical_hrs:24,
  waterlog_warn_hrs:   12,
  waterlog_critical_hrs:48,
  // ETI streak before yield amplification
  eti_high_streak_days: 3,
  // EC leaching threshold
  ec_leach_threshold:  0.20, // 20% drop = leaching detected
  // SCI thresholds
  sci_high:   70,
  sci_medium: 40,
};

// ── EXPORT ────────────────────────────────────────────────────────
// Makes all config available to other modules
if (typeof window !== 'undefined') {
  window.SYS         = SYS;
  window.CROPS       = CROPS;
  window.SOILS       = SOILS;
  window.ETI         = ETI;
  window.SIM_CONFIG  = SIM_CONFIG;
  window.SCI_WEIGHTS = SCI_WEIGHTS;
  window.SEVERITY    = SEVERITY;
  window.DIAG        = DIAG;
}
