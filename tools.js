/* Shared calculator helpers for ameticapital.com educational tools.
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
  const num = (n) => n.toLocaleString('en-US', { maximumFractionDigits: 4 });
  const pct = (n) => num(n * 100) + '%';

  document.querySelectorAll('[data-tool]').forEach((form, index) => {
    const out = form.querySelector('output');
    if (!out) return;
    if (!out.id) out.id = `${form.dataset.tool}-result-${index}`;

    function calculate() {
      if (!form.checkValidity()) {
        out.textContent = 'Enter values within the stated limits.';
        return false;
      }
      const v = Object.fromEntries(
        [...form.querySelectorAll('input')].map((x) => [x.name, Number(x.value)])
      );
      if (Object.values(v).some((x) => !Number.isFinite(x))) {
        out.textContent = 'Enter finite values.';
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
          const units = v.fixed / contribution;
          const revenue = units * v.price;
          const ratio = contribution / v.price;
          s =
            `Contribution margin per unit: ${money(contribution)}\n` +
            `Contribution margin ratio: ${v.price ? pct(ratio) : 'Undefined — zero price'}\n` +
            `Break-even units: ${num(units)}\n` +
            `Break-even revenue: ${money(revenue)}\n` +
            `Check: ${num(units)} × ${money(contribution)} ≈ ${money(v.fixed)} fixed costs`;
          break;
        }
        default:
          s = 'Unknown tool.';
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
              : el.name;
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
  });
})();
