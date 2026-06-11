export interface RawStoreDataRow {
  Department: string; // e.g. "WOMAN", "MAN", "KIDS & BABY"
  RowType?: string; // "Lifestyle" or "Class"
  Name?: string;
  Lifestyle?: string; // Backwards compatibility
  Class?: string; // Backwards compatibility
  Group?: string; // Backwards compatibility
  StoreSalesPct: number; // Sales Amount %
  RegionSalesPct: number; // Region Sales %
  SalesAmountLFLPct: number; // Büyüme (Sales Amount LFL %)
  StockQtyLFLPct?: number; // Stok Adet Büyümesi
  SalesQuantityLFLPct?: number; // Satış Adet Büyümesi
  Cover: number; // Stok Devir Hızı
  OnWay: number; // Yoldaki Ürün
  NetFinalOccupancyPct: number; // Kapasite %
  SalesAmount: number; // Toplam Ciro hesaplamak için
}

export interface AnalysisInsight {
  status: 'green' | 'red' | 'neutral'; // Simple visual badge
  warning: string; // Short badge text
  diagnosis: string; // Legacy fallback text
  action: string; // Legacy fallback action
}

export interface DeepInsight {
  main_finding: string;
  scenarios: Array<{
    title: string;
    probability: number;
    description: string;
  }>;
  validation_task: string;
}

export interface ClassNode extends RawStoreDataRow {
  insight: AnalysisInsight;
  deepInsight?: DeepInsight;
  name: string;
}

export interface BuyerNode extends RawStoreDataRow {
  insight: AnalysisInsight;
  deepInsight?: DeepInsight;
  name: string;
}

export interface LifestyleNode extends RawStoreDataRow {
  insight: AnalysisInsight;
  deepInsight?: DeepInsight;
  name: string;
}

export interface DepartmentNode {
  name: string;
  TotalSalesAmount: number;
  StoreSalesPct: number;
  SalesAmountLFLPct?: number;
  Cover?: number;
  NetFinalOccupancyPct?: number;
  lifestyles: LifestyleNode[];
  classes: ClassNode[];
  buyers: BuyerNode[];
}

export interface StoreMetrics {
  SalesAmount: number;
  SalesAmountLYPct: number;
  SalesQuantity: number;
  SalesQuantityLYPct: number;
  Cover: number;
  ConversionPct: number;
  IPT: number;
  ATV: number;
  Footfall: number;
  UnitPrice: number;
}

export interface ProcessedStoreDashboard {
  departments: DepartmentNode[];
  storeMetrics?: StoreMetrics;
  totalSales: number;
  generatedAt: string;
  analysisType?: 'strict' | 'free';
  storeAverageCover?: number;
}

/**
 * Applies deterministic threshold rules to generate AI-like insights
 * @param row The store data row (either for a Class or aggregated for a Lifestyle)
 * @returns AnalysisInsight
 */
export function generateInsight(
  StoreSalesPct: number,
  RegionSalesPct: number,
  SalesAmountLFLPct: number,
  Cover: number,
  NetFinalOccupancyPct: number
): AnalysisInsight {
  const isMarketShareLow = RegionSalesPct > StoreSalesPct;
  const isMarketShareHigh = StoreSalesPct > RegionSalesPct;
  const isGrowing = SalesAmountLFLPct > 0;

  // Rule 1: Capacity Bloat
  if (isMarketShareLow && NetFinalOccupancyPct > 120) {
    return {
      status: 'red',
      warning: 'Kritik Kapasite Uyarı',
      diagnosis: 'Kapasite Şişkinliği: Pazar payı düşük olmasına rağmen mağazada aşırı ürün birikmesi var.',
      action: 'Reyonu ferahlat, ağır stokları depoya çek veya bölgesel iade sürecini başlat.',
    };
  }

  // Rule 2: Stock Out / Size Broken
  if (isMarketShareLow && Cover < 8) {
    return {
      status: 'red',
      warning: 'Stok Kesintisi Riski',
      diagnosis: 'Beden Kırıklığı / Stok Sorunu: Bölgede potansiyel var ancak mağazanızdaki stok derinliği (Cover) yetersiz.',
      action: 'Eksik bedenleri tamamla, merkezden acil transfer iste.',
    };
  }

  // Rule 3: Missing the Trend
  if (isMarketShareLow && isGrowing) {
    return {
      status: 'red',
      warning: 'Trendi Kaçırma Riski',
      diagnosis: 'Büyüme Var Ama Pazar Payı Düşük: Satışlar artsa da bölgedeki satış trendinin gerisinde kalınıyor.',
      action: 'Görsel düzenlemeyi (VM) güçlendir, çapraz satış önerilerini artır.',
    };
  }

  // Rule 4: Strong Performer
  if (isMarketShareHigh && isGrowing) {
    return {
      status: 'green',
      warning: 'Güçlü Performans',
      diagnosis: 'Güçlü Yön / Lider Kategori: Mağaza payı bölgeden yüksek ve büyüme pozitif seyrediyor.',
      action: 'Stok sürekliliğini sağla, bu gruptaki başarılı uygulamaları diğer gruplara taşı.',
    };
  }
  
  // Rule 5: Declining Leader
  if (isMarketShareHigh && !isGrowing) {
    return {
      status: 'neutral',
      warning: 'Düşüş Eğilimi',
      diagnosis: 'Pazar Payı Yüksek Ancak Büyüme Negatif: Geçen seneye göre daralma var.',
      action: 'Satış hızını artıracak yerel kampanyalar düşün veya yavaş satan ürünleri vitrinden çek.',
    };
  }

  // Default
  return {
    status: isMarketShareHigh ? 'green' : 'red',
    warning: isMarketShareHigh ? 'Ortalama Üstü' : 'Gelişim Alanı',
    diagnosis: isMarketShareHigh ? 'Genel gidişat bölge ortalamasının üzerinde.' : 'Pazar payında bölgenin gerisinde kalınıyor.',
    action: isMarketShareHigh ? 'Mevcut stratejiyi koru.' : 'Bölgedeki iyi uygulamaları incele.',
  };
}

