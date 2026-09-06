/**
 * AI Commit Message Generator
 * Supports Google Gemini and OpenAI REST API
 */

export type AiProvider = "gemini" | "openai";

// Default public Gemini API key fallback if user leaves field empty
const DEFAULT_GEMINI_KEY = ""; // Can be set or empty

export async function generateAiCommitMessage(
  diffSummary: string,
  apiKey?: string,
  provider: AiProvider = "gemini",
  modelName?: string
): Promise<string> {
  const key = apiKey?.trim() || DEFAULT_GEMINI_KEY;

  if (!key) {
    throw new Error("Please enter your AI API Key in Settings to use AI Commit Message.");
  }

  const prompt = `You are a Git commit message generator. Analyze the following git changes and generate a single, concise Conventional Commit message (e.g. feat(ui): add commit button, fix(auth): resolve login token issue). Return ONLY the commit message text. Do not wrap in markdown or quotes.\n\nGit Changes:\n${diffSummary.slice(0, 3000)}`;

  if (provider === "gemini") {
    const model = modelName || "gemini-1.5-flash";
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson?.error?.message || `Gemini API request failed (${res.status})`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) throw new Error("Gemini returned empty response");
    return text.replace(/^[`"']|[`"']$/g, "").trim();
  } else {
    // OpenAI
    const model = modelName || "gpt-4o-mini";
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are a Git commit message generator. Output ONLY a concise Conventional Commit message.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: 60,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson?.error?.message || `OpenAI API request failed (${res.status})`);
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("OpenAI returned empty response");
    return text.replace(/^[`"']|[`"']$/g, "").trim();
  }
}

export async function testAiConnection(
  apiKey?: string,
  provider: AiProvider = "gemini",
  modelName?: string
): Promise<string> {
  const sampleDiff = "modified src/App.tsx: add new features and fix layout";
  const result = await generateAiCommitMessage(sampleDiff, apiKey, provider, modelName);
  return result;
}
