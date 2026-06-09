import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { callGemini, parseGeminiJSON } from '../_shared/gemini.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { base64Data } = await req.json();

    if (!base64Data) {
      return new Response(
        JSON.stringify({ error: 'base64Data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured in Edge Function Secrets');
    }

    const prompt = `Extract the tabular data from this store dashboard PDF into a JSON array of objects. Each object should represent a specific 'Class' (e.g., Trousers, Short Sleeve T-Shirt). Do not output aggregate groups (like Casual or Young) as items, only the actual classes under them. Map the values to this exact schema: { "Department": "string (e.g. WOMAN, MAN)", "Lifestyle": "string (e.g. Casual, Young)", "Class": "string", "StoreSalesPct": number, "RegionSalesPct": number, "SalesAmountLFLPct": number, "Cover": number, "OnWay": number, "NetFinalOccupancyPct": number, "SalesAmount": number }. For percentage values, extract them as numbers (e.g., %25.5 -> 25.5). If a value is missing or "Boş", use 0. Return ONLY the raw JSON array, without any markdown blocks or explanation.`;

    // Fetch call directly because the shared gemini.ts doesn't support inlineData natively.
    // We will bypass the wrapper for this specific call to pass inlineData.
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: 'application/pdf',
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!text) {
      throw new Error('No text returned from Gemini');
    }

    const rawRows = parseGeminiJSON(text);

    return new Response(
      JSON.stringify({
        success: true,
        data: rawRows,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('PDF parsing error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