/**
 * Transforms flat Excel/JSON rows into hierarchical processed dashboard
 */
export function processStoreData(rawRows: any[]): ProcessedStoreDashboard {
  let totalSales = 0;
  const deptMap = new Map<string, DepartmentNode>();

  let totalCover = 0;
  let coverCount = 0;
  for (const raw of rawRows) {
    const c = Number(raw.Cover || raw.cover || 0);
    if (c > 0) {
      totalCover += c;
      coverCount++;
    }
  }
  const storeAverageCover = coverCount > 0 ? totalCover / coverCount : 0;

  let lastDept = 'Bilinmeyen Departman';

  for (const raw of rawRows) {
    // Robust key mapping
    const deptName = raw.Department || raw.department || raw.DEPARTMENT || lastDept;
    
    // Determine type and name
    let rowType = raw.RowType || raw.rowType;
    let name = raw.Name || raw.name;

    // Fallback for older JSON schema where we had Lifestyle/Group and Class
    if (!rowType || !name) {
      if (raw.Class || raw.class || raw.CLASS) {
        rowType = 'Class';
        name = raw.Class || raw.class || raw.CLASS;
      } else if (raw.Lifestyle || raw.lifestyle || raw.Group || raw.group) {
        rowType = 'Lifestyle';
        name = raw.Lifestyle || raw.lifestyle || raw.Group || raw.group;
      } else {
        rowType = 'Class'; // default fallback
        name = 'İsimsiz Sınıf';
      }
    }
    
    lastDept = deptName;

    const row: RawStoreDataRow = {
      Department: deptName,
      RowType: rowType,
      Name: name,
      StoreSalesPct: Number(raw.StoreSalesPct || raw.storeSalesPct || 0),
      RegionSalesPct: Number(raw.RegionSalesPct || raw.regionSalesPct || 0),
      SalesAmountLFLPct: Number(raw.SalesAmountLFLPct || raw.salesAmountLFLPct || 0),
      StockQtyLFLPct: Number(raw.StockQtyLFLPct || raw.stockQtyLFLPct || 0),
      SalesQuantityLFLPct: Number(raw.SalesQuantityLFLPct || raw.salesQuantityLFLPct || 0),
      Cover: Number(raw.Cover || raw.cover || 0),
      OnWay: Number(raw.OnWay || raw.onWay || 0),
      NetFinalOccupancyPct: Number(raw.NetFinalOccupancyPct || raw.netFinalOccupancyPct || 0),
      SalesAmount: Number(raw.SalesAmount || raw.salesAmount || 0)
    };

    totalSales += row.SalesAmount;

    if (!deptMap.has(row.Department)) {
      deptMap.set(row.Department, {
        name: row.Department,
        TotalSalesAmount: 0,
        StoreSalesPct: 0,
        lifestyles: [],
        classes: [],
        buyers: []
      });
    }

    const dept = deptMap.get(row.Department)!;
    dept.TotalSalesAmount += row.SalesAmount;

    const insight = generateInsight(
      row.StoreSalesPct,
      row.RegionSalesPct,
      row.SalesAmountLFLPct,
      row.Cover,
      row.NetFinalOccupancyPct
    );

    if (rowType === 'Department' || name === deptName) {
      dept.StoreSalesPct = row.StoreSalesPct; // Set directly from AI
      dept.SalesAmountLFLPct = row.SalesAmountLFLPct;
      dept.Cover = row.Cover;
      dept.NetFinalOccupancyPct = row.NetFinalOccupancyPct;
    } else if (rowType === 'Lifestyle' || rowType === 'Group') {
      dept.lifestyles.push({ ...row, insight, name: name });
    } else if (rowType === 'Buyer') {
      dept.buyers.push({ ...row, insight, name: name });
    } else {
      dept.classes.push({ ...row, insight, name: name });
    }
  }

  // Second pass: Calculate department aggregates (only if not set directly from a Department row)
  for (const dept of deptMap.values()) {
    if (dept.StoreSalesPct === 0) {
      let deptStoreSalesPct = 0;
      for (const c of dept.classes) {
        deptStoreSalesPct += c.StoreSalesPct;
      }
      dept.StoreSalesPct = deptStoreSalesPct;
    }
  }

  return {
    departments: Array.from(deptMap.values()),
    totalSales,
    generatedAt: new Date().toISOString(),
    storeAverageCover
  };
}

