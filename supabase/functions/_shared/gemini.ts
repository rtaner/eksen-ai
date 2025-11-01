// Gemini API Wrapper for Deno Edge Functions

export interface GeminiConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
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
  } = config;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
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
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Gemini API error: ${response.status} - ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();

    // Extract text from response
    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!text) {
      throw new Error('No text in Gemini response');
    }

    return {
      text,
      success: true,
    };
  } catch (error) {
    console.error('Gemini API call failed:', error);
    return {
      text: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
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
