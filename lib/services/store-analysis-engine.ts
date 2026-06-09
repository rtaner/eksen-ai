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
  diagnosis: string;
  action: string;
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
    generatedAt: new Date().toISOString()
  };
}

export function getPreProcessedDeltas(node: RawStoreDataRow, type: string) {
  // Pazar Durumu (Mağaza Pct vs Bölge Pct)
  const marketShareDiff = node.StoreSalesPct - node.RegionSalesPct;
  let pazar_durumu = "Bölge ile aynı seviyede";
  if (marketShareDiff > 1) {
    pazar_durumu = `Bölgenin %${marketShareDiff.toFixed(1)} ilerisinde`;
  } else if (marketShareDiff < -1) {
    pazar_durumu = `Bölgenin %${Math.abs(marketShareDiff).toFixed(1)} gerisinde`;
  }

  // Büyüme Trendi (LFL)
  let buyume_trendi = "Durağan (Büyüme yok)";
  if (node.SalesAmountLFLPct > 5) {
    buyume_trendi = `Pozitif (Geçen seneye göre +%${node.SalesAmountLFLPct.toFixed(1)})`;
  } else if (node.SalesAmountLFLPct < -5) {
    buyume_trendi = `Negatif (Geçen seneye göre -%${Math.abs(node.SalesAmountLFLPct).toFixed(1)})`;
  }

  // Stok Hızı (Cover)
  let stok_hizi = "Normal Seyrinde";
  if (node.Cover > 0 && node.Cover < 8) {
    stok_hizi = `Çok Hızlı / Riskli (Cover: ${node.Cover})`;
  } else if (node.Cover > 10) {
    stok_hizi = `Yavaş (Cover: ${node.Cover}, idealin üstünde)`;
  }

  // Reyon Durumu (Occupancy)
  let reyon_durumu = "İdeal Seviye";
  if (node.NetFinalOccupancyPct > 120) {
    reyon_durumu = `Aşırı Şişkin (Occupancy: %${node.NetFinalOccupancyPct.toFixed(1)})`;
  } else if (node.NetFinalOccupancyPct < 80) {
    reyon_durumu = `Eksik / Seyrek (Occupancy: %${node.NetFinalOccupancyPct.toFixed(1)})`;
  }

  return {
    id: `${node.Department}-${type}-${node.Name}`,
    urun: node.Name || "Bilinmeyen Ürün",
    pazar_durumu,
    buyume_trendi,
    stok_hizi,
    reyon_durumu,
    yoldaki_urun_adet: node.OnWay || 0
  };
}
