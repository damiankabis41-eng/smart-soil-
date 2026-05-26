/**
 * SmartSoil+ | translations.js
 * ─────────────────────────────────────────────────────────────────
 * All UI strings in English and Kiswahili.
 * Usage: TR[lang].key or TR[lang].fn(args)
 * ─────────────────────────────────────────────────────────────────
 */

'use strict';

const TR = {
  en: {
    // ── NAV ──────────────────────────────────────────────────────
    nav_dashboard:      'Dashboard',
    nav_sensors:        'Live Sensors',
    nav_diagnostics:    'Diagnostics',
    nav_sci:            'Soil Capital Index',
    nav_recommendations:'Recommendations',
    nav_yield:          'Yield Analysis',
    nav_climate:        'Climate & ET',
    nav_architecture:   'Architecture',
    nav_about:          'About',
    nav_monitor:        'MONITOR',
    nav_insights:       'INSIGHTS',
    nav_system:         'SYSTEM',

    // ── MODES ────────────────────────────────────────────────────
    mode_expert:        'Expert',
    mode_farmer:        'Farmer',
    mode_expert_on:     '🔬 Expert Mode — Full analytics activated',
    mode_farmer_on:     '🌾 Farmer Mode — Simplified view activated',

    // ── CROP ─────────────────────────────────────────────────────
    crop_label:         'SELECT CROP',
    crop_switched:      (name) => `Crop switched to: ${name}`,

    // ── GENERAL ──────────────────────────────────────────────────
    system_online:      'SYSTEM ONLINE',
    prototype_mode:     'SIMULATION MODE',
    live:               'LIVE',
    alerts_badge:       (n) => `${n} ALERT${n>1?'S':''}`,
    field_capacity:     '% of Field Capacity',
    just_now:           'Just now',
    ongoing:            'Ongoing',
    predicted:          'Predicted',

    // ── DASHBOARD KPI LABELS ─────────────────────────────────────
    kpi_moisture:       'SOIL MOISTURE',
    kpi_temp:           'AIR TEMPERATURE',
    kpi_sci:            'SOIL CAPITAL INDEX',
    kpi_yield:          'YIELD RISK',
    kpi_eti:            (cat) => `ETI: ${cat} Demand`,
    sci_high:           'HIGH · Excellent',
    sci_medium:         'MEDIUM · Improving',
    sci_low:            'LOW · Needs amendment',

    // ── MOISTURE WHY EXPLANATIONS ────────────────────────────────
    moisture_optimal: (m, cName, cStage, fcLow, fcHigh) =>
      `${m}% FC is within the optimal ${fcLow}–${fcHigh}% range for ${cName}. ` +
      `Roots have access to both moisture and oxygen during ${cStage}. No irrigation action required.`,
    moisture_drought: (m, cName, cStage, threshold) =>
      `Moisture at ${m}% FC has fallen below the ${threshold}% drought threshold for ${cName}. ` +
      `During ${cStage}, water stress at this level causes stomatal closure and reduces photosynthesis within hours.`,
    moisture_waterlog: (m, cName, cStage, fcHigh) =>
      `Moisture at ${m}% FC exceeds field capacity (${fcHigh}%). ` +
      `Saturated soil displaces oxygen from ${cName} root zone during ${cStage} — ` +
      `anaerobic conditions and disease risk (Pythium, Phytophthora) rise rapidly.`,
    moisture_approaching: (m, cName, threshold) =>
      `Moisture at ${m}% FC is approaching the ${threshold}% drought threshold for ${cName}. ` +
      `No immediate stress — but trend monitoring recommends irrigation within 12 hours.`,

    // ── TEMPERATURE WHY ──────────────────────────────────────────
    temp_low:    (t, cName) =>
      `At ${t}°C, atmospheric demand is low. ${cName} soil retains moisture longer — irrigation timing can be relaxed.`,
    temp_mod:    (t, cName) =>
      `At ${t}°C, evapotranspiration is moderate. ${cName} soil dries at baseline rate — standard irrigation schedule applies.`,
    temp_high:   (t, cName) =>
      `At ${t}°C, high evapotranspiration accelerates moisture depletion for ${cName} by 15–25%. Irrigation urgency is elevated — check ETI level.`,

    // ── YIELD WHY ────────────────────────────────────────────────
    yield_waterlog: (m, cName, cStage, pct) =>
      `Over-irrigation raised moisture to ${m}% — above field capacity. For ${cName} during ${cStage}, ` +
      `saturation triggers disease entry and quality decline — estimated ${pct}% yield loss.`,
    yield_drought:  (m, cName, cStage, pct) =>
      `Moisture at ${m}% is below the drought threshold. For ${cName} during ${cStage}, ` +
      `water deficit reduces cell expansion and photosynthesis — estimated ${pct}% yield loss.`,
    yield_ok:       (m, cName) =>
      `Moisture at ${m}% is within the safe range for ${cName}. ` +
      `Yield risk is residual from earlier stress events — no active threat. Follow 7-day optimisation plan.`,

    // ── SENSOR LABELS ─────────────────────────────────────────────
    sensor_m1:      'Soil Moisture A1',
    sensor_m2:      'Soil Moisture A2',
    sensor_depth1:  '10cm depth',
    sensor_depth2:  '20cm depth',
    sensor_stemp:   'Soil Temperature',
    sensor_stemp_hw:'DS18B20 probe',
    sensor_ahum:    'Air Humidity',
    sensor_ahum_hw: 'DHT22 above crop',
    sensor_ec:      'EC (Conductivity)',
    sensor_ec_hw:   'Nutrient proxy',
    sensor_ec_unit: 'dS/m',

    // ── DIAGNOSTICS ───────────────────────────────────────────────
    diag_overwater_title:   'Over-irrigation Detected',
    diag_drought_title:     'Drought Stress Active',
    diag_leach_title:       'Nutrient Leaching Risk',
    diag_prestress_title:   'Pre-Stress Advisory',
    diag_sci_low_title:     'Soil Health Declining',
    diag_optimal_title:     'All Systems Normal',
    diag_rapid_dry_title:   'Accelerated Drying Detected',

    diag_overwater_desc: (m, hrs, cName) =>
      `Soil moisture at ${m}% FC — exceeding field capacity. ${cName} root zone has been saturated for ${hrs.toFixed(1)} hours.`,
    diag_drought_desc:   (m, threshold, cName) =>
      `Moisture at ${m}% FC is below the ${threshold}% stress threshold for ${cName}. Active water deficit — yield loss risk rising.`,
    diag_leach_desc:     (ec) =>
      `EC dropped to ${ec.toFixed(2)} dS/m — nutrient concentration below healthy baseline. Leaching suspected post-irrigation.`,
    diag_prestress_desc: (m, eti, cName) =>
      `ETI ${eti}/100 (high) + moisture at ${m}% approaching lower threshold. ${cName} drought stress projected within 8–12 hours.`,
    diag_sci_desc:       (sci) =>
      `Soil Capital Index: ${sci}/100 — LOW classification. Productive soil capacity is deteriorating.`,
    diag_optimal_desc:   (m, fcLow, fcHigh, cName) =>
      `Soil moisture at ${m}% — within optimal range (${fcLow}–${fcHigh}%). No irrigation stress detected for ${cName}.`,
    diag_rapid_dry_desc: (rate, cName, soil) =>
      `Moisture declining at ${rate.toFixed(1)}% FC/day — faster than expected for ${soil}. ${cName} at elevated drought risk.`,

    diag_overwater_why: (cName, cStage, pct) =>
      `Because soil is saturated during ${cName} ${cStage}, oxygen is displaced from the root zone. ` +
      `Disease entry (Phytophthora, Fusarium) and an estimated ${pct}% yield loss are likely without drainage.`,
    diag_drought_why:   (cName, cStage, pct) =>
      `During ${cStage}, ${cName} has peak water demand (Kc near 1.1). Prolonged deficit at this stage causes ` +
      `irreversible cell damage — estimated ${pct}% yield loss accumulates each additional stress day.`,
    diag_leach_why:     () =>
      `An EC drop >20% post-irrigation means fertiliser has been washed below the root zone. ` +
      `Nutrients cannot be recovered — smaller fruits, lower market quality, and reduced photosynthesis result.`,
    diag_prestress_why: (cName) =>
      `SmartSoil+ predictive model detects high atmospheric demand combined with moisture approaching threshold. ` +
      `Historically, this combination precedes ${cName} yield-impacting stress events within 12 hours.`,
    diag_rapid_dry_why: (soil, eti) =>
      `${soil} has rapid drainage characteristics. Combined with ETI ${eti}/100, moisture depletion is accelerating ` +
      `beyond normal crop-stage expectations. Irrigation cycle shortening is recommended.`,

    diag_overwater_fix: 'Skip next irrigation session — allow natural drainage',
    diag_drought_fix:   'Irrigate now — early morning preferred (before 09:00)',
    diag_leach_fix:     'Split irrigation into two smaller cycles (50% + 50%)',
    diag_prestress_fix: 'Plan early morning irrigation session within 12 hours',
    diag_sci_fix:       'Add organic matter, revise irrigation volume downward',
    diag_optimal_fix:   'Continue current irrigation schedule',
    diag_rapid_fix:     'Shorten irrigation interval by 1 day',

    // ── FARMER MODE ───────────────────────────────────────────────
    farmer_drought_title:   '🚨 SOIL IS DRY — IRRIGATE NOW',
    farmer_waterlog_title:  '⚠️ TOO MUCH WATER — REST IRRIGATION',
    farmer_ok_title:        '✅ ALL GOOD — CONTINUE ROUTINE',
    farmer_drought_action:  (cName) =>
      `Your ${cName} soil is drying faster than normal. If you don't irrigate by tomorrow morning, ` +
      `flowering or fruit development may reduce significantly.`,
    farmer_waterlog_action: (cName) =>
      `Too much water was applied. ${cName} roots need air to breathe. ` +
      `Do not irrigate today or tomorrow — allow the soil to partially drain.`,
    farmer_ok_action:       (cName) =>
      `Your ${cName} field has good moisture. Continue your morning irrigation routine. ` +
      `Irrigate before 09:00 to avoid evaporation losses during peak heat.`,
    farmer_sci_good:   '🌟 Soil Health: EXCELLENT',
    farmer_sci_medium: '📈 Soil Health: IMPROVING',
    farmer_sci_low:    '⚠️ Soil Health: NEEDS ATTENTION',
    farmer_sci_desc:   (score) =>
      `Your soil health score is ${score}/100. Good irrigation practice this season can reach 70+ (Excellent).`,
    farmer_yield_desc: (risk) =>
      `Estimated ${risk}% of your harvest is at risk. Follow the 7-day plan to reduce this to ~6%.`,

    // ── RECOMMENDATIONS ───────────────────────────────────────────
    rec_title_reduce:  (cName) => `Reduce ${cName} Irrigation Volume by 30%`,
    rec_body_reduce:   (m, fc) =>
      `Today's irrigation raised soil moisture to ${m}% — above the ${fc}% field capacity target. ` +
      `Soil stayed saturated, creating disease and quality-decline risk. Reduce tomorrow's session by 30%.`,
    rec_title_split:   'Split Irrigation Into Two Cycles',
    rec_body_split:    (drop) =>
      `EC analysis shows ${(drop*100).toFixed(0)}% drop post-irrigation — nutrients moving below root zone. ` +
      `Apply 50% at 06:00, wait 2 hours for absorption, then apply 50% at 08:00. Reduces leaching by ~40%.`,
    rec_title_timing:  'Morning-Only Irrigation (Before 09:00)',
    rec_body_timing:   () =>
      `Air temperature peaks at 30–34°C between 12:00–15:00. Irrigating during peak heat increases ` +
      `evaporation loss by 15–20%. Complete all irrigation before 09:00 for maximum efficiency.`,
    rec_applied:       '✓ Applied',
    rec_mark_applied:  '✓ Mark as Applied',

    // ── SCI ────────────────────────────────────────────────────────
    sci_title:         'Soil Capital Index',
    sci_low_class:     'LOW CLASSIFICATION',
    sci_med_class:     'MEDIUM CLASSIFICATION',
    sci_high_class:    'HIGH CLASSIFICATION',
    sci_why:           (score) =>
      score > 70
        ? `SCI ${score}/100 — Excellent soil health. High water retention, strong organic matter. Target maintained.`
        : score > 40
        ? `SCI ${score}/100 — Moderate capacity. Sustained good irrigation can raise to HIGH (70+) within this season.`
        : `SCI ${score}/100 — Poor soil health. Immediate soil amendment and revised irrigation are required.`,

    // ── ETI ────────────────────────────────────────────────────────
    eti_low:   'CATEGORY 1 — LOW DEMAND',
    eti_mod:   'CATEGORY 2 — MODERATE DEMAND',
    eti_high:  'CATEGORY 3 — HIGH DEMAND',
    eti_why_low:  () =>
      `Low ETI — drying rate modifier set to −10%. Soil retains moisture longer than average. Irrigation urgency reduced.`,
    eti_why_mod:  () =>
      `Moderate ETI — baseline drying rate applies. Standard irrigation trigger in effect. No urgency adjustment.`,
    eti_why_high: (cName) =>
      `High ETI — drying rate accelerated by +20%. ${cName} is losing moisture faster than the crop-stage model expects. ` +
      `Irrigation interval should be shortened and trigger thresholds elevated.`,

    // ── PROTOTYPE DISCLOSURE ──────────────────────────────────────
    proto_title:  'Prototype Simulation Mode',
    proto_body:   `This application uses a rule-based agronomic simulation engine — not live sensor data. ` +
      `All readings are scientifically modelled based on crop profiles (Damian), soil hydraulics (Saida), ` +
      `and climate dynamics from peer-reviewed FAO/CGIAR parameters. ` +
      `Live ESP32 sensor integration is planned for Phase 2. ` +
      `Diagnostics are experimental estimates, not certified agronomic advice.`,

    // ── ARCHITECTURE ──────────────────────────────────────────────
    arch_layer1: 'LAYER 1 — PHYSICAL / FIELD SENSORS',
    arch_layer2: 'LAYER 2 — ICT PROCESSING ENGINE',
    arch_layer3: 'LAYER 3 — AGRONOMIC KNOWLEDGE BASE',
    arch_layer4: 'LAYER 4 — USER INTERFACE',
  },

  // ══════════════════════════════════════════════════════════════
  // KISWAHILI
  // ══════════════════════════════════════════════════════════════
  sw: {
    nav_dashboard:      'Dashibodi',
    nav_sensors:        'Sensori za Sasa',
    nav_diagnostics:    'Uchunguzi',
    nav_sci:            'Indeksi ya Mtaji wa Udongo',
    nav_recommendations:'Mapendekezo',
    nav_yield:          'Uchambuzi wa Mavuno',
    nav_climate:        'Hali ya Hewa',
    nav_architecture:   'Muundo wa Mfumo',
    nav_about:          'Kuhusu',
    nav_monitor:        'FUATILIA',
    nav_insights:       'MAARIFA',
    nav_system:         'MFUMO',

    mode_expert:        'Mtaalamu',
    mode_farmer:        'Mkulima',
    mode_expert_on:     '🔬 Hali ya Mtaalamu — Takwimu kamili zimewashwa',
    mode_farmer_on:     '🌾 Hali ya Mkulima — Mwonekano rahisi umewashwa',

    crop_label:         'CHAGUA MAZAO',
    crop_switched:      (name) => `Mazao yamebadilishwa: ${name}`,

    system_online:      'MFUMO UNAFANYA KAZI',
    prototype_mode:     'HALI YA UIGAJI',
    live:               'MOJA KWA MOJA',
    alerts_badge:       (n) => `${n} TAHADHARI`,
    field_capacity:     '% ya Uwezo wa Shamba',
    just_now:           'Sasa hivi',
    ongoing:            'Inaendelea',
    predicted:          'Inatabiriwa',

    kpi_moisture:       'UNYEVU WA UDONGO',
    kpi_temp:           'JOTO LA HEWA',
    kpi_sci:            'INDEKSI YA UDONGO',
    kpi_yield:          'HATARI YA MAVUNO',
    kpi_eti:            (cat) => `ETI: ${cat}`,
    sci_high:           'JUU · Bora Sana',
    sci_medium:         'WASTANI · Inaboresha',
    sci_low:            'CHINI · Inahitaji Msaada',

    moisture_optimal: (m, cName, cStage, fcLow, fcHigh) =>
      `${m}% FC iko ndani ya kiwango bora cha ${fcLow}–${fcHigh}% kwa ${cName}. ` +
      `Mizizi ina maji na hewa ya kutosha katika hatua ya ${cStage}. Hakuna umwagiliaji unaohitajika.`,
    moisture_drought: (m, cName, cStage, threshold) =>
      `Unyevu wa ${m}% FC umeshuka chini ya kizingiti cha ukame cha ${threshold}% kwa ${cName}. ` +
      `Katika hatua ya ${cStage}, msongo wa maji wa kiwango hiki husababisha kufunga kwa vinywa vya majani ndani ya masaa machache.`,
    moisture_waterlog: (m, cName, cStage, fcHigh) =>
      `Unyevu wa ${m}% FC unazidi uwezo wa shamba (${fcHigh}%). ` +
      `Udongo wenye maji mengi huzuia hewa kwenye mizizi ya ${cName} wakati wa ${cStage} — ` +
      `hali ya kukosa hewa na hatari ya magonjwa zinaongezeka haraka.`,
    moisture_approaching: (m, cName, threshold) =>
      `Unyevu wa ${m}% FC unakaribia kizingiti cha ukame cha ${threshold}% kwa ${cName}. ` +
      `Hakuna msongo wa haraka — lakini mwenendo unapendekeza umwagiliaji ndani ya masaa 12.`,

    temp_low:    (t, cName) =>
      `Kwa joto la ${t}°C, mahitaji ya anga ni madogo. Udongo wa ${cName} unashikilia unyevu kwa muda mrefu zaidi — ratiba ya umwagiliaji inaweza kupumzishwa.`,
    temp_mod:    (t, cName) =>
      `Kwa joto la ${t}°C, uvapotranspiration ni wa wastani. Udongo wa ${cName} unakauka kwa kiwango cha kawaida — ratiba ya kawaida ya umwagiliaji inafaa.`,
    temp_high:   (t, cName) =>
      `Kwa joto la ${t}°C, uvapotranspiration wa juu unaharakisha upotevu wa unyevu wa ${cName} kwa 15–25%. Haja ya umwagiliaji inaongezeka — angalia kiwango cha ETI.`,

    yield_waterlog: (m, cName, cStage, pct) =>
      `Umwagiliaji mwingi ulifanya unyevu ufikie ${m}% — zaidi ya uwezo wa shamba. Kwa ${cName} wakati wa ${cStage}, ` +
      `kujaa maji husababisha uingiaji wa magonjwa na kupungua kwa ubora — hasara ya mavuno inakadiriwa ${pct}%.`,
    yield_drought:  (m, cName, cStage, pct) =>
      `Unyevu wa ${m}% uko chini ya kizingiti cha ukame. Kwa ${cName} wakati wa ${cStage}, ` +
      `upungufu wa maji hupunguza ukuaji wa seli na photosynthesis — hasara ya mavuno inakadiriwa ${pct}%.`,
    yield_ok:       (m, cName) =>
      `Unyevu wa ${m}% uko ndani ya kiwango salama kwa ${cName}. ` +
      `Hatari ya mavuno ni ya masalia kutoka matukio ya awali ya msongo — fuata mpango wa siku 7.`,

    sensor_m1:      'Sensori ya Unyevu A1',
    sensor_m2:      'Sensori ya Unyevu A2',
    sensor_depth1:  'Kina cha 10cm',
    sensor_depth2:  'Kina cha 20cm',
    sensor_stemp:   'Joto la Udongo',
    sensor_stemp_hw:'Kipimo cha DS18B20',
    sensor_ahum:    'Unyevu wa Hewa',
    sensor_ahum_hw: 'DHT22 juu ya mazao',
    sensor_ec:      'EC (Uendeshaji wa Umeme)',
    sensor_ec_hw:   'Kipimo cha virutubisho',
    sensor_ec_unit: 'dS/m',

    diag_overwater_title:  'Maji Mengi Yamegunduliwa',
    diag_drought_title:    'Msongo wa Ukame Unaendelea',
    diag_leach_title:      'Hatari ya Kupotea kwa Virutubisho',
    diag_prestress_title:  'Tahadhari ya Awali ya Msongo',
    diag_sci_low_title:    'Afya ya Udongo Inashuka',
    diag_optimal_title:    'Mifumo Yote Inafanya Kazi Vizuri',
    diag_rapid_dry_title:  'Kukauka kwa Haraka Kumegunduliwa',

    diag_overwater_desc: (m, hrs, cName) =>
      `Unyevu wa udongo uko ${m}% FC — unazidi uwezo wa shamba. Eneo la mizizi ya ${cName} limejaa maji kwa masaa ${hrs.toFixed(1)}.`,
    diag_drought_desc:   (m, threshold, cName) =>
      `Unyevu wa ${m}% FC uko chini ya kizingiti cha msongo cha ${threshold}% kwa ${cName}. Upungufu wa maji unaendelea — hatari ya kupoteza mavuno inaongezeka.`,
    diag_leach_desc:     (ec) =>
      `EC imeshuka hadi ${ec.toFixed(2)} dS/m — mkusanyiko wa virutubisho uko chini ya kiwango bora. Upotevu wa virutubisho unashukiwa baada ya umwagiliaji.`,
    diag_prestress_desc: (m, eti, cName) =>
      `ETI ${eti}/100 (juu) + unyevu wa ${m}% unakaribia kizingiti cha chini. Msongo wa ukame wa ${cName} unatabiriwa ndani ya masaa 8–12.`,
    diag_sci_desc:       (sci) =>
      `Indeksi ya Mtaji wa Udongo: ${sci}/100 — uainishaji wa CHINI. Uwezo wa uzalishaji wa udongo unashuka.`,
    diag_optimal_desc:   (m, fcLow, fcHigh, cName) =>
      `Unyevu wa udongo ${m}% — ndani ya kiwango bora (${fcLow}–${fcHigh}%). Hakuna msongo wa umwagiliaji kwa ${cName}.`,
    diag_rapid_dry_desc: (rate, cName, soil) =>
      `Unyevu unapungua kwa ${rate.toFixed(1)}% FC/siku — kwa kasi zaidi ya kawaida kwa ${soil}. ${cName} iko katika hatari ya juu ya ukame.`,

    diag_overwater_why: (cName, cStage, pct) =>
      `Kwa sababu udongo una maji mengi wakati wa ${cName} ${cStage}, hewa inakosekana kwenye mizizi. ` +
      `Uingiaji wa magonjwa na hasara ya mavuno inayokadiriwa ${pct}% vinatarajiwa bila mifereji.`,
    diag_drought_why:   (cName, cStage, pct) =>
      `Katika hatua ya ${cStage}, ${cName} ina mahitaji ya juu ya maji (Kc karibu 1.1). Upungufu wa muda mrefu katika hatua hii husababisha uharibifu usioweza kurejeshwa — hasara ya mavuno ya ${pct}% inakusanyika kila siku ya ziada ya msongo.`,
    diag_leach_why:     () =>
      `Anguko la EC zaidi ya 20% baada ya umwagiliaji linamaanisha mbolea imesombwa chini ya eneo la mizizi. ` +
      `Virutubisho haviwezi kurejeshwa — matunda madogo, ubora wa chini wa soko, na upunguzaji wa photosynthesis vinafuata.`,
    diag_prestress_why: (cName) =>
      `Mfumo wa utabiri wa SmartSoil+ unaona mchanganyiko wa mahitaji makubwa ya anga na unyevu unaofikia kizingiti. ` +
      `Kihistoria, mchanganyiko huu hutangulia matukio ya msongo yanayoathiri mavuno ya ${cName} ndani ya masaa 12.`,
    diag_rapid_dry_why: (soil, eti) =>
      `${soil} ina sifa za mifereji ya haraka. Pamoja na ETI ${eti}/100, upotezaji wa unyevu unaharakishwa ` +
      `zaidi ya matarajio ya mfano wa hatua ya mazao. Kupunguza mzunguko wa umwagiliaji kunapendekezwa.`,

    diag_overwater_fix: 'Ruka umwagiliaji ujao — ruhusu mifereji ya asili',
    diag_drought_fix:   'Mwagilia sasa — asubuhi mapema inapendekezwa (kabla ya saa 3)',
    diag_leach_fix:     'Gawanya umwagiliaji katika vipindi viwili (50% + 50%)',
    diag_prestress_fix: 'Panga umwagiliaji wa asubuhi ndani ya masaa 12',
    diag_sci_fix:       'Ongeza mboji, punguza kiasi cha umwagiliaji',
    diag_optimal_fix:   'Endelea na ratiba ya sasa ya umwagiliaji',
    diag_rapid_fix:     'Fupishe mzunguko wa umwagiliaji kwa siku 1',

    farmer_drought_title:   '🚨 UDONGO UNA UKAME — MWAGILIA SASA',
    farmer_waterlog_title:  '⚠️ MAJI MENGI — PUMZISHA UMWAGILIAJI',
    farmer_ok_title:        '✅ HALI NZURI — ENDELEA KAWAIDA',
    farmer_drought_action:  (cName) =>
      `Udongo wa ${cName} wako unakauka haraka kuliko kawaida. Usipomwagilia asubuhi ya kesho, ` +
      `maua au ukuaji wa matunda unaweza kupungua kwa kiasi kikubwa.`,
    farmer_waterlog_action: (cName) =>
      `Maji mengi yamewekwa. Mizizi ya ${cName} inahitaji hewa. ` +
      `Usimwagilie leo au kesho — ruhusu udongo kupoteza maji kidogo.`,
    farmer_ok_action:       (cName) =>
      `Shamba lako la ${cName} lina unyevu mzuri. Endelea na umwagiliaji wako wa asubuhi. ` +
      `Mwagilia kabla ya saa tatu (9:00) kuepuka hasara ya maji kutokana na joto kali.`,
    farmer_sci_good:   '🌟 Afya ya Udongo: BORA SANA',
    farmer_sci_medium: '📈 Afya ya Udongo: INABORESHA',
    farmer_sci_low:    '⚠️ Afya ya Udongo: INAHITAJI MSAADA',
    farmer_sci_desc:   (score) =>
      `Alama ya afya ya udongo wako ni ${score}/100. Umwagiliaji mzuri msimu huu unaweza kufikia 70+ (Bora Sana).`,
    farmer_yield_desc: (risk) =>
      `Inakadiriwa ${risk}% ya mavuno yako iko hatarini. Fuata mpango wa siku 7 kupunguza hadi ~6%.`,

    rec_title_reduce:  (cName) => `Punguza Kiasi cha Umwagiliaji wa ${cName} kwa 30%`,
    rec_body_reduce:   (m, fc) =>
      `Umwagiliaji wa leo ulifanya unyevu ufikia ${m}% — zaidi ya lengo la ${fc}% FC. ` +
      `Udongo ulikuwa na maji mengi, ukiunda hatari ya magonjwa na kupungua kwa ubora. Punguza kipindi cha kesho kwa 30%.`,
    rec_title_split:   'Gawanya Umwagiliaji Katika Vipindi Viwili',
    rec_body_split:    (drop) =>
      `Uchambuzi wa EC unaonyesha anguko la ${(drop*100).toFixed(0)}% baada ya umwagiliaji — virutubisho vinaenda chini ya mizizi. ` +
      `Mwagilia 50% saa 12 asubuhi, subiri masaa 2, kisha mwagilia 50% nyingine saa 2 asubuhi. Hii inapunguza upotevu kwa ~40%.`,
    rec_title_timing:  'Mwagilia Asubuhi Tu (Kabla ya Saa 3)',
    rec_body_timing:   () =>
      `Joto linafikia kilele cha 30–34°C kati ya saa 6–9. Kumwagilia wakati wa joto kali kunaongeza hasara ya maji kwa 15–20%. ` +
      `Kamilisha umwagiliaji wote kabla ya saa tatu (9:00) kwa ufanisi wa juu.`,
    rec_applied:       '✓ Imetekelezwa',
    rec_mark_applied:  '✓ Imetekelezwa',

    sci_title:         'Indeksi ya Mtaji wa Udongo',
    sci_low_class:     'UAINISHAJI WA CHINI',
    sci_med_class:     'UAINISHAJI WA WASTANI',
    sci_high_class:    'UAINISHAJI WA JUU',
    sci_why:           (score) =>
      score > 70
        ? `SCI ${score}/100 — Afya ya udongo bora. Ushikiliaji wa maji wa juu, mboji nzuri. Lengo limedumishwa.`
        : score > 40
        ? `SCI ${score}/100 — Uwezo wa wastani. Umwagiliaji mzuri unaoendelea unaweza kufikia JUU (70+) msimu huu.`
        : `SCI ${score}/100 — Afya ya udongo duni. Urekebishaji wa udongo na umwagiliaji uliobadilishwa unahitajika mara moja.`,

    eti_low:   'AINA 1 — MAHITAJI MADOGO',
    eti_mod:   'AINA 2 — MAHITAJI YA WASTANI',
    eti_high:  'AINA 3 — MAHITAJI MAKUBWA',
    eti_why_low:  () =>
      `ETI ya chini — kizuizi cha kiwango cha kukauka kimewekwa kwa −10%. Udongo unashikilia unyevu kwa muda mrefu zaidi ya wastani. Haja ya umwagiliaji imepungua.`,
    eti_why_mod:  () =>
      `ETI ya wastani — kiwango cha kawaida cha kukauka kinatumika. Kizingiti cha kawaida cha umwagiliaji kinafanya kazi. Hakuna marekebisho ya haja.`,
    eti_why_high: (cName) =>
      `ETI ya juu — kiwango cha kukauka kimeharakishwa kwa +20%. ${cName} inapoteza unyevu haraka zaidi ya mfano wa hatua ya mazao unavyotarajia. ` +
      `Mzunguko wa umwagiliaji unapaswa kufupishwa na vizingiti vya kuanza kupandishwa.`,

    proto_title:  'Hali ya Uigaji wa Mfano',
    proto_body:   `Programu hii inatumia injini ya uigaji wa kilimo inayotokana na sheria — si data ya sensori moja kwa moja. ` +
      `Masomo yote yanaigwa kisayansi kulingana na wasifu wa mazao (Damian), maji ya udongo (Saida), ` +
      `na mienendo ya hali ya hewa kutoka vigezo vya FAO/CGIAR vilivyopitiwa na wataalam. ` +
      `Muunganiko wa sensori moja kwa moja wa ESP32 umepangwa kwa Awamu ya 2. ` +
      `Uchunguzi ni makadirio ya majaribio, si ushauri wa kilimo uliosajiliwa.`,

    arch_layer1: 'SAFU YA 1 — SENSORI ZA SHAMBA',
    arch_layer2: 'SAFU YA 2 — INJINI YA USINDIKAJI',
    arch_layer3: 'SAFU YA 3 — MSINGI WA MAARIFA YA KILIMO',
    arch_layer4: 'SAFU YA 4 — KIOLESURA CHA MTUMIAJI',
  },
};

// ── HELPER — get current language string ──────────────────────────
function t(key, ...args) {
  const lang = (window._lang || 'en');
  const val = TR[lang][key];
  if (typeof val === 'function') return val(...args);
  return val || TR['en'][key] || key;
}

if (typeof window !== 'undefined') {
  window.TR = TR;
  window.t  = t;
  window._lang = 'en';
}
