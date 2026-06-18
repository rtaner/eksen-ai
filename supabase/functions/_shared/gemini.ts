// Gemini API Wrapper for Deno Edge Functions

export interface GeminiConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: string;
}

export interface GeminiResponse {
  text: string;
  success: boolean;
  error?: string;
}

/**
 * Call Gemini API with a prompt
 */
export async function callGemini(
  prompt: string,
  config: GeminiConfig
): Promise<GeminiResponse> {
  const {
    apiKey,
    model = 'gemini-2.5-flash',
    temperature = 0.7,
    maxOutputTokens = 16384,
    responseMimeType = 'application/json',
  } = config;

  // Determine model list to try in order
  const modelsToTry = [
    model,
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash',
    'gemini-3.5-flash'
  ].filter((value, index, self) => self.indexOf(value) === index);

  let lastError: any = null;
  const maxRetries = 3;
  const baseDelay = 1000; // 1 second base delay

  for (const currentModel of modelsToTry) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`[Gemini API] Calling model ${currentModel} (Attempt ${attempt + 1}/${maxRetries})...`);
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: prompt,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature,
                maxOutputTokens,
                topP: 0.95,
                topK: 40,
                responseMimeType,
              },
            }),
          }
        );

        if (!response.ok) {
          let errorMsg = `Status ${response.status}`;
          try {
            const errorData = await response.json();
            errorMsg += ` - ${JSON.stringify(errorData)}`;
          } catch (_) {
            errorMsg += ` - ${await response.text()}`;
          }
          throw new Error(`Gemini API error: ${errorMsg}`);
        }

        const data = await response.json();

        // Extract text from response
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        if (!text) {
          throw new Error('No text in Gemini response');
        }

        console.log(`[Gemini API] Successfully received response from ${currentModel}`);
        return {
          text,
          success: true,
        };
      } catch (error: any) {
        lastError = error;
        console.warn(
          `[Gemini API] Model ${currentModel} failed on attempt ${attempt + 1}/${maxRetries}: ${error.message}`
        );

        // Don't wait on the last attempt of the last model
        if (currentModel === modelsToTry[modelsToTry.length - 1] && attempt === maxRetries - 1) {
          break;
        }

        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`[Gemini API] Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    console.warn(`[Gemini API] Model ${currentModel} exhausted. Falling back to next available model...`);
  }

  return {
    text: '',
    success: false,
    error: lastError instanceof Error ? lastError.message : String(lastError || 'Unknown error in all fallback models'),
  };
}

/**
 * Parse JSON from Gemini response
 * Handles cases where Gemini wraps JSON in markdown code blocks
 */
export function parseGeminiJSON<T>(text: string): T {
  // Remove markdown code blocks if present
  let cleanText = text.trim();
  
  // Remove ```json and ``` markers
  if (cleanText.startsWith('```json')) {
    cleanText = cleanText.replace(/^```json\s*/, '').replace(/```\s*$/, '');
  } else if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```\s*/, '').replace(/```\s*$/, '');
  }

  try {
    return JSON.parse(cleanText.trim()) as T;
  } catch (error) {
    console.error('Failed to parse Gemini JSON:', cleanText);
    throw new Error(`Invalid JSON from Gemini: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
