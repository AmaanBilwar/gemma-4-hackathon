import { cerebras } from "@ai-sdk/cerebras";

/**
 * The single model used across this project. Every agent imports `model` from
 * here — there are no fallbacks. `cerebras` reads CEREBRAS_API_KEY from the
 * environment (.env.local).
 */
export const MODEL_ID = "gemma-4-31b" as const;

export const model = cerebras(MODEL_ID);
