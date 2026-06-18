// Gemini API Wrapper for Next.js Server Routes with Retries and Fallbacks

export interface GeminiNextConfig {
  apiKey: string;
  prompt: string;
  pdfBase64?: string;
  responseSchema?: any;
  temperature?: number;
  model?: string;
}

export interface GeminiNextResponse {
  text: string;
  success: boolean;
  error?: string;
}

/**
 * Call Gemini API with retries and fallback models
 */
export async function callGeminiNext(
  config: GeminiNextConfig
): Promise<GeminiNextResponse> {
  const {
    apiKey,
    prompt,
    pdfBase64,
    responseSchema,
    temperature = 0.1,
    model = 'gemini-3.5-flash',
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
        console.log(`[Next.js Gemini] Calling model ${currentModel} (Attempt ${attempt + 1}/${maxRetries})...`);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`;
        
        const parts: any[] = [{ text: prompt }];
        if (pdfBase64) {
          parts.push({
            inlineData: {
              mimeType: 'application/pdf',
              data: pdfBase64,
            },
          });
        }

        const body: any = {
          contents: [{ parts }],
          generationConfig: {
            temperature,
            responseMimeType: "application/json",
          },
        };

        if (responseSchema) {
          body.generationConfig.responseSchema = responseSchema;
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

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

        console.log(`[Next.js Gemini] Successfully received response from ${currentModel}`);
        return {
          text,
          success: true,
        };
      } catch (error: any) {
        lastError = error;
        console.warn(
          `[Next.js Gemini] Model ${currentModel} failed on attempt ${attempt + 1}/${maxRetries}: ${error.message}`
        );

        // Don't wait on the last attempt of the last model
        if (currentModel === modelsToTry[modelsToTry.length - 1] && attempt === maxRetries - 1) {
          break;
        }

        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`[Next.js Gemini] Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    console.warn(`[Next.js Gemini] Model ${currentModel} exhausted. Falling back to next available model...`);
  }

  return {
    text: '',
    success: false,
    error: lastError instanceof Error ? lastError.message : String(lastError || 'Unknown error in all fallback models'),
  };
}

/**
 * Parse JSON from Gemini response
 */
export function parseGeminiJSON(text: string): any {
  let cleanText = text.trim();
  if (cleanText.startsWith('```json')) {
    cleanText = cleanText.replace(/^```json\s*/, '').replace(/```\s*$/, '');
  } else if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```\s*/, '').replace(/```\s*$/, '');
  }

  try {
    return JSON.parse(cleanText.trim());
  } catch (error) {
    console.error('Failed to parse Gemini JSON:', cleanText);
    throw new Error(`Invalid JSON from Gemini: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
