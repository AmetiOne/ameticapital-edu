/* Shared calculator helpers for ameticapital.com educational tools (break-even, contribution margin).
   Inputs stay in the browser; no network calls.
   2026-11-08 (Site 16, "The Crossing"): computation and guards are the site's implementation of
   record, unchanged. Added: the designed break-even record + to-scale chart and the
   contribution-format statement rendered from the same computed values (CHALLENGE conditions 1-6, 8). */
(function () {
  const money = (n) => {
    if (n !== 0 && Math.abs(n) < 0.000001) {
      return (n < 0 ? '−' : '') + 'less than $0.000001';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: n !== 0 && Math.abs(n) < 0.01 ? 6 : 2
    }).format(n);
  };
  const num = (n) => n !== 0 && Math.abs(n) < 0.0001
    ? n.toExponential(4)
    : n.toLocaleString('en-US', { maximumFractionDigits: 4 });
  const pct = (n) => num(n * 100) + '%';
  // Subnormal numbers lose relative precision; this worksheet does not support them.
  const isSupportedNumber = (n) => Number.isFinite(n) &&
    (n === 0 || Math.abs(n) >= 2 ** -1022);
  // Condition 8: compact axis ticks at extreme ratios (10K, 1.2M).
  const compact = (n) => {
    const a = Math.abs(n);
    const trim = (x) => String(Math.round(x * 100) / 100);
    if (a !== 0 && a < 0.0001) return n.toExponential(1);
    if (a >= 1e12) return trim(n / 1e12) + 'T';
    if (a >= 1e9) return trim(n / 1e9) + 'B';
    if (a >= 1e6) return trim(n / 1e6) + 'M';
    if (a >= 1e4) return trim(n / 1e3) + 'K';
    return num(n);
  };
  const moneyTick = (n) => (n < 0 ? '-$' + compact(-n) : '$' + compact(n));
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

  const ANNOTATION = 'Assumes constant price, unit variable cost, fixed costs and a single product / fixed sales mix within the relevant range.';

  function beChart(r) {
    // Deterministic axis bounds (condition 3).
    let qMax, offScale = false;
    if (r.target > 0) {
      const focal = Math.max(r.ceilUnits, r.ceilTarget);
      qMax = Math.min(1.25 * focal, 4 * r.ceilUnits);
      offScale = r.ceilTarget > 4 * r.ceilUnits;
    } else {
      qMax = 1.5 * r.ceilUnits;
    }
    const focalOnChart = offScale ? r.ceilUnits : Math.max(r.ceilUnits, r.target > 0 ? r.ceilTarget : 0);
    const yMax = r.price * qMax;
    const W = 680, H = 448, L = 74, R = 168, T = 34, B = 92;
    const pw = W - L - R, ph = H - T - B;
    const X = (q) => L + (q / qMax) * pw;
    const Y = (d) => T + ph - (d / yMax) * ph;
    const f1 = (n) => Math.round(n * 10) / 10;
    const tr = (q) => r.price * q;
    const tc = (q) => r.fixed + r.variable * q;
    let s = '';
    s += `<svg viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="be-chart-t be-chart-d" class="chart-svg">`;
    s += `<title id="be-chart-t">Break-even chart for the values above</title>`;
    s += `<desc id="be-chart-d">Total revenue and total cost cross at ${num(r.units)} units and ${money(r.revenue)}. The first whole unit covering fixed costs is ${num(r.ceilUnits)}. Lines are dashed beyond the focal volume; the chart ${esc(ANNOTATION.charAt(0).toLowerCase() + ANNOTATION.slice(1))}</desc>`;
    // gridlines + y ticks
    for (let i = 0; i <= 3; i++) {
      const d = (yMax / 3) * i, y = Y(d);
      s += `<line x1="${L}" y1="${f1(y)}" x2="${L + pw}" y2="${f1(y)}" stroke="#c5d0c9" stroke-width="${i === 0 ? 1.4 : 0.7}"/>`;
      s += `<text x="${L - 8}" y="${f1(y + 4)}" text-anchor="end" class="tick">${moneyTick(d)}</text>`;
    }
    // x ticks: 0, exact break-even (guide), whole-unit ceiling when separable, axis max
    s += `<text x="${L}" y="${H - B + 20}" text-anchor="middle" class="tick">0</text>`;
    s += `<text x="${f1(X(qMax))}" y="${H - B + 20}" text-anchor="middle" class="tick">${compact(qMax)}</text>`;
    s += `<text x="${f1(X(r.units))}" y="${H - B + 20}" text-anchor="middle" class="tick tick-exact">${num(r.units)}</text>`;
    if (X(r.ceilUnits) - X(r.units) >= 34 && r.ceilUnits !== r.units) {
      s += `<text x="${f1(X(r.ceilUnits))}" y="${H - B + 20}" text-anchor="middle" class="tick">${num(r.ceilUnits)}</text>`;
      s += `<text x="${f1(X(r.ceilUnits))}" y="${H - B + 38}" text-anchor="middle" class="tick-sub">whole units</text>`;
    }
    // region labels (scoped per condition 3), solid zone only
    s += `<text x="${L + 8}" y="${T + 16}" class="region">Net Loss (TR &lt; TC)</text>`;
    s += `<text x="${f1(X(r.units)) + 14}" y="${H - B - 28}" class="region">Net Operating Income</text>`;
    s += `<text x="${f1(X(r.units)) + 14}" y="${H - B - 12}" class="region">(TR &gt; TC, within relevant range)</text>`;
    // dashed extensions first (under solid), condition 2
    s += `<line x1="${f1(X(focalOnChart))}" y1="${f1(Y(tr(focalOnChart)))}" x2="${f1(X(qMax))}" y2="${f1(Y(tr(qMax)))}" stroke="#3d5650" stroke-width="2.4" stroke-dasharray="6 5"/>`;
    s += `<line x1="${f1(X(focalOnChart))}" y1="${f1(Y(tc(focalOnChart)))}" x2="${f1(X(qMax))}" y2="${f1(Y(tc(qMax)))}" stroke="#b07a2a" stroke-width="2.4" stroke-dasharray="6 5"/>`;
    // solid lines
    s += `<line x1="${L}" y1="${f1(Y(0))}" x2="${f1(X(focalOnChart))}" y2="${f1(Y(tr(focalOnChart)))}" stroke="#3d5650" stroke-width="2.6"/>`;
    s += `<line x1="${L}" y1="${f1(Y(r.fixed))}" x2="${f1(X(focalOnChart))}" y2="${f1(Y(tc(focalOnChart)))}" stroke="#b07a2a" stroke-width="2.6"/>`;
    // fixed-cost intercept label
    s += `<text x="${L - 8}" y="${f1(Y(r.fixed) - 8)}" text-anchor="end" class="line-label">Fixed costs</text>`;
    // line-end labels
    s += `<text x="${f1(X(focalOnChart)) + 9}" y="${f1(Y(tr(focalOnChart)) - 4)}" class="line-label">Total revenue</text>`;
    s += `<text x="${f1(X(focalOnChart)) + 9}" y="${f1(Y(tc(focalOnChart)) + 14)}" class="line-label">Total cost</text>`;
    // target-profit bracket (condition 4): vertical bracket at Q_TP between TC and TR
    if (r.target > 0 && !offScale) {
      const xb = X(r.targetUnits), yTop = Y(tr(r.targetUnits)), yBot = Y(tc(r.targetUnits));
      s += `<line x1="${f1(xb)}" y1="${f1(yBot)}" x2="${f1(xb)}" y2="${f1(yTop)}" stroke="#172f33" stroke-width="1.6"/>`;
      s += `<path d="M ${f1(xb - 4)} ${f1(yTop + 7)} L ${f1(xb)} ${f1(yTop)} L ${f1(xb + 4)} ${f1(yTop + 7)}" fill="none" stroke="#172f33" stroke-width="1.6"/>`;
      s += `<path d="M ${f1(xb - 4)} ${f1(yBot - 7)} L ${f1(xb)} ${f1(yBot)} L ${f1(xb + 4)} ${f1(yBot - 7)}" fill="none" stroke="#172f33" stroke-width="1.6"/>`;
      const anchorEnd = xb > L + pw * 0.5;
      const lx = anchorEnd ? xb - 9 : xb + 9;
      s += `<text x="${f1(lx)}" y="${f1((yTop + yBot) / 2 - 2)}" text-anchor="${anchorEnd ? 'end' : 'start'}" class="callout">Target profit ${money(r.target)}</text>`;
      s += `<text x="${f1(lx)}" y="${f1((yTop + yBot) / 2 + 15)}" text-anchor="${anchorEnd ? 'end' : 'start'}" class="callout-sub">at ${num(r.ceilTarget)} whole units</text>`;
      s += `<line x1="${f1(xb)}" y1="${f1(Y(0))}" x2="${f1(xb)}" y2="${f1(yTop)}" stroke="#172f33" stroke-width="0.8" stroke-dasharray="2 4"/>`;
    }
    if (offScale) {
      s += `<text x="${L + pw}" y="${T + 16}" text-anchor="end" class="callout">Target volume is beyond this chart's range (axis capped at 4× whole-unit break-even) — see the record.</text>`;
    }
    // exact-intersection guide + crossing dot + callout (condition 1)
    s += `<line x1="${f1(X(r.units))}" y1="${f1(Y(r.revenue))}" x2="${f1(X(r.units))}" y2="${f1(Y(0))}" stroke="#526568" stroke-width="0.9" stroke-dasharray="2 4"/>`;
    s += `<circle cx="${f1(X(r.units))}" cy="${f1(Y(r.revenue))}" r="5.5" fill="#b07a2a" stroke="#fff" stroke-width="1.6"/>`;
    const callAnchor = X(r.units) > L + pw * 0.62 ? 'end' : 'start';
    const callX = callAnchor === 'end' ? X(r.units) - 10 : X(r.units) + 10;
    s += `<text x="${f1(callX)}" y="${f1(Y(r.revenue) - 24)}" text-anchor="${callAnchor}" class="callout">Exact break-even</text>`;
    s += `<text x="${f1(callX)}" y="${f1(Y(r.revenue) - 8)}" text-anchor="${callAnchor}" class="callout-sub">${num(r.units)} units · ${money(r.revenue)}</text>`;
    // in-SVG annotation (condition 2): dashed key + linearity/relevant-range sentence
    s += `<text x="${L}" y="${H - 30}" class="annot">Dashed lines project the same lines beyond the focal volume.</text>`;
    s += `<text x="${L}" y="${H - 12}" class="annot">${esc(ANNOTATION)}</text>`;
    s += '</svg>';
    return s;
  }

  function statusLine(r) {
    return r.illustrative
      ? 'For the form’s starting values — the site’s illustrative example.'
      : 'For the values you entered above.';
  }

  function beRecord(r) {
    let h = `<p class="record-status"><strong>Break-even record.</strong> ${statusLine(r)}</p>`;
    if (r.state === 'nonpositive') {
      h += `<div class="record-statement">${r.lines.map((t) => `<p>${esc(t)}</p>`).join('')}</div>`;
      return h;
    }
    if (r.state === 'zero-fixed') {
      h += `<div class="record-statement"><p>Break-even is at <strong>zero units</strong>: with no fixed costs to cover, every unit contributes from the first sale.</p>` +
        `<p>Contribution margin per unit: ${money(r.cm)} · Contribution margin ratio: ${pct(r.ratio)}</p></div>`;
      return h;
    }
    const residual = r.ceilUnits * r.cm - r.fixed;
    h += '<table class="record-table"><tbody>';
    h += `<tr><th scope="row">Contribution margin per unit</th><td>${money(r.cm)}</td></tr>`;
    h += `<tr><th scope="row">Contribution margin ratio</th><td>${pct(r.ratio)}</td></tr>`;
    h += `<tr><th scope="row">Exact break-even (algebra)</th><td>${num(r.units)} units · ${money(r.revenue)} revenue — revenue equals total cost</td></tr>`;
    if (residual === 0) {
      h += `<tr><th scope="row">Whole-unit break-even</th><td>${num(r.ceilUnits)} units — the exact point is already a whole unit</td></tr>`;
    } else {
      h += `<tr><th scope="row">Whole-unit break-even (rounded up)</th><td>${num(r.ceilUnits)} units · revenue ${money(r.ceilUnits * r.price)} vs total cost ${money(r.fixed + r.ceilUnits * r.variable)} → ${money(residual)} operating income</td></tr>`;
    }
    if (r.target > 0) {
      h += `<tr><th scope="row">Units for ${money(r.target)} target profit</th><td>${num(r.targetUnits)} exact · round up to ${num(r.ceilTarget)} whole units · revenue ${money(r.targetUnits * r.price)} exact, ${money(r.ceilTarget * r.price)} at ${num(r.ceilTarget)} units</td></tr>`;
    }
    h += '</tbody></table>';
    h += `<p class="note">Units are rounded up — a third of a unit cannot be sold. The exact and whole-unit figures are two statements of the same crossing, not two break-even points. ${esc(ANNOTATION)}</p>`;
    h += `<figure class="be-chart">${beChart(r)}<figcaption class="note">To-scale chart drawn from the values above. The record table is the same result in text.</figcaption></figure>`;
    return h;
  }

  function cmStatement(r) {
    let h = `<p class="record-status"><strong>Contribution-format income statement.</strong> ${statusLine(r)}</p>`;
    h += '<table class="statement"><caption class="stmt-note">Amounts in US dollars; per-unit column divides by units sold.</caption>';
    h += '<thead><tr><th scope="col">Line</th><th scope="col" class="num-col">Total</th><th scope="col" class="num-col">Per unit</th><th scope="col" class="num-col">% of sales</th></tr></thead><tbody>';
    const pctOf = (x) => (r.sales > 0 ? pct(x / r.sales) : '—');
    h += `<tr><th scope="row">Sales</th><td class="num-col">${money(r.sales)}</td><td class="num-col">${money(r.price)}</td><td class="num-col">${pctOf(r.sales)}</td></tr>`;
    h += `<tr><th scope="row">Variable costs</th><td class="num-col">${money(r.totalVariable)}</td><td class="num-col">${money(r.variable)}</td><td class="num-col">${pctOf(r.totalVariable)}</td></tr>`;
    h += `<tr class="rule-top"><th scope="row">${r.total < 0 ? 'Negative contribution margin' : 'Contribution margin'}</th><td class="num-col">${money(r.total)}</td><td class="num-col">${money(r.cm)}</td><td class="num-col">${pctOf(r.total)}</td></tr>`;
    if (r.fixed > 0) {
      h += `<tr><th scope="row">Fixed costs</th><td class="num-col">${money(r.fixed)}</td><td class="num-col"></td><td class="num-col"></td></tr>`;
      h += `<tr class="rule-top rule-double"><th scope="row">${r.income < 0 ? 'Net Operating Loss' : 'Net Operating Income'}</th><td class="num-col">${money(r.income)}</td><td class="num-col"></td><td class="num-col"></td></tr>`;
    }
    h += '</tbody></table>';
    if (!(r.fixed > 0)) h += '<p class="note">Enter fixed costs above to extend this statement to operating income.</p>';
    if (r.cm <= 0) h += '<p class="note">Variable cost is at or above price, so each sale adds no contribution.</p>';
    return h;
  }

  document.querySelectorAll('[data-tool]').forEach((form, index) => {
    const out = form.querySelector('output');
    if (!out) return;
    if (!out.id) out.id = `${form.dataset.tool}-result-${index}`;
    const viz = form.querySelector('[data-viz]');
    let lastRecordText = '';

    function calculate() {
      const fail = (msg) => {
        out.textContent = msg;
        lastRecordText = msg;
        if (viz) { viz.hidden = true; viz.innerHTML = ''; }
        return false;
      };
      if (!form.checkValidity()) {
        return fail('Enter values within the stated limits.');
      }
      const inputs = [...form.querySelectorAll('input')];
      const v = Object.fromEntries(
        inputs.map((x) => [x.dataset.field || x.name, Number(x.value)])
      );
      if (Object.values(v).some((x) => !Number.isFinite(x))) {
        return fail('Enter finite values.');
      }
      if (inputs.some((x) => !isSupportedNumber(Number(x.value)) ||
          (Number(x.value) === 0 && /[1-9]/.test(x.value.split(/[eE]/)[0])))) {
        return fail('These values exceed the supported numerical range or precision. Use less extreme values.');
      }
      const illustrative = inputs.every((x) => x.value === x.defaultValue);

      let s = '';
      switch (form.dataset.tool) {
        case 'break-even': {
          const contribution = v.price - v.variable;
          if (contribution <= 0) {
            const lines = [
              'Contribution margin per unit is not positive.',
              `Price − variable cost = ${money(contribution)}`,
              contribution < 0
                ? `Each unit loses ${money(-contribution)} before fixed costs — more volume cannot fix a negative contribution. Break-even units are undefined when each unit does not cover its variable cost. Raise price or lower variable cost (illustrative only).`
                : 'Each unit contributes $0.00 toward fixed costs, so volume alone cannot reach break-even. Raise price or lower variable cost (illustrative only).'
            ];
            s = lines.join('\n');
            lastRecordText = 'BREAK-EVEN RECORD\n' + lines.join('\n');
            if (viz) {
              viz.innerHTML = beRecord({ state: 'nonpositive', lines, illustrative });
              viz.hidden = false;
            }
            break;
          }
          const target = v.target || 0;
          const units = v.fixed / contribution;
          const revenue = units * v.price;
          const ratio = contribution / v.price;
          const targetUnits = (v.fixed + target) / contribution;
          if (![contribution, units, revenue, ratio, targetUnits].every(isSupportedNumber) ||
              (v.fixed > 0 && (units === 0 || revenue === 0)) || ratio === 0) {
            return fail('These values exceed the supported numerical range or precision. Use less extreme values.');
          }
          const ceilUnits = Math.ceil(units - 1e-9);
          const ceilTarget = Math.ceil(targetUnits - 1e-9);
          const residual = ceilUnits * contribution - v.fixed;
          s =
            `Contribution margin per unit: ${money(contribution)}\n` +
            `Contribution margin ratio: ${pct(ratio)}\n` +
            `Break-even units: ${num(units)} (round up to ${num(ceilUnits)} whole units)\n` +
            `Break-even revenue: ${money(revenue)}\n` +
            `Check: ${num(units)} × ${money(contribution)} ≈ ${money(v.fixed)} fixed costs`;
          if (v.fixed === 0) {
            s += '\nBreak-even is at zero units: with no fixed costs to cover, every unit contributes from the first sale.';
          } else if (residual !== 0) {
            s += `\nWhole-unit check: ${num(ceilUnits)} units → revenue ${money(ceilUnits * v.price)} vs total cost ${money(v.fixed + ceilUnits * v.variable)} (${money(residual)} operating income)`;
          }
          if (target > 0) {
            s += `\nUnits for ${money(target)} target profit: ${num(targetUnits)} (round up to ${num(ceilTarget)})\n` +
              `Revenue for target profit: ${money(targetUnits * v.price)}`;
          }
          const rec = [
            'BREAK-EVEN RECORD',
            `Contribution margin per unit: ${money(contribution)}`,
            `Contribution margin ratio: ${pct(ratio)}`,
            `Exact break-even: ${num(units)} units; revenue ${money(revenue)} (= total cost)`,
            residual === 0
              ? `Whole-unit break-even: ${num(ceilUnits)} units — the exact point is already a whole unit`
              : `Whole-unit break-even: ${num(ceilUnits)} units; revenue ${money(ceilUnits * v.price)} vs total cost ${money(v.fixed + ceilUnits * v.variable)} (${money(residual)} operating income)`
          ];
          if (target > 0) {
            rec.push(`Units for ${money(target)} target profit: ${num(targetUnits)} (round up to ${num(ceilTarget)}); revenue ${money(targetUnits * v.price)}`);
          }
          rec.push('Units are rounded up: a third of a unit cannot be sold.');
          rec.push(ANNOTATION);
          lastRecordText = rec.join('\n');
          if (viz) {
            viz.innerHTML = beRecord(v.fixed === 0
              ? { state: 'zero-fixed', cm: contribution, ratio, illustrative }
              : {
                  state: 'ok', fixed: v.fixed, price: v.price, variable: v.variable,
                  cm: contribution, ratio, units, revenue, ceilUnits,
                  target, targetUnits, ceilTarget, illustrative
                });
            viz.hidden = false;
          }
          break;
        }
        case 'contribution-margin': {
          if (v.price <= 0) {
            s = 'Enter a selling price above zero. The contribution margin ratio is undefined at a zero price.';
            lastRecordText = s;
            if (viz) { viz.hidden = true; viz.innerHTML = ''; }
            break;
          }
          const cm = v.price - v.variable;
          const total = cm * v.units;
          const ratio = cm / v.price;
          const fixed = v.fixed || 0;
          const income = total - fixed;
          if (![cm, total, ratio, income].every(isSupportedNumber)) {
            return fail('These values exceed the supported numerical range or precision. Use less extreme values.');
          }
          s =
            `Contribution margin per unit: ${money(cm)}\n` +
            `Contribution margin ratio: ${pct(ratio)}\n` +
            `Variable cost ratio: ${pct(1 - ratio)}\n` +
            `Sales: ${money(v.price * v.units)}\n` +
            `Total contribution margin: ${money(total)}`;
          if (fixed > 0) {
            s += `\nFixed costs: ${money(fixed)}\nOperating income: ${money(income)}` +
              (income < 0 ? ' (below break-even)' : '');
          }
          if (cm <= 0) s += '\nVariable cost is at or above price, so each sale adds no contribution.';
          const st = [
            'CONTRIBUTION-FORMAT INCOME STATEMENT',
            `Sales: ${money(v.price * v.units)} (per unit ${money(v.price)})`,
            `Variable costs: ${money(v.variable * v.units)} (per unit ${money(v.variable)})`,
            `${total < 0 ? 'Negative contribution margin' : 'Contribution margin'}: ${money(total)} (per unit ${money(cm)}, ${pct(ratio)} of sales)`
          ];
          if (fixed > 0) {
            st.push(`Fixed costs: ${money(fixed)}`);
            st.push(`${income < 0 ? 'Net Operating Loss' : 'Net Operating Income'}: ${money(income)}`);
          }
          lastRecordText = st.join('\n');
          if (viz) {
            viz.innerHTML = cmStatement({
              price: v.price, variable: v.variable, units: v.units,
              sales: v.price * v.units, totalVariable: v.variable * v.units,
              cm, total, ratio, fixed, income, illustrative
            });
            viz.hidden = false;
          }
          break;
        }
        default:
          s = 'Unknown tool.';
          lastRecordText = s;
          if (viz) { viz.hidden = true; viz.innerHTML = ''; }
      }
      out.textContent = s;
      return true;
    }

    const actions = form.querySelector('[data-result-actions]');
    if (actions) {
      actions.hidden = false;
      form.addEventListener('click', (e) => {
        const action = e.target.closest('[data-action]')?.dataset.action;
        if (!action) return;
        if (action === 'reset') {
          form.reset();
          calculate();
          return;
        }
        if (!calculate()) {
          form.reportValidity();
          return;
        }
        if (action === 'print') {
          window.print();
          return;
        }
        if (action === 'download') {
          const inputs = [...form.querySelectorAll('input')].map((el) => {
            const label = el.closest('label');
            const name = label
              ? label.childNodes[0].textContent.trim()
              : el.dataset.field || el.name;
            return `${name}: ${el.value}`;
          }).join('\n');
          const h1 = document.querySelector('h1');
          const canonical = document.querySelector('link[rel="canonical"]');
          const record =
            `${h1 ? h1.textContent : 'Calculation'}\n` +
            `Source: ${canonical ? canonical.href : location.href}\n` +
            `Saved: ${new Date().toISOString()}\n\n` +
            `INPUTS\n${inputs}\n\n` +
            `RESULT\n${lastRecordText}\n\n` +
            `Illustrative arithmetic, not a guarantee. Check the formula and exclusions on the source page.\n`;
          const url = URL.createObjectURL(
            new Blob([record], { type: 'text/plain;charset=utf-8' })
          );
          const link = document.createElement('a');
          link.href = url;
          link.download = form.dataset.tool + '-calculation.txt';
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
      });
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!calculate()) form.reportValidity();
    });
    form.addEventListener('input', calculate);
    calculate();
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = false;
  });
})();
