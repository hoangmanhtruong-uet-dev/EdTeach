// Server-side Gemini AI caller with automatic fallback models and JSON output parsing

export async function callGeminiJson<T = any>(
  prompt: string,
  preferredModels: string[] = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-3.5-flash-lite"]
): Promise<T> {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

  if (!geminiKey) {
    throw new Error("Chưa cấu hình GEMINI_API_KEY trong hệ thống.");
  }

  let lastError: any = null;

  for (const model of preferredModels) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.4,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          try {
            return JSON.parse(text) as T;
          } catch {
            // Clean markdown code blocks if present
            const clean = text.replace(/```json/g, "").replace(/```/g, "").trim();
            return JSON.parse(clean) as T;
          }
        }
      } else {
        const errText = await res.text();
        lastError = new Error(`Model ${model} failed (${res.status}): ${errText}`);
      }
    } catch (e: any) {
      lastError = e;
    }
  }

  throw lastError || new Error("Không thể kết nối tới Google Gemini AI.");
}
