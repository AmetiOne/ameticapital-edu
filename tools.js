/* Shared calculator helpers for ameticapital.com educational tools (break-even, contribution margin).
   Inputs stay in the browser; no network calls. */
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

  document.querySelectorAll('[data-tool]').forEach((form, index) => {
    const out = form.querySelector('output');
    if (!out) return;
    if (!out.id) out.id = `${form.dataset.tool}-result-${index}`;

    function calculate() {
      if (!form.checkValidity()) {
        out.textContent = 'Enter values within the stated limits.';
        return false;
      }
      const inputs = [...form.querySelectorAll('input')];
      const v = Object.fromEntries(
        inputs.map((x) => [x.dataset.field || x.name, Number(x.value)])
      );
      if (Object.values(v).some((x) => !Number.isFinite(x))) {
        out.textContent = 'Enter finite values.';
        return false;
      }
      if (inputs.some((x) => !isSupportedNumber(Number(x.value)) ||
          (Number(x.value) === 0 && /[1-9]/.test(x.value.split(/[eE]/)[0])))) {
        out.textContent = 'These values exceed the supported numerical range or precision. Use less extreme values.';
        return false;
      }

      let s = '';
      switch (form.dataset.tool) {
        case 'break-even': {
          const contribution = v.price - v.variable;
          if (contribution <= 0) {
            s =
              'Contribution margin per unit is not positive.\n' +
              `Price − variable cost = ${money(contribution)}\n` +
              'Break-even units are undefined when each unit does not cover its variable cost. Raise price or lower variable cost (illustrative only).';
            break;
          }
          const target = v.target || 0;
          const units = v.fixed / contribution;
          const revenue = units * v.price;
          const ratio = contribution / v.price;
          const targetUnits = (v.fixed + target) / contribution;
          if (![contribution, units, revenue, ratio, targetUnits].every(isSupportedNumber) ||
              (v.fixed > 0 && (units === 0 || revenue === 0)) || ratio === 0) {
            out.textContent = 'These values exceed the supported numerical range or precision. Use less extreme values.';
            return false;
          }
          s =
            `Contribution margin per unit: ${money(contribution)}\n` +
            `Contribution margin ratio: ${pct(ratio)}\n` +
            `Break-even units: ${num(units)} (round up to ${num(Math.ceil(units - 1e-9))} whole units)\n` +
            `Break-even revenue: ${money(revenue)}\n` +
            `Check: ${num(units)} × ${money(contribution)} ≈ ${money(v.fixed)} fixed costs`;
          if (target > 0) {
            s += `\nUnits for ${money(target)} target profit: ${num(targetUnits)} (round up to ${num(Math.ceil(targetUnits - 1e-9))})\n` +
              `Revenue for target profit: ${money(targetUnits * v.price)}`;
          }
          break;
        }
        case 'contribution-margin': {
          if (v.price <= 0) {
            s = 'Enter a selling price above zero. The contribution margin ratio is undefined at a zero price.';
            break;
          }
          const cm = v.price - v.variable;
          const total = cm * v.units;
          const ratio = cm / v.price;
          const fixed = v.fixed || 0;
          const income = total - fixed;
          if (![cm, total, ratio, income].every(isSupportedNumber)) {
            out.textContent = 'These values exceed the supported numerical range or precision. Use less extreme values.';
            return false;
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
          break;
        }
        default:
          s = 'Unknown tool.';
      }
      out.textContent = s;
      /* Premium: brief visual confirmation that the result refreshed. */
      if (typeof out.animate === 'function' ||
          !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        out.classList.remove('result-flash');
        void out.offsetWidth; /* restart the animation */
        out.classList.add('result-flash');
      }
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
            `RESULT\n${out.textContent}\n\n` +
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
