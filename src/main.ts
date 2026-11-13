import { initTheme } from './theme.ts';
import { initModals } from './modals.ts';
import { showToast } from './toast.ts';
import { auditCookies } from './cookies.ts';
import { auditVault } from './vault.ts';
import { calculateSummary, KNOWN_MODELS } from './calc.ts';

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initModals();

  const audit = auditCookies();
  const vault = auditVault();
  console.log(`[OTHRYS] TokenCalc initialized. Cookies: ${audit.totalCookies}, Client-Vault: ${vault.clientSideOnly}`);

  const inputEl = document.getElementById('app-input') as HTMLTextAreaElement | null;
  const modelSelect = document.getElementById('model-select') as HTMLSelectElement | null;
  const outputTokensEl = document.getElementById('output-tokens-input') as HTMLInputElement | null;
  const outputRegion = document.getElementById('output-region');
  const sampleBtn = document.getElementById('action-sample');
  const clearBtn = document.getElementById('action-clear');
  const copyBtn = document.getElementById('action-copy');

  function updateCalculations() {
    if (!outputRegion) return;
    const text = inputEl ? inputEl.value : '';
    const modelId = modelSelect ? modelSelect.value : 'claude-3-5-sonnet';
    const outputTokens = outputTokensEl ? Math.max(0, parseInt(outputTokensEl.value || '0', 10)) : 0;

    if (!text.trim()) {
      outputRegion.innerHTML = '<div class="output-placeholder">Enter or paste text above to see live token and cost analysis.</div>';
      return;
    }

    const summary = calculateSummary(text, modelId, outputTokens);
    const formatCost = (val: number) => {
      if (val === 0) return '$0.00 (Free)';
      if (val < 0.0001) return `< $0.0001`;
      return `$${val.toFixed(4)}`;
    };

    outputRegion.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem; margin-bottom: 1rem;">
        <div style="background: var(--color-surface); padding: 0.75rem; border-radius: 6px; border: 1px solid var(--color-border); text-align: center;">
          <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase;">Estimated Tokens</div>
          <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-primary);">${summary.inputTokens.toLocaleString()}</div>
        </div>
        <div style="background: var(--color-surface); padding: 0.75rem; border-radius: 6px; border: 1px solid var(--color-border); text-align: center;">
          <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase;">Characters</div>
          <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-text);">${summary.charCount.toLocaleString()}</div>
        </div>
        <div style="background: var(--color-surface); padding: 0.75rem; border-radius: 6px; border: 1px solid var(--color-border); text-align: center;">
          <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase;">Words</div>
          <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-text);">${summary.wordCount.toLocaleString()}</div>
        </div>
        <div style="background: var(--color-surface); padding: 0.75rem; border-radius: 6px; border: 1px solid var(--color-border); text-align: center;">
          <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase;">Input Cost</div>
          <div style="font-size: 1.3rem; font-weight: 700; color: var(--color-accent);">${formatCost(summary.inputCost)}</div>
        </div>
        <div style="background: var(--color-surface); padding: 0.75rem; border-radius: 6px; border: 1px solid var(--color-border); text-align: center;">
          <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase;">Est. Total Call</div>
          <div style="font-size: 1.3rem; font-weight: 700; color: var(--color-accent);">${formatCost(summary.totalCost)}</div>
        </div>
      </div>

      <div style="background: var(--color-surface); padding: 0.75rem; border-radius: 6px; border: 1px solid var(--color-border); font-size: 0.85rem;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.35rem;">
          <span>Context Window Utilization (${summary.model.name}):</span>
          <strong>${summary.contextPercent.toFixed(2)}% of ${(summary.model.contextWindow / 1000).toFixed(0)}k</strong>
        </div>
        <div style="height: 6px; background: var(--color-border); border-radius: 3px; overflow: hidden;">
          <div style="width: ${Math.min(100, Math.max(1, summary.contextPercent))}%; height: 100%; background: var(--color-primary);"></div>
        </div>
      </div>
    `;
  }

  if (inputEl) {
    inputEl.addEventListener('input', updateCalculations);
  }
  if (modelSelect) {
    modelSelect.addEventListener('change', updateCalculations);
  }
  if (outputTokensEl) {
    outputTokensEl.addEventListener('input', updateCalculations);
  }

  if (sampleBtn && inputEl) {
    sampleBtn.addEventListener('click', () => {
      inputEl.value = `You are a sovereign software engineer specializing in deterministic offline tooling.\n\nTask: Design a high-performance web tool that calculates input and output token consumption across various frontier and open-weight models.\n\nConstraints:\n1. 100% client-side execution.\n2. Zero network telemetry or remote trackers.\n3. Strictly bounded memory overhead.\n4. Full WCAG AA accessibility compliance.`;
      updateCalculations();
      showToast('Loaded sample text payload.');
    });
  }

  if (clearBtn && inputEl && outputRegion) {
    clearBtn.addEventListener('click', () => {
      inputEl.value = '';
      updateCalculations();
      showToast('Cleared input.');
    });
  }

  if (copyBtn && inputEl) {
    copyBtn.addEventListener('click', async () => {
      if (!inputEl.value.trim()) {
        showToast('Nothing to copy. Enter text first.');
        return;
      }
      const modelId = modelSelect ? modelSelect.value : 'claude-3-5-sonnet';
      const outputTokens = outputTokensEl ? Math.max(0, parseInt(outputTokensEl.value || '0', 10)) : 0;
      const summary = calculateSummary(inputEl.value, modelId, outputTokens);
      
      const report = [
        `=== OTHRYS TokenCalc Report ===`,
        `Model: ${summary.model.name} (${summary.model.provider})`,
        `Input Tokens: ~${summary.inputTokens.toLocaleString()}`,
        `Characters: ${summary.charCount.toLocaleString()}`,
        `Words: ${summary.wordCount.toLocaleString()}`,
        `Input Cost: $${summary.inputCost.toFixed(5)}`,
        `Estimated Total Cost: $${summary.totalCost.toFixed(5)}`,
        `Context Window: ${(summary.model.contextWindow / 1000).toFixed(0)}k (${summary.contextPercent.toFixed(2)}% used)`,
        `Client Shield: 100% Private, Zero Network Upload`,
      ].join('\n');

      await navigator.clipboard.writeText(report);
      showToast('Copied full token report to clipboard!');
    });
  }
});