export function getPreProcessedDeltas(node: RawStoreDataRow, type: string, storeAverageCover: number = 0) {
  // Katman 1: Tetikleyiciler (Triggers)
  let priority = 99;
  let triggerTag = "";
  let triggerDesc = "";

  const salesLFL = node.SalesAmountLFLPct || 0;
  const stockQtyLFL = node.StockQtyLFLPct || 0;
  const salesQtyLFL = node.SalesQuantityLFLPct || 0;
  
  if (salesLFL - stockQtyLFL < -10) {
    priority = 1;
    triggerTag = "[OPERASYONEL_KAYIP]";
    triggerDesc = "Satış düşüşü stok daralmasından daha sert.";
  } else if (salesLFL < 0 && stockQtyLFL < 0 && node.Cover < 5 && node.OnWay === 0) {
    priority = 2;
    triggerTag = "[YOK_SATMA_RISKI]";
    triggerDesc = "Satamıyoruz çünkü mal bitti ve yolda mal yok.";
  } else if (salesLFL - salesQtyLFL < -15) {
    priority = 3;
    triggerTag = "[MARJ_BASKISI]";
    triggerDesc = "Adet satıyor ama ciro gelmiyor (sepet şişiyor, marj düşüyor).";
  } else if (salesLFL > 30 && stockQtyLFL > 0 && storeAverageCover > 0 && node.Cover < storeAverageCover) {
    priority = 4;
    triggerTag = "[GIZLI_SAMPIYON]";
    triggerDesc = "Mağaza ortalamasından hızlı büyüyor ve dönüyor.";
  } else {
    triggerTag = "[NÖTR]";
    triggerDesc = "Spesifik bir tetikleyici alarm üretmedi.";
  }

  // Katman 2: Bağlam ve Eşik Etiketleri (Context)
  const spaceScore = (node.StoreSalesPct || 0) - (node.NetFinalOccupancyPct || 0);
  let spaceLabel = "";
  if (spaceScore > 5) spaceLabel = "[GİZLİ KAHRAMAN]";
  else if (spaceScore > 2) spaceLabel = "[DENGELİ - POZİTİF]";
  else if (spaceScore > -2) spaceLabel = "[NÖTR]";
  else if (spaceScore > -5) spaceLabel = "[VERİMSİZ]";
  else spaceLabel = "[ALAN ASALAĞI]";

  const marketGap = (node.StoreSalesPct || 0) - (node.RegionSalesPct || 0);
  const velocityDev = storeAverageCover > 0 ? ((node.Cover || 0) / storeAverageCover).toFixed(2) : "Bilinmiyor";

  return {
    id: `${node.Department}-${type}-${node.Name}`,
    category_name: node.Name || "Bilinmeyen Ürün",
    trigger: {
      priority,
      tag: triggerTag,
      description: triggerDesc
    },
    context: {
      space_opportunity: {
        score: spaceScore.toFixed(1),
        label: spaceLabel
      },
      market_power_gap: marketGap.toFixed(1),
      velocity_deviation: velocityDev,
      current_cover: node.Cover,
      on_way_qty: node.OnWay,
      sales_lfl_pct: salesLFL,
      stock_qty_lfl_pct: stockQtyLFL,
      sales_qty_lfl_pct: salesQtyLFL
    }
  };
}
