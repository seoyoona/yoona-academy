import { createAnthropic } from "@ai-sdk/anthropic";

/**
 * Central Claude config. Works with a direct Anthropic key or Vercel AI Gateway.
 * `aiEnabled` lets UI/routes degrade gracefully when no key is configured.
 */
export const aiEnabled = Boolean(
  process.env.ANTHROPIC_API_KEY || process.env.AI_GATEWAY_API_KEY,
);

export const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/** Cost-tuned model choices: cheap for high-volume, opus for curriculum design. */
export const MODELS = {
  tutor: "claude-sonnet-4-6",
  enrich: "claude-sonnet-4-6",
  curriculum: "claude-opus-4-8",
} as const;
