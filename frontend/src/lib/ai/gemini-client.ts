// Server-side Gemini AI caller with automatic fallback models, abort timeouts, and resilient JSON parsing

export async function callGeminiJson<T = any>(
  prompt: string,
  preferredModels: string[] = ["gemini-flash-lite-latest", "gemini-flash-latest", "gemini-3.8-flash"]
): Promise<T> {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

  if (!geminiKey) {
    throw new Error("Chưa cấu hình GEMINI_API_KEY trong hệ thống.");
  }

  let lastError: any = null;

  for (const model of preferredModels) {
    try {
      // 12-second timeout per model to prevent teacher's UI from hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.35,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          try {
            return JSON.parse(text) as T;
          } catch {
            // Clean markdown code blocks and extract JSON object or array
            const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
            const matched = clean.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
            if (matched) {
              return JSON.parse(matched[0]) as T;
            }
            return JSON.parse(clean) as T;
          }
        }
      } else {
        const errText = await res.text();
        console.warn(`Model ${model} returned status ${res.status}`);
        lastError = new Error(`Hệ thống AI bận (${model} code ${res.status}).`);
      }
    } catch (e: any) {
      console.warn(`Model ${model} error:`, e.message || e);
      lastError = e;
    }
  }

  throw lastError || new Error("Hệ thống AI đang bận. Thầy/Cô vui lòng thử lại sau giây lát.");
}
