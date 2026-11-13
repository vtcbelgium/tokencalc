// Token calculator and cost estimation core logic
// Extracted & extended from @othrys-blocks/ai/heuristic-tokenizer

export interface ModelPricing {
  id: string;
  name: string;
  provider: string;
  inputPerMillion: number;  // USD per 1M tokens
  outputPerMillion: number; // USD per 1M tokens
  contextWindow: number;    // Tokens
}

export const KNOWN_MODELS: ModelPricing[] = [
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', inputPerMillion: 3.00, outputPerMillion: 15.00, contextWindow: 200_000 },
  { id: 'claude-3-5-haiku', name: 'Claude 3.5 Haiku', provider: 'Anthropic', inputPerMillion: 0.80, outputPerMillion: 4.00, contextWindow: 200_000 },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', inputPerMillion: 2.50, outputPerMillion: 10.00, contextWindow: 128_000 },
  { id: 'gpt-4o-mini', name: 'GPT-4o mini', provider: 'OpenAI', inputPerMillion: 0.15, outputPerMillion: 0.60, contextWindow: 128_000 },
  { id: 'gemini-1-5-pro', name: 'Gemini 1.5 Pro', provider: 'Google', inputPerMillion: 1.25, outputPerMillion: 5.00, contextWindow: 2_000_000 },
  { id: 'gemini-1-5-flash', name: 'Gemini 1.5 Flash', provider: 'Google', inputPerMillion: 0.075, outputPerMillion: 0.30, contextWindow: 1_000_000 },
  { id: 'deepseek-v3', name: 'DeepSeek V3 / R1', provider: 'DeepSeek', inputPerMillion: 0.14, outputPerMillion: 0.28, contextWindow: 64_000 },
  { id: 'llama-3-3-70b', name: 'Llama 3.3 70B (Groq/Together)', provider: 'Meta', inputPerMillion: 0.59, outputPerMillion: 0.79, contextWindow: 128_000 },
  { id: 'local-ollama', name: 'Local Ollama / Sovereign Self-Host', provider: 'Local', inputPerMillion: 0.00, outputPerMillion: 0.00, contextWindow: 32_000 },
];

export function estimateTokens(value: string): number {
  if (!value) return 0;
  // Standard heuristic approximation across Latin & multilingual text:
  // ~4 characters per token for English prose, ~3 for code/structured data.
  // We use Math.ceil(Array.from(value).length / 3.8) as an accurate average.
  const chars = Array.from(value).length;
  return Math.ceil(chars / 3.8);
}

export function estimateInputCost(tokens: number, usdPerMillion: number): number {
  return (tokens / 1_000_000) * usdPerMillion;
}

export function calculateSummary(text: string, modelId: string, estimatedOutputTokens: number = 0) {
  const inputTokens = estimateTokens(text);
  const charCount = Array.from(text).length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const model = KNOWN_MODELS.find(m => m.id === modelId) || KNOWN_MODELS[0];

  const inputCost = estimateInputCost(inputTokens, model.inputPerMillion);
  const outputCost = estimateInputCost(estimatedOutputTokens, model.outputPerMillion);
  const totalCost = inputCost + outputCost;

  const contextPercent = Math.min(100, (inputTokens / model.contextWindow) * 100);

  return {
    charCount,
    wordCount,
    inputTokens,
    estimatedOutputTokens,
    model,
    inputCost,
    outputCost,
    totalCost,
    contextPercent,
  };
}
