'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Analysis {
  id: string;
  dashboard_data: any;
  created_at: string;
}

interface StoreAnalysisDatabaseClientProps {
  initialAnalyses: Analysis[];
}

type SortKey = 
  | 'Department'
  | 'RowType'
  | 'Name'
  | 'SalesAmount'
  | 'StoreSalesPct'
  | 'RegionSalesPct'
  | 'SalesAmountLFLPct'
  | 'StockQtyLFLPct'
  | 'SalesQuantityLFLPct'
  | 'Cover'
  | 'OnWay'
  | 'NetFinalOccupancyPct'
  | 'SalesAmountPct'
  | 'OnHandQty';

export default function StoreAnalysisDatabaseClient({
  initialAnalyses,
}: StoreAnalysisDatabaseClientProps) {
  const [analyses, setAnalyses] = useState<Analysis[]>(initialAnalyses);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string>(
    initialAnalyses[0]?.id || ''
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedRowType, setSelectedRowType] = useState<string>('ALL');
  
  // Sorting State
  const [sortBy, setSortBy] = useState<SortKey>('SalesAmount');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const supabase = createClient();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const { data: refreshedAnalyses, error } = await supabase
        .from('store_analyses')
        .select('id, dashboard_data, created_at')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      if (refreshedAnalyses) {
        setAnalyses(refreshedAnalyses);
        if (refreshedAnalyses.length > 0 && (!selectedAnalysisId || !refreshedAnalyses.some(a => a.id === selectedAnalysisId))) {
          setSelectedAnalysisId(refreshedAnalyses[0].id);
        }
      }
    } catch (err) {
      console.error('Refresh error:', err);
      alert('Kayıtlar güncellenirken bir hata oluştu.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const selectedAnalysis = analyses.find(a => a.id === selectedAnalysisId);
  const dbData = selectedAnalysis?.dashboard_data || {};
  const totalSales = dbData.totalSales || 0;
  const storeAverageCover = dbData.storeAverageCover || 0;

  // Flatten the hierarchical structure into database rows
  const getFlatRows = () => {
    const rows: any[] = [];
    if (!dbData.departments) return rows;

    dbData.departments.forEach((dept: any) => {
      // Add Department overall summary row
      rows.push({
        Department: dept.name,
        RowType: 'Department',
        Name: `${dept.name} TOPLAM`,
        SalesAmount: dept.TotalSalesAmount || 0,
        StoreSalesPct: dept.StoreSalesPct || 0,
        RegionSalesPct: dept.RegionSalesPct || 0,
        SalesAmountLFLPct: dept.SalesAmountLFLPct || 0,
        StockQtyLFLPct: dept.StockQtyLFLPct || 0,
        SalesQuantityLFLPct: dept.SalesQuantityLFLPct || 0,
        Cover: dept.Cover || 0,
        OnWay: dept.OnWay || 0,
        NetFinalOccupancyPct: dept.NetFinalOccupancyPct || 0,
        SalesAmountPct: dept.SalesAmountPct || 0,
        OnHandQty: dept.OnHandQty || 0,
      });

      // Add Lifestyles
      if (Array.isArray(dept.lifestyles)) {
        dept.lifestyles.forEach((ls: any) => {
          rows.push({
            Department: dept.name,
            RowType: 'Lifestyle',
            Name: ls.name || ls.Name,
            SalesAmount: ls.SalesAmount || 0,
            StoreSalesPct: ls.StoreSalesPct || 0,
            RegionSalesPct: ls.RegionSalesPct || 0,
            SalesAmountLFLPct: ls.SalesAmountLFLPct || 0,
            StockQtyLFLPct: ls.StockQtyLFLPct || 0,
            SalesQuantityLFLPct: ls.SalesQuantityLFLPct || 0,
            Cover: ls.Cover || 0,
            OnWay: ls.OnWay || 0,
            NetFinalOccupancyPct: ls.NetFinalOccupancyPct || 0,
            SalesAmountPct: ls.SalesAmountPct || 0,
            OnHandQty: ls.OnHandQty || 0,
          });
        });
      }

      // Add Buyers
      if (Array.isArray(dept.buyers)) {
        dept.buyers.forEach((b: any) => {
          rows.push({
            Department: dept.name,
            RowType: 'Buyer',
            Name: b.name || b.Name,
            SalesAmount: b.SalesAmount || 0,
            StoreSalesPct: b.StoreSalesPct || 0,
            RegionSalesPct: b.RegionSalesPct || 0,
            SalesAmountLFLPct: b.SalesAmountLFLPct || 0,
            StockQtyLFLPct: b.StockQtyLFLPct || 0,
            SalesQuantityLFLPct: b.SalesQuantityLFLPct || 0,
            Cover: b.Cover || 0,
            OnWay: b.OnWay || 0,
            NetFinalOccupancyPct: b.NetFinalOccupancyPct || 0,
            SalesAmountPct: b.SalesAmountPct || 0,
            OnHandQty: b.OnHandQty || 0,
          });
        });
      }

      // Add Classes
      if (Array.isArray(dept.classes)) {
        dept.classes.forEach((c: any) => {
          rows.push({
            Department: dept.name,
            RowType: 'Class',
            Name: c.name || c.Name,
            SalesAmount: c.SalesAmount || 0,
            StoreSalesPct: c.StoreSalesPct || 0,
            RegionSalesPct: c.RegionSalesPct || 0,
            SalesAmountLFLPct: c.SalesAmountLFLPct || 0,
            StockQtyLFLPct: c.StockQtyLFLPct || 0,
            SalesQuantityLFLPct: c.SalesQuantityLFLPct || 0,
            Cover: c.Cover || 0,
            OnWay: c.OnWay || 0,
            NetFinalOccupancyPct: c.NetFinalOccupancyPct || 0,
            SalesAmountPct: c.SalesAmountPct || 0,
            OnHandQty: c.OnHandQty || 0,
          });
        });
      }
    });

    return rows;
  };

  const flatRows = getFlatRows();

  // Statistics
  const deptCount = dbData.departments?.length || 0;
  const lifestyleCount = flatRows.filter(r => r.RowType === 'Lifestyle').length;
  const buyerCount = flatRows.filter(r => r.RowType === 'Buyer').length;
  const classCount = flatRows.filter(r => r.RowType === 'Class').length;

  // Filter & Search Logic
  const filteredRows = flatRows.filter(row => {
    const matchesSearch = row.Name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === 'ALL' || row.Department === selectedDept;
    const matchesType = selectedRowType === 'ALL' || row.RowType === selectedRowType;
    return matchesSearch && matchesDept && matchesType;
  });

  // Sorting Logic
  const sortedRows = [...filteredRows].sort((a, b) => {
    let valA = a[sortBy];
    let valB = b[sortBy];

    if (typeof valA === 'string') {
      valA = valA.toLocaleLowerCase('tr-TR');
      valB = valB.toLocaleLowerCase('tr-TR');
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('desc'); // Default to descending for numeric values
    }
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('tr-TR', { maximumFractionDigits: 0 }) + ' ₺';
  };

  const formatPercent = (val: number) => {
    return '%' + val.toFixed(1);
  };

  const formatNumber = (val: number) => {
    return val.toLocaleString('tr-TR');
  };

  const getRowTypeBadge = (type: string) => {
    switch (type) {
      case 'Department':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Lifestyle':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Buyer':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'Class':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  const downloadJSON = () => {
    if (!selectedAnalysis) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(flatRows, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `store_analysis_flat_rows_${selectedAnalysisId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Back Button and Actions */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex-wrap gap-4">
        <Link
          href="/store-analysis"
          className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Mağaza Analizine Geri Dön
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={downloadJSON}
            disabled={sortedRows.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-sm font-semibold text-indigo-700 transition-colors disabled:opacity-50"
          >
            📥 Düz Satırları JSON İndir
          </button>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 transition-colors disabled:opacity-50"
          >
            {isRefreshing ? (
              <span className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>🔄</span>
            )}
            Kayıtları Yenile
          </button>
        </div>
      </div>

      {/* Select Upload Record */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Veritabanı Analiz Kaydı Seçin</label>
            <select
              value={selectedAnalysisId}
              onChange={(e) => setSelectedAnalysisId(e.target.value)}
              className="w-full md:w-96 border border-gray-200 rounded-lg p-2.5 text-sm text-gray-700 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {analyses.map((a) => {
                const dateStr = new Date(a.created_at).toLocaleString('tr-TR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                });
                const sales = a.dashboard_data?.totalSales || 0;
                return (
                  <option key={a.id} value={a.id}>
                    {dateStr} - {sales.toLocaleString('tr-TR')} ₺ Ciro ({a.id.substring(0, 8)}...)
                  </option>
                );
              })}
            </select>
          </div>

          {/* Mini Metadata */}
          {selectedAnalysis && (
            <div className="text-right text-xs text-gray-400 font-mono">
              <p>Veritabanı ID: {selectedAnalysis.id}</p>
              <p>Oluşturulma Tarihi: {new Date(selectedAnalysis.created_at).toISOString()}</p>
            </div>
          )}
        </div>

        {/* Info Cards */}
        {selectedAnalysis ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 pt-4 border-t border-gray-100">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Toplam Ciro</span>
              <span className="text-lg font-black text-gray-900 mt-1 block">{formatCurrency(totalSales)}</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Departman Sayısı</span>
              <span className="text-lg font-black text-gray-900 mt-1 block">{deptCount}</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Lifestyle Sayısı</span>
              <span className="text-lg font-black text-gray-900 mt-1 block">{lifestyleCount}</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Buyer Sayısı</span>
              <span className="text-lg font-black text-gray-900 mt-1 block">{buyerCount}</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Class Sayısı</span>
              <span className="text-lg font-black text-gray-900 mt-1 block">{classCount}</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Mağaza Cover Ort.</span>
              <span className="text-lg font-black text-gray-900 mt-1 block">{storeAverageCover.toFixed(1)}</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-400">Veritabanında analiz kaydı bulunamadı.</div>
        )}
      </div>

      {/* Filters */}
      {selectedAnalysis && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-900 text-sm">Filtreleme & Arama</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-500">Kategori / Sınıf Adı</label>
              <input
                type="text"
                placeholder="İsim ile ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-2 text-sm text-gray-700 shadow-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Department Filter */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-500">Departman</label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-2 text-sm text-gray-700 bg-white shadow-xs focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Tümü</option>
                <option value="WOMAN">WOMAN</option>
                <option value="MAN">MAN</option>
                <option value="KIDS & BABY">KIDS & BABY</option>
                <option value="ACC&FTW">ACC&FTW</option>
                <option value="H&W">H&W</option>
              </select>
            </div>

            {/* RowType Filter */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-500">Satır Türü</label>
              <select
                value={selectedRowType}
                onChange={(e) => setSelectedRowType(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-2 text-sm text-gray-700 bg-white shadow-xs focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Tümü</option>
                <option value="Department">Department (Departman Toplamları)</option>
                <option value="Lifestyle">Lifestyle (Yaşam Tarzları)</option>
                <option value="Buyer">Buyer (Alıcı Tipleri)</option>
                <option value="Class">Class (Ürün Sınıfları)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Main Table Grid */}
      {selectedAnalysis && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto max-h-[60vh] scrollbar-thin">
            <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
              <thead className="bg-gray-800 text-white font-bold tracking-wider uppercase sticky top-0 z-10 shadow-sm">
                <tr>
                  <th onClick={() => handleSort('Department')} className="px-4 py-3.5 cursor-pointer hover:bg-gray-700 transition-colors whitespace-nowrap">
                    Departman {sortBy === 'Department' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th onClick={() => handleSort('RowType')} className="px-4 py-3.5 cursor-pointer hover:bg-gray-700 transition-colors whitespace-nowrap">
                    Tür {sortBy === 'RowType' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th onClick={() => handleSort('Name')} className="px-4 py-3.5 cursor-pointer hover:bg-gray-700 transition-colors whitespace-nowrap">
                    İsim {sortBy === 'Name' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th onClick={() => handleSort('SalesAmount')} className="px-4 py-3.5 cursor-pointer hover:bg-gray-700 transition-colors text-right whitespace-nowrap">
                    Ciro {sortBy === 'SalesAmount' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th onClick={() => handleSort('StoreSalesPct')} className="px-4 py-3.5 cursor-pointer hover:bg-gray-700 transition-colors text-right whitespace-nowrap">
                    Mağaza Payı {sortBy === 'StoreSalesPct' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th onClick={() => handleSort('RegionSalesPct')} className="px-4 py-3.5 cursor-pointer hover:bg-gray-700 transition-colors text-right whitespace-nowrap">
                    Bölge Payı {sortBy === 'RegionSalesPct' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th onClick={() => handleSort('SalesAmountPct')} className="px-4 py-3.5 cursor-pointer hover:bg-gray-700 transition-colors text-right whitespace-nowrap">
                    Stok-Satış Fark % {sortBy === 'SalesAmountPct' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th onClick={() => handleSort('SalesAmountLFLPct')} className="px-4 py-3.5 cursor-pointer hover:bg-gray-700 transition-colors text-right whitespace-nowrap">
                    Ciro Büyüme (LFL) {sortBy === 'SalesAmountLFLPct' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th onClick={() => handleSort('StockQtyLFLPct')} className="px-4 py-3.5 cursor-pointer hover:bg-gray-700 transition-colors text-right whitespace-nowrap">
                    Stok Büyüme (LFL) {sortBy === 'StockQtyLFLPct' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th onClick={() => handleSort('SalesQuantityLFLPct')} className="px-4 py-3.5 cursor-pointer hover:bg-gray-700 transition-colors text-right whitespace-nowrap">
                    Adet Büyüme (LFL) {sortBy === 'SalesQuantityLFLPct' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th onClick={() => handleSort('Cover')} className="px-4 py-3.5 cursor-pointer hover:bg-gray-700 transition-colors text-right whitespace-nowrap">
                    Cover {sortBy === 'Cover' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th onClick={() => handleSort('OnHandQty')} className="px-4 py-3.5 cursor-pointer hover:bg-gray-700 transition-colors text-right whitespace-nowrap">
                    Eldeki Stok {sortBy === 'OnHandQty' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th onClick={() => handleSort('OnWay')} className="px-4 py-3.5 cursor-pointer hover:bg-gray-700 transition-colors text-right whitespace-nowrap">
                    Yolda {sortBy === 'OnWay' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                  <th onClick={() => handleSort('NetFinalOccupancyPct')} className="px-4 py-3.5 cursor-pointer hover:bg-gray-700 transition-colors text-right whitespace-nowrap">
                    Net Doluluk {sortBy === 'NetFinalOccupancyPct' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-gray-700 bg-white font-medium">
                {sortedRows.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="px-6 py-12 text-center text-gray-400 text-sm">
                      Arama kriterlerinize uyan kayıt bulunamadı.
                    </td>
                  </tr>
                ) : (
                  sortedRows.map((row, index) => {
                    const isDeptRow = row.RowType === 'Department';
                    return (
                      <tr 
                        key={index} 
                        className={`hover:bg-blue-50/40 transition-colors ${
                          isDeptRow ? 'bg-purple-50/30 font-bold border-y border-purple-100 text-purple-900' : ''
                        }`}
                      >
                        <td className="px-4 py-3 font-semibold whitespace-nowrap">{row.Department}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getRowTypeBadge(row.RowType)}`}>
                            {row.RowType.toUpperCase()}
                          </span>
                        </td>
                        <td className={`px-4 py-3 whitespace-nowrap ${isDeptRow ? 'font-extrabold text-purple-800' : 'text-gray-900 font-semibold'}`}>
                          {row.Name}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">
                          {formatCurrency(row.SalesAmount)}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">{formatPercent(row.StoreSalesPct)}</td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {row.RegionSalesPct !== undefined ? formatPercent(row.RegionSalesPct) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {row.SalesAmountPct !== undefined ? formatPercent(row.SalesAmountPct) : '-'}
                        </td>
                        <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${
                          row.SalesAmountLFLPct > 0 ? 'text-green-600' : row.SalesAmountLFLPct < 0 ? 'text-red-600' : ''
                        }`}>
                          {row.SalesAmountLFLPct > 0 ? '+' : ''}{row.SalesAmountLFLPct.toFixed(1)}%
                        </td>
                        <td className={`px-4 py-3 text-right whitespace-nowrap ${
                          row.StockQtyLFLPct > 0 ? 'text-green-600' : row.StockQtyLFLPct < 0 ? 'text-red-600' : ''
                        }`}>
                          {row.StockQtyLFLPct > 0 ? '+' : ''}{row.StockQtyLFLPct.toFixed(1)}%
                        </td>
                        <td className={`px-4 py-3 text-right whitespace-nowrap ${
                          row.SalesQuantityLFLPct > 0 ? 'text-green-600' : row.SalesQuantityLFLPct < 0 ? 'text-red-600' : ''
                        }`}>
                          {row.SalesQuantityLFLPct > 0 ? '+' : ''}{row.SalesQuantityLFLPct.toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900 whitespace-nowrap">
                          {row.Cover.toFixed(1)}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {row.OnHandQty !== undefined ? formatNumber(row.OnHandQty) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">{formatNumber(row.OnWay)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">
                          {formatPercent(row.NetFinalOccupancyPct)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-gray-500 font-semibold text-xs flex justify-between items-center">
            <span>Listelenen Satır Sayısı: {sortedRows.length} / {flatRows.length}</span>
            <span>* Yüzde (%) ve Para Birimi (₺) değerleri veritabanındaki ham değerlerdir.</span>
          </div>
        </div>
      )}
    </div>
  );
}
