'use client';

import { useRouter } from 'next/navigation';
import { AIAnalysis } from '@/lib/types/analyses';
import { capitalizeFirst } from '@/lib/utils/textFormat';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import YetkinlikDisplay from './displays/YetkinlikDisplay';
import EgilimDisplay from './displays/EgilimDisplay';
import ButunlesikDisplay from './displays/ButunlesikDisplay';

interface AnalysisDetailClientProps {
  analysis: any;
  isOwner: boolean;
}

const analysisTypeLabels = {
  yetkinlik: '📋 Yetkinlik Analizi',
  egilim: '📈 Eğilim Analizi',
  butunlesik: '🔄 Bütünleşik Analiz',
};

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Az önce';
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} dakika önce`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} saat önce`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} gün önce`;

  return date.toLocaleDateString('tr-TR');
}

export default function AnalysisDetailClient({
  analysis,
  isOwner,
}: AnalysisDetailClientProps) {
  const router = useRouter();

  const dateRangeStart = new Date(analysis.date_range_start);
  const dateRangeEnd = new Date(analysis.date_range_end);

  const handleExportPDF = () => {
    const analysisContent = document.getElementById('analysis-content');
    if (!analysisContent) return;

    // Clone and clean the content
    const contentClone = analysisContent.cloneNode(true) as HTMLElement;
    
    // Convert Tailwind classes to inline styles for better compatibility
    const cards = contentClone.querySelectorAll('[class*="border-"]');
    cards.forEach((card) => {
      const classList = card.className;
      
      // Score-based colors for Yetkinlik analysis
      if (classList.includes('border-green-200')) {
        (card as HTMLElement).style.cssText += 'background: #f0fdf4 !important; border: 2px solid #bbf7d0 !important;';
      } else if (classList.includes('border-yellow-200')) {
        (card as HTMLElement).style.cssText += 'background: #fefce8 !important; border: 2px solid #fde047 !important;';
      } else if (classList.includes('border-red-200')) {
        (card as HTMLElement).style.cssText += 'background: #fef2f2 !important; border: 2px solid #fecaca !important;';
      }
      
      // Score text colors
      const scoreElements = card.querySelectorAll('[class*="text-green-"], [class*="text-yellow-"], [class*="text-red-"]');
      scoreElements.forEach((el) => {
        const elClassList = el.className;
        if (elClassList.includes('text-green-600')) {
          (el as HTMLElement).style.color = '#16a34a';
        } else if (elClassList.includes('text-yellow-600')) {
          (el as HTMLElement).style.color = '#ca8a04';
        } else if (elClassList.includes('text-red-600')) {
          (el as HTMLElement).style.color = '#dc2626';
        }
      });
    });
    
    // Create enhanced HTML content with beautiful styling
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="tr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Analiz - ${analysis.personnel.name}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              background: #f9fafb;
              padding: 20px;
              line-height: 1.625;
              color: #1f2937;
            }
            
            .container {
              max-width: 1200px;
              margin: 0 auto;
            }
            
            .header {
              background: white;
              padding: 32px;
              border-radius: 12px;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              margin-bottom: 24px;
            }
            
            .header h1 {
              font-size: 28px;
              margin-bottom: 16px;
              font-weight: 700;
              color: #111827;
            }
            
            .info-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 12px;
              margin-top: 16px;
            }
            
            .info-card {
              padding: 12px;
              background: #f9fafb;
              border-radius: 6px;
              border: 1px solid #e5e7eb;
            }
            
            .info-label {
              font-size: 12px;
              color: #6b7280;
              margin-bottom: 4px;
              font-weight: 500;
            }
            
            .info-value {
              font-size: 14px;
              font-weight: 600;
              color: #111827;
            }
            
            .content {
              display: flex;
              flex-direction: column;
              gap: 24px;
            }
            
            /* Card styling matching Tailwind Card component */
            .content > div {
              background: white;
              padding: 24px;
              border-radius: 12px;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              border: 1px solid #e5e7eb;
            }
            
            /* Blue card (Yönetici) */
            .content > div:nth-child(1) {
              border: 2px solid #bfdbfe;
              background: #eff6ff;
            }
            
            /* Green card (İK) */
            .content > div:nth-child(2) {
              border: 2px solid #bbf7d0;
              background: #f0fdf4;
            }
            
            /* Purple card (Kritik Olaylar) */
            .content > div:nth-child(3) {
              border: 2px solid #ddd6fe;
              background: #faf5ff;
            }
            
            h2 {
              color: #111827;
              font-size: 20px;
              margin-bottom: 16px;
              font-weight: 700;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            
            h3 {
              color: #374151;
              font-size: 18px;
              margin: 16px 0 12px 0;
              font-weight: 600;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            
            /* Blue section h3 */
            .content > div:nth-child(1) h3 {
              color: #1d4ed8;
            }
            
            /* Green section h3 */
            .content > div:nth-child(2) h3 {
              color: #15803d;
            }
            
            /* Purple/Orange section h3 */
            .content > div:nth-child(3) h3 {
              color: #7c3aed;
            }
            
            .content > div:nth-child(3) h3:nth-of-type(2) {
              color: #c2410c;
            }
            
            p {
              margin: 8px 0;
              color: #374151;
              line-height: 1.75;
              white-space: pre-wrap;
            }
            
            ul {
              list-style: none;
              padding: 0;
              margin: 8px 0;
            }
            
            li {
              margin: 8px 0;
              display: flex;
              align-items: flex-start;
              gap: 8px;
            }
            
            li span:first-child {
              font-weight: 700;
              margin-top: 4px;
              flex-shrink: 0;
            }
            
            /* Blue list items */
            .content > div:nth-child(1) li span:first-child {
              color: #2563eb;
            }
            
            /* Green list items */
            .content > div:nth-child(2) li span:first-child {
              color: #16a34a;
            }
            
            li span:last-child {
              color: #374151;
            }
            
            /* Grid for success/improvement areas */
            .grid-cols-2 {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
              gap: 24px;
              margin: 16px 0;
            }
            
            .success-card, .improvement-card {
              display: flex;
              flex-direction: column;
              gap: 12px;
            }
            
            .success-item, .improvement-item {
              padding: 12px;
              background: white;
              border-radius: 8px;
              border: 1px solid #e5e7eb;
              display: flex;
              align-items: flex-start;
              gap: 8px;
            }
            
            .success-item {
              border-left: 3px solid #16a34a;
            }
            
            .improvement-item {
              border-left: 3px solid #ea580c;
            }
            
            .success-item span:first-child {
              color: #16a34a;
              font-weight: 700;
              flex-shrink: 0;
            }
            
            .improvement-item span:first-child {
              color: #ea580c;
              font-weight: 700;
              flex-shrink: 0;
            }
            
            .success-item p, .improvement-item p {
              color: #374151;
              font-size: 14px;
              margin: 0;
            }
            
            /* Yetkinlik Analysis - Score-based colors */
            .score-card-green {
              background: #f0fdf4 !important;
              border: 2px solid #bbf7d0 !important;
            }
            
            .score-card-yellow {
              background: #fefce8 !important;
              border: 2px solid #fde047 !important;
            }
            
            .score-card-red {
              background: #fef2f2 !important;
              border: 2px solid #fecaca !important;
            }
            
            .score-text-green {
              color: #16a34a !important;
            }
            
            .score-text-yellow {
              color: #ca8a04 !important;
            }
            
            .score-text-red {
              color: #dc2626 !important;
            }
            
            .score-badge {
              font-size: 36px;
              font-weight: 700;
              line-height: 1;
            }
            
            .score-label {
              font-size: 12px;
              color: #6b7280;
              text-align: center;
              margin-top: 4px;
            }
            
            .footer {
              background: white;
              padding: 24px;
              text-align: center;
              color: #6b7280;
              font-size: 14px;
              border-radius: 12px;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              margin-top: 24px;
            }
            
            @media print {
              /* Print-friendly: Remove colors, keep structure */
              body {
                background: white !important;
                padding: 0;
              }
              
              .header {
                background: white !important;
                color: black !important;
                border: 2px solid #000 !important;
                box-shadow: none !important;
              }
              
              .info-card {
                background: white !important;
                border: 1px solid #000 !important;
              }
              
              .info-label, .info-value {
                color: black !important;
              }
              
              .content > div {
                background: white !important;
                border: 2px solid #000 !important;
                box-shadow: none !important;
                page-break-inside: avoid;
              }
              
              /* Remove all colored backgrounds for print */
              .score-card-green,
              .score-card-yellow,
              .score-card-red {
                background: white !important;
                border: 2px solid #000 !important;
              }
              
              /* Keep score colors as bold text instead */
              .score-text-green,
              .score-text-yellow,
              .score-text-red {
                color: #000 !important;
                font-weight: 900 !important;
              }
              
              .success-item,
              .improvement-item {
                background: white !important;
                border: 1px solid #000 !important;
              }
              
              .success-item span:first-child,
              .improvement-item span:first-child {
                color: #000 !important;
              }
              
              h2, h3 {
                color: #000 !important;
              }
              
              p, li span {
                color: #000 !important;
              }
              
              .footer {
                background: white !important;
                border: 1px solid #000 !important;
                box-shadow: none !important;
                color: #000 !important;
              }
              
              /* Add score indicator for print */
              .score-badge::after {
                content: " ★";
                font-size: 0.6em;
              }
            }
            
            @media (max-width: 768px) {
              .header {
                padding: 24px 16px;
              }
              
              .header h1 {
                font-size: 24px;
              }
              
              .content > div {
                padding: 16px;
              }
              
              .info-grid {
                grid-template-columns: 1fr;
              }
              
              .grid-cols-2 {
                grid-template-columns: 1fr;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${analysisTypeLabels[analysis.analysis_type as keyof typeof analysisTypeLabels]}</h1>
              <div class="info-grid">
                <div class="info-card">
                  <div class="info-label">Personel</div>
                  <div class="info-value">${capitalizeFirst(analysis.personnel.name)}</div>
                </div>
                <div class="info-card">
                  <div class="info-label">Dönem</div>
                  <div class="info-value">${dateRangeStart.toLocaleDateString('tr-TR')} - ${dateRangeEnd.toLocaleDateString('tr-TR')}</div>
                </div>
                <div class="info-card">
                  <div class="info-label">Oluşturulma</div>
                  <div class="info-value">${new Date(analysis.created_at).toLocaleDateString('tr-TR')}</div>
                </div>
                ${analysis.creator ? `
                <div class="info-card">
                  <div class="info-label">Oluşturan</div>
                  <div class="info-value">${capitalizeFirst(`${analysis.creator.name} ${analysis.creator.surname}`)}</div>
                </div>
                ` : ''}
              </div>
            </div>
            <div class="content">
              ${contentClone.innerHTML}
            </div>
            <div class="footer">
              <p>Bu rapor ${new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })} tarihinde oluşturulmuştur.</p>
              <p style="margin-top: 10px; font-size: 12px;">Eksen AI - Personel Yönetim Sistemi</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analiz-${analysis.personnel.name}-${analysis.analysis_type}-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.push('/settings/analyses')}
          className="mb-4"
        >
          ← Geri
        </Button>

        <Card>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {analysisTypeLabels[analysis.analysis_type as keyof typeof analysisTypeLabels]}
                </h1>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="font-medium">👤 Personel:</span>
                  <span>{capitalizeFirst(analysis.personnel.name)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">📅 Dönem:</span>
                  <span>
                    {dateRangeStart.toLocaleDateString('tr-TR')} -{' '}
                    {dateRangeEnd.toLocaleDateString('tr-TR')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">🕐 Oluşturulma:</span>
                  <span>{getRelativeTime(analysis.created_at)}</span>
                </div>
                {analysis.creator && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">👨‍💼 Oluşturan:</span>
                    <span>
                      {capitalizeFirst(
                        `${analysis.creator.name} ${analysis.creator.surname}`
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Export Buttons */}
            <div className="flex gap-2">
              <Button onClick={handleExportPDF} size="sm" variant="secondary">
                📄 PDF İndir
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Analysis Content */}
      <div id="analysis-content">
        {analysis.analysis_type === 'yetkinlik' && (
          <YetkinlikDisplay result={analysis.result} />
        )}
        {analysis.analysis_type === 'egilim' && (
          <EgilimDisplay result={analysis.result} />
        )}
        {analysis.analysis_type === 'butunlesik' && (
          <ButunlesikDisplay result={analysis.result} />
        )}
      </div>
    </div>
  );
}
