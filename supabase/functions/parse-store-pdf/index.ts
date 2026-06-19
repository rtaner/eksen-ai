import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';
import { processStoreData } from '../../../lib/services/store-analysis-engine.ts';
import { PDFDocument } from 'https://esm.sh/pdf-lib@1.17.1';
import { decode, encode } from 'https://deno.land/std@0.168.0/encoding/base64.ts';

// Robust Gemini fetch function with automatic retries for rate limits or networks issues
async function fetchGeminiWithRetry(prompt: string, apiKey: string, retries = 3, delay = 1000): Promise<any> {
  const model = "gemini-3.1-flash-lite";
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { 
              temperature: 0.1, 
              responseMimeType: "application/json"
            },
          }),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errText}`);
      }

      const responseData = await response.json();
      let responseText = responseData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      
      // Remove any markdown wrappers
      responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(responseText);
    } catch (error) {
      if (i === retries - 1) throw error;
      console.warn(`[Attempt ${i + 1}/${retries}] Gemini API failed, retrying in ${delay}ms...`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Robust Gemini Multimodal fetch function with Structured Outputs
async function fetchGeminiMultimodal(
  prompt: string,
  pdfBase64: string,
  apiKey: string,
  schema: any,
  retries = 3,
  delay = 1000
): Promise<any> {
  const model = "gemini-3.1-flash-lite";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
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
                    data: pdfBase64
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
            responseSchema: schema
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errText}`);
      }

      const responseData = await response.json();
      let responseText = responseData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      
      responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(responseText);
    } catch (error) {
      if (i === retries - 1) throw error;
      console.warn(`[Attempt ${i + 1}/${retries}] Gemini multimodal API failed, retrying in ${delay}ms...`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

function parseTurkishNumber(val: any): number {
  if (val === undefined || val === null) return 0;
  
  // Convert to string to safely parse regardless of format (handles numbers too)
  let str = String(val).trim();
  if (str === '' || str === '-' || str.toLowerCase() === 'boş') return 0;
  
  // Remove percentage signs
  str = str.replace(/%/g, '');
  
  // If there's a comma, it is the decimal separator in Turkish formatting (e.g. "13,6")
  if (str.includes(',')) {
    str = str.replace(/\./g, '').replace(/,/g, '.');
  } else {
    // No comma. Could be standard US float (e.g. "9.7" or "150845.0") or Turkish dot-separated integer (e.g. "150.845")
    const dotCount = (str.match(/\./g) || []).length;
    if (dotCount > 1) {
      // Multiple dots must be thousand separators (e.g. "1.095.445")
      str = str.replace(/\./g, '');
    } else if (dotCount === 1) {
      const parts = str.split('.');
      // If the part after the dot has exactly 3 digits, it is a thousand separator
      // (e.g. "150.845" -> 150845, "2.314" -> 2314).
      // Standard floats (like cover "9.7" or growth "-0.9") only have 1 or 2 decimals, so they won't match.
      if (parts[0].length <= 3 && parts[1].length === 3) {
        str = str.replace(/\./g, '');
      }
    }
  }
  
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let jobId: string | null = null;
  let supabaseClient: any = null;

  try {
    const body = await req.json();
    jobId = body.jobId;
    if (!jobId) {
      throw new Error('jobId is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    supabaseClient = createClient(supabaseUrl, supabaseKey);

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    // 1. Durumu 'extracting' yap ve ham metni al
    const { data: job, error: fetchError } = await supabaseClient
      .from('ai_analysis_jobs')
      .update({ status: 'extracting', updated_at: new Date().toISOString() })
      .eq('id', jobId)
      .select('*')
      .single();

    if (fetchError || !job) {
      throw new Error('Job bulunamadı veya güncellenemedi: ' + (fetchError?.message || ''));
    }

    if (!job.raw_text) {
      throw new Error('Ham metin veya PDF verisi bulunamadı.');
    }

    let allRows: any[] = [];
    let storeMetrics: any = null;

    if (job.raw_text.startsWith('base64:')) {
      const pdfBase64 = job.raw_text.substring(7);
      console.log(`Job ${jobId}: Görsel multimodal PDF işleme başlatılıyor...`);

      const pdfBytes = decode(pdfBase64);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pageCount = pdfDoc.getPageCount();
      console.log(`Job ${jobId}: PDF bellek üzerine yüklendi. Toplam sayfa sayısı: ${pageCount}`);

      const extractionPromises: Promise<any>[] = [];

      // Sadece 1. sayfadan (Index 0) mağaza genel KPI'larını çekelim
      const metricsPrompt = `You are a professional retail data extraction assistant.
Analyze this single-page retail StoreInfo dashboard visually.
Extract the overall store metrics from the top KPI sections.

CRITICAL NUMBER FORMATTING:
The document uses Turkish number formatting.
- Thousand separators are dots (e.g., "1.095.445" = 1095445.0).
- Decimal separators are commas (e.g., "13,6" = 13.6).
- Percentage signs may appear before or after the number (e.g., "%13,6" = 13.6).
Copy the values EXACTLY as printed in the PDF (e.g., "1.095.445", "%13,6", or "502,96") as strings. Do NOT attempt to clean or convert them yourself.

Extract and map to this exact JSON schema:
{
  "SalesAmount": "string",
  "SalesAmountLYPct": "string",
  "SalesQuantity": "string",
  "SalesQuantityLYPct": "string",
  "Cover": "string",
  "ConversionPct": "string",
  "IPT": "string",
  "ATV": "string",
  "Footfall": "string",
  "UnitPrice": "string"
}

If a metric is clearly missing or empty, use "". Return ONLY valid JSON without Markdown blocks if possible.`;

      const metricsSchema = {
        type: "OBJECT",
        properties: {
          SalesAmount: { type: "STRING" },
          SalesAmountLYPct: { type: "STRING" },
          SalesQuantity: { type: "STRING" },
          SalesQuantityLYPct: { type: "STRING" },
          Cover: { type: "STRING" },
          ConversionPct: { type: "STRING" },
          IPT: { type: "STRING" },
          ATV: { type: "STRING" },
          Footfall: { type: "STRING" },
          UnitPrice: { type: "STRING" }
        },
        required: [
          "SalesAmount",
          "SalesAmountLYPct",
          "SalesQuantity",
          "SalesQuantityLYPct",
          "Cover",
          "ConversionPct",
          "IPT",
          "ATV",
          "Footfall",
          "UnitPrice"
        ]
      };

      try {
        const metricsPageDoc = await PDFDocument.create();
        const [copiedMetricsPage] = await metricsPageDoc.copyPages(pdfDoc, [0]);
        metricsPageDoc.addPage(copiedMetricsPage);
        const metricsPdfBytes = await metricsPageDoc.save();
        const metricsPdfBase64 = encode(metricsPdfBytes);

        extractionPromises.push(
          fetchGeminiMultimodal(metricsPrompt, metricsPdfBase64, geminiApiKey, metricsSchema)
            .then(res => {
              console.log(`Job ${jobId}: Sayfa 0 (Metrikler) başarıyla çözümlendi.`);
              storeMetrics = {
                SalesAmount: parseTurkishNumber(res.SalesAmount),
                SalesAmountLYPct: parseTurkishNumber(res.SalesAmountLYPct),
                SalesQuantity: parseTurkishNumber(res.SalesQuantity),
                SalesQuantityLYPct: parseTurkishNumber(res.SalesQuantityLYPct),
                Cover: parseTurkishNumber(res.Cover),
                ConversionPct: parseTurkishNumber(res.ConversionPct),
                IPT: parseTurkishNumber(res.IPT),
                ATV: parseTurkishNumber(res.ATV),
                Footfall: parseTurkishNumber(res.Footfall),
                UnitPrice: parseTurkishNumber(res.UnitPrice)
              };
            })
            .catch(err => {
              console.error(`Job ${jobId}: Sayfa 0 (Metrikler) çözümlenirken hata oluştu:`, err);
            })
        );
      } catch (err) {
        console.error(`Job ${jobId}: Sayfa 0 kopyalanamadı:`, err);
      }

      // Geri kalan sayfaları (Index 1'den N-1'e kadar) merchandise satırları için tarayalım
      const rowsPrompt = `You are a professional retail data parser extracting merchandise table data.
Analyze this single-page PDF dashboard visually and extract the tabular data into JSON.

CRITICAL NUMBER FORMATTING:
The document uses Turkish formatting (dots for thousands like "465.050", commas for decimals like "%18,5").
Copy all numerical values and percentages EXACTLY as they are printed in the PDF (e.g., "465.050", "%18,5", "-%0,9", "8,1", "345") as strings. Do NOT attempt to clean or convert them yourself.

CRITICAL COLUMN ALIGNMENT RULE:
The columns in the PDF table must correspond exactly to their mapped JSON properties.
- 'Stock Qty OnHand' must map to 'OnHandQty'.
- 'Stock Qty LFL %' must map to 'StockQtyLFLPct'.
- 'Cover' must map to 'Cover'.
- 'Stock Qty OnWay' must map to 'OnWay'.
- 'Net Final Occupancy' must map to 'NetFinalOccupancyPct'.

CRITICAL RULE FOR BLANK CELLS:
Some cells or columns in the table may be blank or empty (especially 'Stock Qty LFL %' or 'Stock Qty OnWay'). Because all fields are required in the schema, you MUST output a hyphen ("-"), zero ("0"), or "Boş" for any blank or empty cells.
NEVER shift values to the left to fill missing/blank columns. For example, if 'Stock Qty LFL %' is blank in a row, the 'Cover' value (e.g., "8,3") must NOT be placed into 'StockQtyLFLPct'. It must remain in 'Cover', and 'StockQtyLFLPct' must be set to "-" or "0" or "Boş".

EXTRACTION RULES & MAPPING:
1. Department: Identify the main Department printed vertically on the far left margin (e.g., "WOMAN", "MAN", "KIDS&BABY", "HW&UW", "ACC&FTW"). Apply this strictly to ALL rows on this page.
2. RowType: Tables are grouped by vertical text blocks next to them (e.g., "CLASS", "LIFESTYLE", "BUYER", "SEASON", "DIVF"). Determine which vertical block the table belongs to and use it as the RowType for those specific rows.
3. Exclusions:
   - DO NOT extract rows if the page is a store-level summary containing multiple main departments.
   - DO NOT extract rows from "Time Based Sales Analysis" pages.
   - EXCLUDE aggregate rows like "ACTIVE SEASON", "NS", "OLD AW", "OLD SS", "NEW SEASON", or the overall "Toplam" / "Total" row.
4. Field Mapping for each row:
   - "Department": Extracted from rule 1.
   - "RowType": Extracted from rule 2.
   - "Name": The item group name (e.g., "Traditional", "Trousers", "Knitted").
   - "SalesAmount": Value under the 'Sales Amount' column.
   - "SalesAmountLFLPct": Value under the 'Sales Amount LFL %' column (Ciro Büyüme LFL).
   - "SalesQuantity": Value under the 'Sales Quantity' column (Field 3 / Satış Adet).
   - "SalesQuantityLFLPct": Value under the 'Sales Quantity LFL %' column (Adet Büyüme LFL).
   - "RegionSalesPct": Value under the 'Region Sales %' column (Bölge satış %).
   - "StoreSalesPct": Value under the 'Sales Amount %' column (Mağaza satış %).
   - "StockCostPct": Value under the 'Stock Cost %' column.
   - "StockSalesDiffPct": Value under the 'Stock-Sales Amount %' column.
   - "OnHandQty": Value under the 'Stock Qty OnHand' column.
   - "StockQtyLFLPct": Value under the 'Stock Qty LFL %' column (Stok Büyüme LFL).
   - "Cover": Value under the 'Cover' column.
   - "OnWay": Value under the 'Stock Qty OnWay' column.
   - "NetFinalOccupancyPct": Value under the 'Net Final Occupancy' column.

Return the result strictly matching this JSON schema:
{
  "rows": [
    {
      "Department": "string",
      "RowType": "string",
      "Name": "string",
      "SalesAmount": "string",
      "SalesAmountLFLPct": "string",
      "SalesQuantity": "string",
      "SalesQuantityLFLPct": "string",
      "RegionSalesPct": "string",
      "StoreSalesPct": "string",
      "StockCostPct": "string",
      "StockSalesDiffPct": "string",
      "OnHandQty": "string",
      "StockQtyLFLPct": "string",
      "Cover": "string",
      "OnWay": "string",
      "NetFinalOccupancyPct": "string"
    }
  ]
}
Return ONLY valid JSON.`;

      const rowsSchema = {
        type: "OBJECT",
        properties: {
          rows: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                Department: { type: "STRING" },
                RowType: { type: "STRING" },
                Name: { type: "STRING" },
                SalesAmount: { type: "STRING" },
                SalesAmountLFLPct: { type: "STRING" },
                SalesQuantity: { type: "STRING" },
                SalesQuantityLFLPct: { type: "STRING" },
                RegionSalesPct: { type: "STRING" },
                StoreSalesPct: { type: "STRING" },
                StockCostPct: { type: "STRING" },
                StockSalesDiffPct: { type: "STRING" },
                OnHandQty: { type: "STRING" },
                StockQtyLFLPct: { type: "STRING" },
                Cover: { type: "STRING" },
                OnWay: { type: "STRING" },
                NetFinalOccupancyPct: { type: "STRING" }
              },
              required: [
                "Department",
                "RowType",
                "Name",
                "SalesAmount",
                "SalesAmountLFLPct",
                "SalesQuantity",
                "SalesQuantityLFLPct",
                "RegionSalesPct",
                "StoreSalesPct",
                "StockCostPct",
                "StockSalesDiffPct",
                "OnHandQty",
                "StockQtyLFLPct",
                "Cover",
                "OnWay",
                "NetFinalOccupancyPct"
              ]
            }
          }
        },
        required: ["rows"]
      };

      for (let p = 1; p < pageCount; p++) {
        extractionPromises.push(
          (async () => {
            try {
              const singlePageDoc = await PDFDocument.create();
              const [copiedPage] = await singlePageDoc.copyPages(pdfDoc, [p]);
              singlePageDoc.addPage(copiedPage);
              const singlePageBytes = await singlePageDoc.save();
              const singlePageBase64 = encode(singlePageBytes);

              const pageRes = await fetchGeminiMultimodal(rowsPrompt, singlePageBase64, geminiApiKey, rowsSchema);
              if (pageRes && Array.isArray(pageRes.rows)) {
                console.log(`Job ${jobId}: Sayfa ${p} çözümlendi. ${pageRes.rows.length} satır bulundu.`);
                
                const mappedRows = pageRes.rows.map((r: any) => {
                  // Normalize Department
                  let dept = r.Department || '';
                  dept = dept.trim();
                  if (dept === 'KIDS&BABY') dept = 'KIDS & BABY';
                  if (dept === 'HW&UW') dept = 'H&W';

                  // Normalize RowType
                  let rType = r.RowType || '';
                  rType = rType.trim();

                  // Check if this is from the MERCH summary section
                  if (dept === 'MERCH' || rType === 'MERCH') {
                    const nameLower = (r.Name || '').toLowerCase().trim();
                    if (nameLower === 'woman') {
                      dept = 'WOMAN';
                      rType = 'Department';
                    } else if (nameLower === 'man') {
                      dept = 'MAN';
                      rType = 'Department';
                    } else if (nameLower === 'kid&baby' || nameLower === 'kids & baby' || nameLower === 'kids&baby') {
                      dept = 'KIDS & BABY';
                      rType = 'Department';
                    } else if (nameLower === 'acc&ftw' || nameLower === 'acc & ftw') {
                      dept = 'ACC&FTW';
                      rType = 'Department';
                    } else if (nameLower === 'homewear & underwear' || nameLower === 'h&w' || nameLower === 'hw&uw') {
                      dept = 'H&W';
                      rType = 'Department';
                    } else {
                      // Discard subgroup rows of MERCH (like Boy, Girl, Footwear, etc.) to prevent duplicate Buyer nodes
                      return null;
                    }
                  }
                  
                  // Filter out aggregate season rows or Toplam/Total rows
                  const nameLower = (r.Name || '').toLowerCase().trim();
                  const excludedNames = [
                    "active season",
                    "ns",
                    "old ss",
                    "old aw",
                    "new season",
                    "toplam",
                    "total",
                    "season"
                  ];
                  if (excludedNames.includes(nameLower)) {
                    return null;
                  }

                  const validDepts = ["WOMAN", "MAN", "KIDS & BABY", "ACC&FTW", "H&W"];
                  if (!validDepts.includes(dept)) {
                    return null;
                  }
                  
                  const lowerType = rType.toLowerCase();
                  if (lowerType === 'class' || lowerType === 'divf') rType = 'Class';
                  else if (lowerType === 'lifestyle' || lowerType === 'season') rType = 'Lifestyle';
                  else if (lowerType === 'buyer') rType = 'Buyer';
                  else if (lowerType === 'department') rType = 'Department';

                  // Robust programmatic RowType override based on Name to avoid AI misclassification of Lifestyle/Buyer/Class
                  if (rType !== 'Department') {
                    const nameStr = (r.Name || '').trim();
                    const lifestyleNames = ["fit", "core", "cns", "special collection", "traditional", "young", "casual", "smart casual"];
                    const buyerNames = ["tricot", "outer wear", "swimwear", "blazer & vest", "knitted bottom", "dress & skirt", "woven bottom", "denim", "woven top", "knitted", "accessory", "babyboy", "babygirl", "boy", "girl", "homewear", "underwear", "woman", "man", "unisex"];
                    
                    const normalizedName = nameStr.toLowerCase().replace(/\s+/g, ' ');
                    if (lifestyleNames.some(l => normalizedName === l || normalizedName.replace(/\s/g, '') === l.replace(/\s/g, ''))) {
                      rType = 'Lifestyle';
                    } else if (buyerNames.some(b => normalizedName === b || normalizedName.replace(/\s/g, '') === b.replace(/\s/g, ''))) {
                      rType = 'Buyer';
                    } else {
                      rType = 'Class';
                    }
                  }

                  return {
                    Department: dept,
                    RowType: rType,
                    Name: rType === 'Department' ? dept : r.Name,
                    SalesAmount: parseTurkishNumber(r.SalesAmount),
                    SalesAmountLFLPct: parseTurkishNumber(r.SalesAmountLFLPct),
                    SalesQuantity: parseTurkishNumber(r.SalesQuantity),
                    SalesQuantityLFLPct: parseTurkishNumber(r.SalesQuantityLFLPct),
                    StoreSalesPct: parseTurkishNumber(r.StoreSalesPct),
                    RegionSalesPct: parseTurkishNumber(r.RegionSalesPct),
                    SalesAmountPct: parseTurkishNumber(r.StockSalesDiffPct !== undefined ? r.StockSalesDiffPct : r.SalesAmountPct),
                    StockCostPct: parseTurkishNumber(r.StockCostPct),
                    OnHandQty: parseTurkishNumber(r.OnHandQty),
                    StockQtyLFLPct: parseTurkishNumber(r.StockQtyLFLPct),
                    Cover: parseTurkishNumber(r.Cover),
                    OnWay: parseTurkishNumber(r.OnWay),
                    NetFinalOccupancyPct: parseTurkishNumber(r.NetFinalOccupancyPct)
                  };
                }).filter((r: any) => r !== null);

                allRows.push(...mappedRows);
              }
            } catch (err) {
              console.error(`Job ${jobId}: Sayfa ${p} çözümlenirken hata:`, err);
            }
          })()
        );
      }

      await Promise.all(extractionPromises);
      console.log(`Job ${jobId}: Tüm sayfalar paralel olarak işlendi. Toplam satır sayısı: ${allRows.length}`);

    } else {
      // Metin tabanlı eski okuma yöntemi (Geriye uyumluluk için)
      const pageMarker = /----------------Page \(\d+\) Break----------------/;
      const pages = job.raw_text
        .split(pageMarker)
        .map((p: string) => p.trim())
        .filter((p: string) => p.length > 0);

      console.log(`Job ${jobId}: PDF metni (Eski format) ${pages.length} sayfaya bölündü. Veri çıkarımı başlatılıyor...`);

      const extractionPromises = pages.map((pageText: string, index: number) => {
        const prompt = `Extract both the overall store metrics and the tabular data from this store dashboard text dump.
The text was extracted from a PDF. Ignore formatting issues and try to reconstruct the table logic.

CRITICAL INSTRUCTIONS FOR DEPARTMENT MAPPING:
- Each page belongs to a specific main Department. The department name is printed vertically on the left margin (e.g. letters split across lines). Reconstruct this vertical name and apply it to ALL rows on this page.
- Mapping rules for Department:
  * If you see vertical letters 'W', 'O', 'M', 'A', 'N', the department is 'WOMAN'.
  * If you see vertical letters 'M', 'A', 'N', the department is 'MAN'.
  * If you see vertical letters 'K', 'I', 'D', 'S', the department is 'KIDS & BABY'.
  * If you see vertical letters 'H', 'W', '&', 'U', 'W', the department is 'H&W'.
  * If you see vertical letters 'A', 'C', 'C', '&', 'F', 'T', 'W' or 'C', 'C', '&', 'F', 'T', 'W', the department is 'ACC&FTW'.
  * For other sections, if you cannot find a main department, try to map it to the closest parent department or use the context.
  * DO NOT use category names (like 'Tricot', 'Denim', 'Socks', 'Wallets') as the Department name. Every row must be mapped to one of the main departments: 'WOMAN', 'MAN', 'KIDS & BABY', 'ACC&FTW', or 'H&W'.

CRITICAL COLUMN ALIGNMENT & FIELD MAPPING RULES:
Each row of data in the PDF tables generally consists of up to 15 columns separated by spaces.
Please trace each row from left to right, counting the fields to extract them correctly.
For all percentage and numeric values, parse them as valid floats (Turkish uses comma ',' as decimal separator and period '.' as thousand separator, e.g. "64.815" -> 64815, "11,4" -> 11.4, "12,2%" -> 12.2, "-%33,43" -> -33.43):

Field 1: Name / Group (e.g. "Traditional", "Young", "Tricot", "Knitted Bottom"). Note: If name has spaces (like "Special Col lection" or "Traditiona l"), combine it.
Field 2: Sales Amount (e.g. "99.320" or "64.815") -> Map to "SalesAmount".
Field 3: Sales Quantity (e.g. "168" or "131") -> Map to "SalesQuantity".
Field 4: Sales Amount LFL % (e.g. "-%0,08" or "-%33,43" or "%48,75") -> Map to "SalesAmountLFLPct".
Field 5: Sales Quantity LFL % (e.g. "-%21,1" or "-%45,4" or "%22,1") -> Map to "SalesQuantityLFLPct".
Field 6: Region Sales % (e.g. "12,2%" or "13,1%" or "22,8%") -> Map to "RegionSalesPct".
Field 7: Store Sales % (labeled Store Amount % or Stock Amount %, e.g. "%17,1" or "%13,9" or "%24,4") -> Map to "StoreSalesPct".
Field 8: Stock Cost % (e.g. "%15,5" or "%13,6" or "%18,3") -> Map to "StockCostPct".
Field 9: Stock - Sales Difference % (labeled Stock - Sales Amount %, e.g. "-%1,6" or "-%0,3" or "-%6,1").
  * CRITICAL FOR WOMAN DEPARTMENT: Extract this column correctly (e.g. "-%0,3" for Traditional, "-%1,5" for Young, "-%0,9" for Casual) and map it to "SalesAmountPct". DO NOT mix it with or map it to the Stock Cost % values of Field 8 (e.g., do not use 13.6, 19.0, or 24.9).
Field 10: OnHand Stock Qty (e.g. "1.683" or "1.498" or "2.298") -> Map to "OnHandQty".
Field 11: Stock Qty LFL % (e.g. "-%19,8" or "-%9,0"). IMPORTANT: If this column is completely empty/missing in the text row (for example, if there is no percentage value between Field 10/OnHand and Cover, as in "1.498   11,4"), then "StockQtyLFLPct" MUST be 0. Otherwise, map to "StockQtyLFLPct".
Field 12: Cover (e.g. "10,0" or "11,4" or "8,1") -> Map to "Cover".
Field 13: OnWay Qty (e.g. "222" or "196" or "384") -> Map to "OnWay".
Field 14: Occupancy Actual (e.g. "%142,6" or "%98,4") -> Ignore / do not output (but count it as Field 14).
Field 15: Occupancy Net Final (e.g. "%160,9" or "%98,0") -> Map to "NetFinalOccupancyPct".

CRITICAL ROWTYPE RULES & EXCLUSIONS:
- Classify the RowType for each row strictly as follows:
  * RowType = "Department" for overall department totals (e.g. Name matches Department name, or "Toplam").
  * RowType = "Lifestyle" for groups like: "Fit", "Core", "CNS", "Special Collection", "Traditional", "Young", "Casual", "Smart Casual".
  * RowType = "Buyer" for buyers like: "Tricot", "Outer Wear", "Swimwear", "Blazer & Vest", "Knitted Bottom", "Dress & Skirt", "Woven Bottom", "Denim", "Woven Top", "Knitted", "Accessory", "BabyBoy", "BabyGirl", "Boy", "Girl", "Homewear", "Underwear", "Woman", "Man", "Unisex".
  * RowType = "Class" for all other class rows (e.g. specific product types like Shirt, Vest, Jacket, Bermuda, Trousers, Short Sleeve T-Shirt, etc.).
- CRITICAL EXCLUSION RULES (DO NOT OUTPUT THESE ROWS):
  1. Do NOT extract or output any rows representing seasons or season aggregates (such as "ACTIVE SEASON", "NS", "OLD SS", "OLD AW", "NEW SEASON", or "SEASON").
  2. Do NOT extract or output any rows from the "Time Based Sales Analysis" sections. These are monthly rows (names look like "022026", "032026", "122025" etc.) or hourly rows (e.g. "10:00", "11:00").
  3. Do NOT extract or output the overall store "Toplam" or "Total" summary row (which has 100% Region Sales and 100% Store Sales).
  Completely ignore these rows and do not add them to the "rows" array.

CRITICAL JSON STRUCTURE:
- Return a raw, valid JSON object WITHOUT any markdown code blocks. Start directly with { and end with }.
- The JSON must have this exact structure:
{
  "metrics": { "SalesAmount": 0, "SalesAmountLYPct": 0, "SalesQuantity": 0, "SalesQuantityLYPct": 0, "Cover": 0, "ConversionPct": 0, "IPT": 0, "ATV": 0, "Footfall": 0, "UnitPrice": 0 },
  "rows": [
    { "Department": "WOMAN/MAN/KIDS & BABY/ACC&FTW/H&W", "RowType": "Department/Lifestyle/Class/Buyer", "Name": "...", "StoreSalesPct": 0, "RegionSalesPct": 0, "SalesAmountPct": 0, "StockCostPct": 0, "SalesAmountLFLPct": 0, "StockQtyLFLPct": 0, "SalesQuantityLFLPct": 0, "Cover": 0, "OnWay": 0, "NetFinalOccupancyPct": 0, "SalesAmount": 0, "OnHandQty": 0, "SalesQuantity": 0 }
  ]
}
- Do NOT skip any rows on this page unless they match the exclusion rules. Extract everything!

Here is the extracted text from Page ${index}:
${pageText}`;

        return fetchGeminiWithRetry(prompt, geminiApiKey)
          .catch(err => {
            console.error(`Page ${index} extraction failed:`, err);
            return { metrics: null, rows: [] };
          });
      });

      const results = await Promise.all(extractionPromises);

      results.forEach((res) => {
        if (res.metrics && (res.metrics.SalesAmount > 0 || !storeMetrics)) {
          storeMetrics = res.metrics;
        }
        if (Array.isArray(res.rows)) {
          allRows.push(...res.rows);
        }
      });
      console.log(`Job ${jobId}: Sayfalar birleştirildi (Eski format). Toplam satır sayısı: ${allRows.length}. Hiyerarşik yapı oluşturuluyor...`);
    }

    // 5. Durumu 'analyzing' yap (Bu aşama hızlı biter, Next.js dashboard_data bekler)
    await supabaseClient
      .from('ai_analysis_jobs')
      .update({ status: 'analyzing', extracted_data: { metrics: storeMetrics, rows: allRows }, updated_at: new Date().toISOString() })
      .eq('id', jobId);

    // 6. Hiyerarşik yapıyı oluştur (processStoreData)
    const dashboardData = processStoreData(allRows);
    if (storeMetrics) {
      dashboardData.storeMetrics = storeMetrics;
    }

    // 7. Doğrudan sonuçları store_analyses tablosuna kaydet (Yapay Zeka derin analizi olmadan)
    console.log(`Job ${jobId}: Sonuçlar store_analyses tablosuna yazılıyor...`);
    const { error: insertError } = await supabaseClient
      .from('store_analyses')
      .insert({
        organization_id: job.organization_id,
        created_by: job.created_by,
        status: 'completed',
        dashboard_data: dashboardData
      });

    if (insertError) {
      throw new Error('store_analyses tablosuna yazılamadı: ' + insertError.message);
    }

    // Cleanup old records to keep only the 3 latest store_analyses and ai_analysis_jobs for this organization
    try {
      const orgId = job.organization_id;

      // Clean store_analyses
      const { data: analyses } = await supabaseClient
        .from('store_analyses')
        .select('id')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (analyses && analyses.length > 3) {
        const idsToDelete = analyses.slice(3).map((a: any) => a.id);
        const { error: delError } = await supabaseClient
          .from('store_analyses')
          .delete()
          .in('id', idsToDelete);
        if (delError) console.error('Error cleaning old store_analyses:', delError);
        else console.log(`Deleted ${idsToDelete.length} old store_analyses records.`);
      }

      // Clean ai_analysis_jobs
      const { data: jobs } = await supabaseClient
        .from('ai_analysis_jobs')
        .select('id')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

      if (jobs && jobs.length > 3) {
        const idsToDelete = jobs.slice(3).map((j: any) => j.id);
        const { error: delError } = await supabaseClient
          .from('ai_analysis_jobs')
          .delete()
          .in('id', idsToDelete);
        if (delError) console.error('Error cleaning old ai_analysis_jobs:', delError);
        else console.log(`Deleted ${idsToDelete.length} old ai_analysis_jobs records.`);
      }
    } catch (cleanError) {
      console.error('Record cleanup failed:', cleanError);
    }

    // 8. İşlemi tamamla (status: completed)
    await supabaseClient
      .from('ai_analysis_jobs')
      .update({ 
        status: 'completed', 
        final_insights: dashboardData, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', jobId);

    console.log(`Job ${jobId}: Ham veri okuma başarıyla tamamlandı!`);
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error(`Edge function crash:`, error);
    
    // Hata durumunda veritabanını güncelle
    if (jobId && supabaseClient) {
      try {
        await supabaseClient
          .from('ai_analysis_jobs')
          .update({ 
            status: 'error', 
            error_message: error.message || 'Bilinmeyen Hata' 
          })
          .eq('id', jobId);
      } catch (e) {
        console.error('Failed to update job status to error in DB:', e);
      }
    }

    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
