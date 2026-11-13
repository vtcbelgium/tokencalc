import { describe, it, expect } from 'vitest';
import { estimateTokens, estimateInputCost, calculateSummary, KNOWN_MODELS } from '../src/calc.ts';

describe('TokenCalc Core Logic', () => {
  it('estimates zero tokens for empty string', () => {
    expect(estimateTokens('')).toBe(0);
  });

  it('approximates tokens based on character length', () => {
    const text = 'Hello world, this is a test.';
    const tokens = estimateTokens(text);
    expect(tokens).toBeGreaterThan(0);
    expect(tokens).toBeLessThan(text.length);
  });

  it('calculates cost per million correctly', () => {
    // 1,000,000 tokens at $3.00/M should be exactly $3.00
    expect(estimateInputCost(1_000_000, 3.00)).toBeCloseTo(3.00, 5);
    // 10,000 tokens at $2.50/M should be $0.025
    expect(estimateInputCost(10_000, 2.50)).toBeCloseTo(0.025, 5);
  });

  it('computes summary with model pricing', () => {
    const text = 'Sovereign computing without remote trackers.';
    const summary = calculateSummary(text, 'claude-3-5-sonnet', 100);

    expect(summary.charCount).toBe(text.length);
    expect(summary.wordCount).toBe(5);
    expect(summary.inputTokens).toBeGreaterThan(0);
    expect(summary.model.id).toBe('claude-3-5-sonnet');
    expect(summary.totalCost).toBeGreaterThan(0);
    expect(summary.contextPercent).toBeLessThan(1);
  });

  it('includes zero cost for local ollama model', () => {
    const text = 'Local model inference is free.';
    const summary = calculateSummary(text, 'local-ollama', 500);
    expect(summary.totalCost).toBe(0);
  });
});
