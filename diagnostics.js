/**
 * SmartSoil+ | diagnostics.js
 * ─────────────────────────────────────────────────────────────────
 * MULTI-FACTOR DIAGNOSTIC ENGINE
 *
 * Upgrades from:
 *   IF moisture < threshold → alert
 * To:
 *   moisture + duration + soil + ET + crop stage + stress history
 *   → intelligent, contextual diagnostics
 *
 * Output: array of Diagnostic objects consumed by the UI renderer
 * ─────────────────────────────────────────────────────────────────
 */

'use strict';

/**
 * Diagnostic object shape:
 * {
 *   id:        string   — unique key for deduplication
 *   severity:  string   — SEVERITY.CRITICAL | WARNING | INFO
 *   title:     string
 *   desc:      string
 *   why:       string   — the key insight
 *   fix:       string   — action recommendation
 *   time:      string   — when
 *   factors:   string[] — contributing factors for expert mode
 * }
 */

function runDiagnostics() {
  const crop     = CROPS[APP.crop];
  const soil     = SOILS[APP.soilClass];
  const stage    = getCropStage(APP.crop, SIM._dayOfSeason);
  const lang     = APP.lang;
  const m        = Math.round(SIM.moisture * 10) / 10;
  const results  = [];

  // ── Effective thresholds (soil-adjusted) ──────────────────────
  const droughtThreshold  = crop.drought_flag  + soil.drought_adjust;
  const waterlogThreshold = crop.waterlog_pct;
  const droughtHighRisk   = crop.drought_risk  + soil.drought_adjust;

  // ── 1. OVER-IRRIGATION / SATURATION ──────────────────────────
  if (m > waterlogThreshold) {
    const satHrs = SIM._saturationHours;
    const severity = satHrs > DIAG.waterlog_critical_hrs
      ? SEVERITY.CRITICAL : SEVERITY.WARNING;
    const yieldEst = estimateYieldLoss();
    const cName = lang === 'sw' ? crop.name_sw : crop.name_en;
    const cStage = lang === 'sw' ? stage.name_sw : stage.name_en;

    results.push({
      id:       'overwater',
      severity,
      title:    TR[lang].diag_overwater_title,
      desc:     TR[lang].diag_overwater_desc(m, satHrs, cName),
      why:      TR[lang].diag_overwater_why(cName, cStage, `${crop.yield_waterlog[0]}–${crop.yield_waterlog[1]}`),
      fix:      TR[lang].diag_overwater_fix,
      time:     TR[lang].just_now,
      factors:  [
        `Moisture: ${m}% FC (>${waterlogThreshold}% threshold)`,
        `Saturation duration: ${satHrs.toFixed(1)}h`,
        `Soil drainage: ${soil.drainage}`,
        `Crop stage: ${stage.name_en} (critical: ${stage.critical})`,
        `EC: ${SIM.ec.toFixed(2)} dS/m`,
      ],
    });
  }

  // ── 2. DROUGHT / WATER DEFICIT ────────────────────────────────
  else if (m < droughtThreshold) {
    const dHrs     = SIM._droughtStressHours;
    const severity = (m < droughtHighRisk || dHrs > DIAG.drought_critical_hrs)
      ? SEVERITY.CRITICAL : SEVERITY.WARNING;
    const cName  = lang === 'sw' ? crop.name_sw : crop.name_en;
    const cStage = lang === 'sw' ? stage.name_sw : stage.name_en;

    results.push({
      id:       'drought',
      severity,
      title:    TR[lang].diag_drought_title,
      desc:     TR[lang].diag_drought_desc(m, droughtThreshold, cName),
      why:      TR[lang].diag_drought_why(cName, cStage, `${crop.yield_drought[0]}–${crop.yield_drought[1]}`),
      fix:      TR[lang].diag_drought_fix,
      time:     TR[lang].ongoing,
      factors:  [
        `Moisture: ${m}% FC (<${droughtThreshold}% adjusted threshold)`,
        `Drought duration: ${dHrs.toFixed(1)}h`,
        `Soil type: ${soil.name} (drought adjust: ${soil.drought_adjust > 0 ? '+' : ''}${soil.drought_adjust}%)`,
        `ETI: ${SIM.eti}/100 (drying rate: ${SIM._dryingRate.toFixed(1)}% FC/day)`,
        `Crop stage: ${stage.name_en} — critical: ${stage.critical}`,
      ],
    });
  }

  // ── 3. ACCELERATED DRYING ─────────────────────────────────────
  // Triggered when: drying faster than soil category expects + high ETI
  const expectedMaxRate = soil.drying_pct * 1.3; // 30% above baseline = abnormal
  if (SIM._dryingRate > expectedMaxRate && SIM.eti >= ETI.HIGH.min) {
    const cName = lang === 'sw' ? crop.name_sw : crop.name_en;
    results.push({
      id:       'rapid_dry',
      severity: SEVERITY.WARNING,
      title:    TR[lang].diag_rapid_dry_title,
      desc:     TR[lang].diag_rapid_dry_desc(SIM._dryingRate, cName, soil.name),
      why:      TR[lang].diag_rapid_dry_why(soil.name, SIM.eti),
      fix:      TR[lang].diag_rapid_fix,
      time:     TR[lang].just_now,
      factors:  [
        `Drying rate: ${SIM._dryingRate.toFixed(1)}% FC/day (expected max: ${expectedMaxRate.toFixed(1)})`,
        `ETI: ${SIM.eti}/100 — High`,
        `Soil: ${soil.name} (drainage: ${soil.drainage})`,
        `High-ETI streak: ${SIM._etiHighStreak} ticks`,
      ],
    });
  }

  // ── 4. NUTRIENT LEACHING ──────────────────────────────────────
  if (SIM.ec < SIM._ecPreIrrigation * (1 - DIAG.ec_leach_threshold) &&
      SIM._irrigationCooldown > 0) {
    results.push({
      id:       'leaching',
      severity: SEVERITY.WARNING,
      title:    TR[lang].diag_leach_title,
      desc:     TR[lang].diag_leach_desc(SIM.ec),
      why:      TR[lang].diag_leach_why(),
      fix:      TR[lang].diag_leach_fix,
      time:     '2h ago',
      factors:  [
        `EC now: ${SIM.ec.toFixed(2)} dS/m`,
        `EC pre-irrigation: ${SIM._ecPreIrrigation.toFixed(2)} dS/m`,
        `Drop: ${((1 - SIM.ec / SIM._ecPreIrrigation) * 100).toFixed(0)}%`,
        `Soil leach risk: ${soil.leach_risk}`,
      ],
    });
  }

  // ── 5. PRE-STRESS ADVISORY (PREDICTIVE) ───────────────────────
  // Triggers before threshold breach if: high ETI + approaching threshold + critical stage
  const preStressMargin = droughtThreshold + 10;
  if (m >= droughtThreshold && m < preStressMargin &&
      SIM.eti >= ETI.HIGH.min && stage.critical &&
      SIM._droughtStressHours < DIAG.drought_warn_hrs) {
    const cName = lang === 'sw' ? crop.name_sw : crop.name_en;
    results.push({
      id:       'prestress',
      severity: SEVERITY.WARNING,
      title:    TR[lang].diag_prestress_title,
      desc:     TR[lang].diag_prestress_desc(m, SIM.eti, cName),
      why:      TR[lang].diag_prestress_why(cName),
      fix:      TR[lang].diag_prestress_fix,
      time:     TR[lang].predicted,
      factors:  [
        `Moisture: ${m}% FC (${(m - droughtThreshold).toFixed(1)}% above threshold)`,
        `ETI: ${SIM.eti}/100 — High demand`,
        `Growth stage: ${stage.name_en} — CRITICAL`,
        `Projected hours to threshold: ~${((m - droughtThreshold) / SIM._dryingRate * 24).toFixed(0)}h`,
      ],
    });
  }

  // ── 6. SCI DETERIORATION ─────────────────────────────────────
  if (SIM.sciScore < DIAG.sci_medium) {
    results.push({
      id:       'sci_low',
      severity: SEVERITY.WARNING,
      title:    TR[lang].diag_sci_low_title,
      desc:     TR[lang].diag_sci_desc(SIM.sciScore),
      why:      TR[lang].sci_why(SIM.sciScore),
      fix:      TR[lang].diag_sci_fix,
      time:     '1h ago',
      factors:  [
        `SCI: ${SIM.sciScore}/100`,
        `Moisture Stability: ${SIM.sci1}/100`,
        `Recovery Efficiency: ${SIM.sci2}/100`,
        `Saturation Persistence: ${SIM.sci3}/100`,
        `Root-Zone Stability: ${SIM.sci4}/100`,
      ],
    });
  }

  // ── 7. ALL CLEAR ─────────────────────────────────────────────
  if (results.length === 0) {
    const cName  = lang === 'sw' ? crop.name_sw : crop.name_en;
    const cStage = lang === 'sw' ? stage.name_sw : stage.name_en;
    results.push({
      id:       'optimal',
      severity: SEVERITY.INFO,
      title:    TR[lang].diag_optimal_title,
      desc:     TR[lang].diag_optimal_desc(m, crop.fc_optimal[0], crop.fc_optimal[1], cName),
      why:      TR[lang].moisture_optimal(m, cName, cStage, crop.fc_optimal[0], crop.fc_optimal[1]),
      fix:      TR[lang].diag_optimal_fix,
      time:     TR[lang].just_now,
      factors:  [
        `Moisture: ${m}% FC (optimal: ${crop.fc_optimal[0]}–${crop.fc_optimal[1]}%)`,
        `ETI: ${SIM.eti}/100`,
        `SCI: ${SIM.sciScore}/100`,
        `Drying rate: ${SIM._dryingRate.toFixed(1)}% FC/day`,
      ],
    });
  }

  return results;
}

// ── YIELD LOSS ESTIMATE ───────────────────────────────────────────
function estimateYieldLoss() {
  const crop  = CROPS[APP.crop];
  const stage = getCropStage(APP.crop, SIM._dayOfSeason);
  const days  = (SIM._droughtStressHours + SIM._saturationHours) / 24;
  let loss = crop.yield_base + (days * crop.yield_per_day);
  if (stage.critical) loss *= crop.repro_multiplier;
  return Math.round(Math.min(crop.yield_cap, loss));
}

// ── ALERT COUNT HELPER ────────────────────────────────────────────
function countCriticalAlerts(diagnostics) {
  return diagnostics.filter(d => d.severity === SEVERITY.CRITICAL).length;
}

// Export
if (typeof window !== 'undefined') {
  window.runDiagnostics       = runDiagnostics;
  window.estimateYieldLoss    = estimateYieldLoss;
  window.countCriticalAlerts  = countCriticalAlerts;
}
