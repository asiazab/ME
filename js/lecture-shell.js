/**
 * Lecture step viewer — expects window.LECTURE = { title, subtitle, course?, steps: [...] }
 * Each step: { title, lead?, blocks?, viz?, vizCaption? }
 * blocks: [{ type: 'p'|'ul'|'tip', text: string | string[] }]
 */
(function () {
  "use strict";

  const $ = (sel, el = document) => el.querySelector(sel);

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function pad2(num) {
    return String(num).padStart(2, "0");
  }

  function renderBlocks(blocks) {
    if (!blocks || !blocks.length) return "";
    return blocks
      .map((b) => {
        if (b.type === "p") {
          return `<div class="content-block"><p>${escapeHtml(b.text)}</p></div>`;
        }
        if (b.type === "ul") {
          const items = (Array.isArray(b.text) ? b.text : [b.text])
            .map((t) => `<li>${escapeHtml(t)}</li>`)
            .join("");
          return `<div class="content-block"><ul>${items}</ul></div>`;
        }
        if (b.type === "tip") {
          return `<div class="content-block tip">${escapeHtml(b.text)}</div>`;
        }
        return "";
      })
      .join("");
  }

  /* -------- SVG visuals (economics-friendly, simple English labels) -------- */
  const V = {
    none: () => "",

    welcome: () => `
      <svg viewBox="0 0 320 200" aria-hidden="true">
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="var(--accent)"/>
            <stop offset="100%" stop-color="#a855f7"/>
          </linearGradient>
        </defs>
        <rect x="24" y="32" width="272" height="136" rx="20" fill="var(--accent-soft)" stroke="var(--border)"/>
        <circle class="pulse-dot" cx="160" cy="96" r="28" fill="url(#g1)"/>
        <path d="M148 96l8 8 18-18" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="160" y="168" text-anchor="middle" fill="var(--text-muted)" font-size="13" font-family="inherit">One short step at a time</text>
      </svg>`,

    scarcity: () => `
      <svg viewBox="0 0 320 200" aria-hidden="true">
        <text x="20" y="28" fill="var(--text-muted)" font-size="12" font-family="inherit">Limited stuff, unlimited wants</text>
        <rect x="40" y="52" width="100" height="120" rx="12" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="2"/>
        <text x="90" y="118" text-anchor="middle" fill="var(--text)" font-size="14" font-family="inherit">Resources</text>
        <path d="M160 110h60" stroke="var(--text-muted)" stroke-width="2" marker-end="url(#arr)"/>
        <defs><marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="var(--text-muted)"/></marker></defs>
        <rect x="240" y="48" width="60" height="128" rx="12" fill="none" stroke="var(--border)" stroke-dasharray="6 6"/>
        <text x="270" y="92" text-anchor="middle" fill="var(--text-muted)" font-size="11" font-family="inherit">Many</text>
        <text x="270" y="112" text-anchor="middle" fill="var(--text-muted)" font-size="11" font-family="inherit">wants</text>
      </svg>`,

    opportunity: () => `
      <svg viewBox="0 0 320 200" aria-hidden="true">
        <text x="20" y="26" fill="var(--text-muted)" font-size="12" font-family="inherit">Choosing A means giving up B</text>
        <circle cx="90" cy="110" r="36" fill="var(--success)" opacity="0.2" stroke="var(--success)" stroke-width="2"/>
        <text x="90" y="116" text-anchor="middle" fill="var(--text)" font-size="13" font-family="inherit">Option A</text>
        <circle cx="230" cy="110" r="36" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="2" opacity="0.5"/>
        <text x="230" y="116" text-anchor="middle" fill="var(--text-muted)" font-size="13" font-family="inherit">Next best</text>
        <text x="160" y="182" text-anchor="middle" fill="var(--text-muted)" font-size="11" font-family="inherit">Opportunity cost ≈ value of the next best thing you skip</text>
      </svg>`,

    microMacro: () => `
      <svg viewBox="0 0 320 200" aria-hidden="true">
        <rect x="24" y="48" width="130" height="120" rx="14" fill="var(--accent-soft)" stroke="var(--border)"/>
        <text x="89" y="78" text-anchor="middle" fill="var(--accent)" font-size="13" font-weight="700" font-family="inherit">Micro</text>
        <text x="89" y="102" text-anchor="middle" fill="var(--text)" font-size="11" font-family="inherit">One firm / person</text>
        <text x="89" y="122" text-anchor="middle" fill="var(--text)" font-size="11" font-family="inherit">Prices in a market</text>
        <rect x="166" y="48" width="130" height="120" rx="14" fill="var(--bg)" stroke="var(--border)"/>
        <text x="231" y="78" text-anchor="middle" fill="var(--accent)" font-size="13" font-weight="700" font-family="inherit">Macro</text>
        <text x="231" y="102" text-anchor="middle" fill="var(--text)" font-size="11" font-family="inherit">Whole country</text>
        <text x="231" y="122" text-anchor="middle" fill="var(--text)" font-size="11" font-family="inherit">Inflation, jobs, GDP</text>
      </svg>`,

    positiveNormative: () => `
      <svg viewBox="0 0 320 200" aria-hidden="true">
        <rect x="24" y="56" width="268" height="56" rx="12" fill="var(--bg)" stroke="var(--border)"/>
        <text x="40" y="82" fill="var(--text)" font-size="12" font-family="inherit"><tspan font-weight="700">Positive:</tspan> “Prices rose 5%.” (fact)</text>
        <rect x="24" y="124" width="268" height="56" rx="12" fill="var(--accent-soft)" stroke="var(--border)"/>
        <text x="40" y="150" fill="var(--text)" font-size="12" font-family="inherit"><tspan font-weight="700">Normative:</tspan> “Prices should be lower.” (opinion)</text>
      </svg>`,

    marginal: () => `
      <svg viewBox="0 0 320 200" aria-hidden="true">
        <text x="20" y="28" fill="var(--text-muted)" font-size="12" font-family="inherit">Think at the margin = one more unit</text>
        <rect x="48" y="60" width="96" height="100" rx="12" fill="var(--success)" opacity="0.15" stroke="var(--success)"/>
        <text x="96" y="100" text-anchor="middle" fill="var(--text)" font-size="12" font-family="inherit">Extra</text>
        <text x="96" y="118" text-anchor="middle" fill="var(--text)" font-size="12" font-family="inherit">benefit</text>
        <rect x="176" y="60" width="96" height="100" rx="12" fill="var(--accent-soft)" stroke="var(--accent)"/>
        <text x="224" y="100" text-anchor="middle" fill="var(--text)" font-size="12" font-family="inherit">Extra</text>
        <text x="224" y="118" text-anchor="middle" fill="var(--text)" font-size="12" font-family="inherit">cost</text>
        <text x="160" y="188" text-anchor="middle" fill="var(--text-muted)" font-size="11" font-family="inherit">Choose “one more” if extra benefit ≥ extra cost</text>
      </svg>`,

    market: () => `
      <svg viewBox="0 0 320 200" aria-hidden="true">
        <text x="160" y="26" text-anchor="middle" fill="var(--text-muted)" font-size="12" font-family="inherit">Market = buyers meet sellers</text>
        <g fill="var(--accent)">
          <circle cx="70" cy="100" r="10"/><circle cx="100" cy="88" r="10"/><circle cx="100" cy="118" r="10"/>
        </g>
        <text x="85" y="150" text-anchor="middle" fill="var(--text)" font-size="11" font-family="inherit">Many buyers</text>
        <rect x="130" y="72" width="60" height="56" rx="10" fill="var(--accent-soft)" stroke="var(--border)"/>
        <text x="160" y="104" text-anchor="middle" fill="var(--text)" font-size="12" font-weight="700" font-family="inherit">Good</text>
        <g fill="var(--success)">
          <rect x="230" y="82" width="22" height="22" rx="4"/><rect x="258" y="92" width="22" height="22" rx="4"/>
        </g>
        <text x="255" y="150" text-anchor="middle" fill="var(--text)" font-size="11" font-family="inherit">Many sellers</text>
      </svg>`,

    demandVertical: () => `
      <svg viewBox="0 0 320 220" aria-hidden="true">
        <text x="24" y="24" fill="var(--text-muted)" font-size="12" font-family="inherit">Perfectly inelastic demand (Ed = 0)</text>
        <line x1="48" y1="180" x2="280" y2="180" stroke="var(--text-muted)" stroke-width="2"/>
        <line x1="48" y1="180" x2="48" y2="40" stroke="var(--text-muted)" stroke-width="2"/>
        <text x="288" y="186" fill="var(--text-muted)" font-size="11" font-family="inherit">Q</text>
        <text x="40" y="36" fill="var(--text-muted)" font-size="11" font-family="inherit">P</text>
        <line x1="200" y1="52" x2="200" y2="180" stroke="var(--accent)" stroke-width="4" stroke-linecap="round"/>
        <text x="212" y="120" fill="var(--accent)" font-size="14" font-weight="700" font-family="inherit">D</text>
      </svg>`,

    demandHorizontal: () => `
      <svg viewBox="0 0 320 220" aria-hidden="true">
        <text x="24" y="24" fill="var(--text-muted)" font-size="12" font-family="inherit">Perfectly elastic demand (Ed = ∞)</text>
        <line x1="48" y1="180" x2="280" y2="180" stroke="var(--text-muted)" stroke-width="2"/>
        <line x1="48" y1="180" x2="48" y2="40" stroke="var(--text-muted)" stroke-width="2"/>
        <text x="288" y="186" fill="var(--text-muted)" font-size="11" font-family="inherit">Q</text>
        <text x="40" y="36" fill="var(--text-muted)" font-size="11" font-family="inherit">P</text>
        <line x1="48" y1="130" x2="270" y2="130" stroke="var(--accent)" stroke-width="3" stroke-linecap="round"/>
        <text x="200" y="122" fill="var(--accent)" font-size="14" font-weight="700" font-family="inherit">D</text>
      </svg>`,

    demandCurve: () => `
      <svg viewBox="0 0 320 220" aria-hidden="true">
        <text x="24" y="24" fill="var(--text-muted)" font-size="12" font-family="inherit">Demand: higher price → people buy less</text>
        <line x1="48" y1="180" x2="280" y2="180" stroke="var(--text-muted)" stroke-width="2"/>
        <line x1="48" y1="180" x2="48" y2="40" stroke="var(--text-muted)" stroke-width="2"/>
        <text x="288" y="186" fill="var(--text-muted)" font-size="11" font-family="inherit">Q</text>
        <text x="40" y="36" fill="var(--text-muted)" font-size="11" font-family="inherit">P</text>
        <path class="draw-path" d="M72 56 Q 200 120 260 170" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round"/>
        <text x="200" y="64" fill="var(--accent)" font-size="13" font-weight="700" font-family="inherit">D</text>
      </svg>`,

    supplyCurve: () => `
      <svg viewBox="0 0 320 220" aria-hidden="true">
        <text x="24" y="24" fill="var(--text-muted)" font-size="12" font-family="inherit">Supply: higher price → firms sell more</text>
        <line x1="48" y1="180" x2="280" y2="180" stroke="var(--text-muted)" stroke-width="2"/>
        <line x1="48" y1="180" x2="48" y2="40" stroke="var(--text-muted)" stroke-width="2"/>
        <text x="288" y="186" fill="var(--text-muted)" font-size="11" font-family="inherit">Q</text>
        <text x="40" y="36" fill="var(--text-muted)" font-size="11" font-family="inherit">P</text>
        <path class="draw-path" d="M72 170 Q 180 120 260 52" fill="none" stroke="var(--success)" stroke-width="3" stroke-linecap="round"/>
        <text x="248" y="72" fill="var(--success)" font-size="13" font-weight="700" font-family="inherit">S</text>
      </svg>`,

    equilibrium: () => `
      <svg viewBox="0 0 320 220" aria-hidden="true">
        <text x="24" y="24" fill="var(--text-muted)" font-size="12" font-family="inherit">Equilibrium: where D and S cross</text>
        <line x1="48" y1="180" x2="280" y2="180" stroke="var(--text-muted)" stroke-width="2"/>
        <line x1="48" y1="180" x2="48" y2="40" stroke="var(--text-muted)" stroke-width="2"/>
        <path d="M72 56 Q 200 120 260 170" fill="none" stroke="var(--accent)" stroke-width="3"/>
        <path d="M72 170 Q 180 120 260 52" fill="none" stroke="var(--success)" stroke-width="3"/>
        <circle class="pulse-dot" cx="168" cy="118" r="8" fill="#f59e0b"/>
        <text x="168" y="100" text-anchor="middle" fill="var(--text)" font-size="11" font-family="inherit">P*, Q*</text>
      </svg>`,

    shiftDemandRight: () => graphShift("Demand shifts right", "D", "right", "var(--accent)"),
    shiftDemandLeft: () => graphShift("Demand shifts left", "D", "left", "var(--accent)"),
    shiftSupplyRight: () => graphShift("Supply shifts right", "S", "right", "var(--success)"),
    shiftSupplyLeft: () => graphShift("Supply shifts left", "S", "left", "var(--success)"),

    priceFloor: () => priceLine("Price floor (above equilibrium)", "high"),
    priceCeiling: () => priceLine("Price ceiling (below equilibrium)", "low"),

    elasticityStretch: () => `
      <svg viewBox="0 0 320 200" aria-hidden="true">
        <text x="20" y="28" fill="var(--text-muted)" font-size="12" font-family="inherit">Elastic = quantity reacts a lot to price</text>
        <path d="M40 120c40-50 120-50 160 0" fill="none" stroke="var(--accent)" stroke-width="4" stroke-linecap="round"/>
        <text x="120" y="78" fill="var(--accent)" font-size="12" font-weight="700" font-family="inherit">Stretchy demand</text>
        <text x="20" y="168" fill="var(--text-muted)" font-size="11" font-family="inherit">Inelastic = reaction is small (steep curve)</text>
      </svg>`,

    utilitySteps: () => `
      <svg viewBox="0 0 320 200" aria-hidden="true">
        <text x="20" y="26" fill="var(--text-muted)" font-size="12" font-family="inherit">Diminishing marginal utility</text>
        <rect x="50" y="140" width="40" height="40" rx="8" fill="var(--success)"/>
        <rect x="110" y="120" width="40" height="60" rx="8" fill="var(--success)" opacity="0.85"/>
        <rect x="170" y="100" width="40" height="80" rx="8" fill="var(--success)" opacity="0.65"/>
        <rect x="230" y="92" width="40" height="88" rx="8" fill="var(--success)" opacity="0.45"/>
        <text x="160" y="188" text-anchor="middle" fill="var(--text-muted)" font-size="11" font-family="inherit">Each extra slice adds less joy than the one before</text>
      </svg>`,

    cardinalOrdinal: () => `
      <svg viewBox="0 0 320 200" aria-hidden="true">
        <rect x="24" y="52" width="268" height="58" rx="12" fill="var(--accent-soft)" stroke="var(--border)"/>
        <text x="40" y="80" fill="var(--text)" font-size="12" font-family="inherit"><tspan font-weight="700">Cardinal:</tspan> utility as numbers (utils)</text>
        <text x="40" y="98" fill="var(--text-muted)" font-size="11" font-family="inherit">Example: pizza = 100 utils</text>
        <rect x="24" y="122" width="268" height="58" rx="12" fill="var(--bg)" stroke="var(--border)"/>
        <text x="40" y="150" fill="var(--text)" font-size="12" font-family="inherit"><tspan font-weight="700">Ordinal:</tspan> rankings only (A preferred to B)</text>
        <text x="40" y="168" fill="var(--text-muted)" font-size="11" font-family="inherit">No need for exact “utils”</text>
      </svg>`,

    budgetLine: () => `
      <svg viewBox="0 0 320 220" aria-hidden="true">
        <text x="24" y="24" fill="var(--text-muted)" font-size="12" font-family="inherit">Budget line: affordable combos of two goods</text>
        <line x1="48" y1="180" x2="280" y2="180" stroke="var(--text-muted)" stroke-width="2"/>
        <line x1="48" y1="180" x2="48" y2="40" stroke="var(--text-muted)" stroke-width="2"/>
        <text x="288" y="186" fill="var(--text-muted)" font-size="11" font-family="inherit">Pizza</text>
        <text x="40" y="36" fill="var(--text-muted)" font-size="11" font-family="inherit">Drink</text>
        <line x1="60" y1="60" x2="260" y2="170" stroke="var(--accent)" stroke-width="3"/>
        <text x="200" y="58" fill="var(--accent)" font-size="12" font-weight="700" font-family="inherit">Budget</text>
        <text x="160" y="206" text-anchor="middle" fill="var(--text-muted)" font-size="11" font-family="inherit">Slope ≈ relative prices</text>
      </svg>`,

    indifference: () => `
      <svg viewBox="0 0 320 220" aria-hidden="true">
        <text x="24" y="24" fill="var(--text-muted)" font-size="12" font-family="inherit">Indifference curve: same happiness along the curve</text>
        <line x1="48" y1="180" x2="280" y2="180" stroke="var(--text-muted)" stroke-width="2"/>
        <line x1="48" y1="180" x2="48" y2="40" stroke="var(--text-muted)" stroke-width="2"/>
        <path d="M70 170 Q 150 120 250 70" fill="none" stroke="var(--accent)" stroke-width="3"/>
        <text x="248" y="62" fill="var(--accent)" font-size="12" font-weight="700" font-family="inherit">U₁</text>
        <path d="M90 150 Q 170 100 260 52" fill="none" stroke="var(--success)" stroke-width="2" opacity="0.6"/>
        <text x="264" y="48" fill="var(--success)" font-size="11" font-family="inherit">U₂</text>
      </svg>`,

    mrs: () => `
      <svg viewBox="0 0 320 200" aria-hidden="true">
        <text x="20" y="28" fill="var(--text-muted)" font-size="12" font-family="inherit">MRS = willingness to trade one good for another</text>
        <line x1="48" y1="160" x2="260" y2="72" stroke="var(--accent)" stroke-width="3"/>
        <text x="200" y="64" fill="var(--text)" font-size="11" font-family="inherit">Slope = MRS</text>
        <text x="160" y="188" text-anchor="middle" fill="var(--text-muted)" font-size="11" font-family="inherit">At equilibrium: MRS = price ratio (tangency)</text>
      </svg>`,
  };

  function graphShift(captionSide, which, dir, color) {
    const dPath =
      which === "D"
        ? "M72 56 Q 200 120 260 170"
        : "M72 170 Q 180 120 260 52";
    const dShift =
      which === "D"
        ? dir === "right"
          ? "M102 46 Q 230 110 290 160"
          : "M42 66 Q 170 130 230 180"
        : dir === "right"
          ? "M102 180 Q 210 130 290 62"
          : "M42 180 Q 150 130 230 42";
    return `
      <svg viewBox="0 0 320 220" aria-hidden="true">
        <text x="24" y="24" fill="var(--text-muted)" font-size="11" font-family="inherit">${captionSide}</text>
        <line x1="48" y1="180" x2="280" y2="180" stroke="var(--text-muted)" stroke-width="2"/>
        <line x1="48" y1="180" x2="48" y2="40" stroke="var(--text-muted)" stroke-width="2"/>
        <path d="${dPath}" fill="none" stroke="var(--text-muted)" stroke-width="2" opacity="0.35"/>
        <path class="draw-path" d="${dShift}" fill="none" stroke="${color}" stroke-width="3"/>
        <text x="260" y="${which === "D" ? 54 : 80}" fill="${color}" font-size="13" font-weight="700" font-family="inherit">${which}2</text>
      </svg>`;
  }

  function priceLine(label, kind) {
    const y = kind === "high" ? 72 : 148;
    return `
      <svg viewBox="0 0 320 220" aria-hidden="true">
        <text x="24" y="24" fill="var(--text-muted)" font-size="11" font-family="inherit">${label}</text>
        <line x1="48" y1="180" x2="280" y2="180" stroke="var(--text-muted)" stroke-width="2"/>
        <line x1="48" y1="180" x2="48" y2="40" stroke="var(--text-muted)" stroke-width="2"/>
        <path d="M72 56 Q 200 120 260 170" fill="none" stroke="var(--accent)" stroke-width="2"/>
        <path d="M72 170 Q 180 120 260 52" fill="none" stroke="var(--success)" stroke-width="2"/>
        <line x1="40" y1="${y}" x2="280" y2="${y}" stroke="#f59e0b" stroke-width="2" stroke-dasharray="6 4"/>
        <text x="286" y="${y + 4}" fill="#f59e0b" font-size="11" font-family="inherit">P̄</text>
      </svg>`;
  }

  function renderViz(key) {
    if (!key || key === "none") return "";
    const fn = V[key];
    if (typeof fn !== "function") return "";
    return fn();
  }

  function getStepSourceRef(lecture, step, index) {
    let ref = null;

    if (step && step.slideRef) {
      ref = step.slideRef;
    } else if (Array.isArray(lecture.slideRefs)) {
      ref = lecture.slideRefs[index] || null;
    } else if (step && typeof step.slidePage === "number" && lecture.slideDeck) {
      ref = { deck: lecture.slideDeck, page: step.slidePage };
    } else if (Array.isArray(lecture.slidePages) && lecture.slideDeck) {
      const page = lecture.slidePages[index];
      if (typeof page === "number") {
        ref = { deck: lecture.slideDeck, page };
      }
    }

    if (!ref) return null;
    if (typeof ref === "number" && lecture.slideDeck) {
      ref = { deck: lecture.slideDeck, page: ref };
    }

    const normalized = { ...ref };
    if (!normalized.src && normalized.deck && normalized.page) {
      normalized.src = `assets/lecture-images/${normalized.deck}/page-${pad2(normalized.page)}.png`;
    }
    return normalized.src ? normalized : null;
  }

  function renderSourceFigure(lecture, sourceRef) {
    if (!sourceRef || !sourceRef.src) return "";
    const alt = sourceRef.alt || `${lecture.title} source slide`;
    const sourceLabel =
      sourceRef.label || lecture.slideSourceLabel || "Uploaded lecture material";
    const pageLabel =
      typeof sourceRef.page === "number" ? `Slide ${sourceRef.page}` : "Source snapshot";
    const note = sourceRef.note ? ` · ${sourceRef.note}` : "";

    return `
      <figure class="source-figure step-animate-soft">
        <img src="${escapeHtml(sourceRef.src)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async" />
        <figcaption>${escapeHtml(sourceLabel)} · ${escapeHtml(pageLabel)}${escapeHtml(note)}</figcaption>
      </figure>
    `;
  }

  function initTheme() {
    const saved = localStorage.getItem("lecture-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = saved || (prefersDark ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
    const btn = $("#theme-toggle");
    if (btn) {
      btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
      $(".theme-label", btn).textContent = theme === "dark" ? "Dark" : "Light";
      $(".theme-icon", btn).textContent = theme === "dark" ? "🌙" : "☀️";
    }
  }

  function toggleTheme() {
    const cur = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("lecture-theme", next);
    const btn = $("#theme-toggle");
    if (btn) {
      btn.setAttribute("aria-pressed", next === "dark" ? "true" : "false");
      $(".theme-label", btn).textContent = next === "dark" ? "Dark" : "Light";
      $(".theme-icon", btn).textContent = next === "dark" ? "🌙" : "☀️";
    }
  }

  function initMascot() {
    const host = $("#mascot");
    if (!host) return;
    const url =
      host.getAttribute("data-lottie-url") ||
      "https://fonts.gstatic.com/s/e/notoemoji/latest/1f4da/lottie.json";

    function fallback() {
      host.innerHTML =
        '<div class="mascot-fallback" aria-hidden="true" style="font-size:28px;line-height:1;animation:mascotBounce 2.2s ease-in-out infinite">📚</div>';
      if (!document.getElementById("mascot-bounce-style")) {
        const style = document.createElement("style");
        style.id = "mascot-bounce-style";
        style.textContent =
          "@keyframes mascotBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}";
        document.head.appendChild(style);
      }
    }

    function runLottie() {
      if (!window.lottie) {
        fallback();
        return;
      }
      fetch(url)
        .then((r) => {
          if (!r.ok) throw new Error("lottie fetch");
          return r.json();
        })
        .then((data) => {
          host.innerHTML = "";
          window.lottie.loadAnimation({
            container: host,
            renderer: "svg",
            loop: true,
            autoplay: true,
            animationData: data,
          });
        })
        .catch(fallback);
    }

    if (window.lottie) {
      runLottie();
      return;
    }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js";
    s.async = true;
    s.onload = runLottie;
    s.onerror = fallback;
    document.head.appendChild(s);
  }

  function init() {
    const L = window.LECTURE;
    if (!L || !L.steps || !L.steps.length) {
      console.error("LECTURE data missing");
      return;
    }

    initTheme();
    initMascot();

    $("#brand-kicker").textContent = L.course || "Study mode";
    $("#brand-title").textContent = L.title;
    $("#brand-sub").textContent = L.subtitle || "";

    const prev = $("#btn-prev");
    const next = $("#btn-next");
    const main = $("#step-main");
    const fill = $("#stepper-fill");
    const curEl = $("#step-current");
    const totEl = $("#step-total");
    const live = $("#step-live");

    let i = 0;
    const n = L.steps.length;
    totEl.textContent = String(n);

    function render() {
      const s = L.steps[i];
      const pct = n <= 1 ? 100 : (i / (n - 1)) * 100;
      fill.style.width = pct + "%";
      curEl.textContent = String(i + 1);

      const vizHtml = renderViz(s.viz);
      const sourceRef = getStepSourceRef(L, s, i);
      const sourceHtml = renderSourceFigure(L, sourceRef);
      const cap = s.vizCaption
        ? `<p class="viz-caption">${escapeHtml(s.vizCaption)}</p>`
        : "";

      main.innerHTML = `
        <article class="card step-animate" aria-labelledby="step-title">
          <h2 id="step-title" class="step-title">${escapeHtml(s.title)}</h2>
          ${s.lead ? `<p class="step-lead">${escapeHtml(s.lead)}</p>` : ""}
          ${renderBlocks(s.blocks)}
          ${sourceHtml}
          ${
            vizHtml
              ? `<div class="viz" role="img" aria-label="Illustration">${vizHtml}</div>${cap}`
              : ""
          }
        </article>
      `;

      main.querySelectorAll(".source-figure img").forEach((img) => {
        img.addEventListener(
          "error",
          () => {
            const figure = img.closest(".source-figure");
            if (figure) figure.remove();
          },
          { once: true }
        );
      });

      if (live) live.textContent = `Step ${i + 1} of ${n}: ${s.title}`;

      prev.disabled = i === 0;
      next.disabled = i === n - 1;
      next.textContent = i === n - 1 ? "Done ♡" : "Next →";

      history.replaceState(null, "", "#step-" + (i + 1));
    }

    function go(delta) {
      const j = i + delta;
      if (j < 0 || j >= n) return;
      i = j;
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    prev.addEventListener("click", () => go(-1));
    next.addEventListener("click", () => {
      if (i < n - 1) go(1);
      else {
        next.textContent = "Cute!";
        setTimeout(() => {
          next.textContent = "Next →";
        }, 900);
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        go(1);
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        go(-1);
      }
    });

    let touchStartX = null;
    document.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.changedTouches[0].screenX;
      },
      { passive: true }
    );
    document.addEventListener(
      "touchend",
      (e) => {
        if (touchStartX === null) return;
        const dx = e.changedTouches[0].screenX - touchStartX;
        if (Math.abs(dx) > 56) {
          if (dx < 0) go(1);
          else go(-1);
        }
        touchStartX = null;
      },
      { passive: true }
    );

    $("#theme-toggle").addEventListener("click", toggleTheme);

    const hash = location.hash.match(/^#step-(\d+)/);
    if (hash) {
      const num = parseInt(hash[1], 10);
      if (num >= 1 && num <= n) i = num - 1;
    }

    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
