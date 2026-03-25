import React, { useState, useEffect, useMemo } from 'react';
import { Reorder, useDragControls } from 'motion/react';
import { 
  getDramaRankings, 
  getDistributorData, getHourlyRechargeData, getHourlyActiveUserData, getActiveUserAppDistribution, getChannelData, getRealtimeMetrics,
  getRegionData, getAppData,
  Timezone, Currency, RealtimeMetrics, HourlyActiveUserData 
} from '../utils/mockData';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  Cell, AreaChart, Area, PieChart, Pie
} from 'recharts';
import { 
  Globe, Activity, DollarSign, Users, Smartphone, Film, TrendingUp, Award, Clock, Filter, Info, CreditCard, Map, HelpCircle, X, BookOpen, Link, GripVertical
} from 'lucide-react';

const formatCurrency = (value: number, currency: Currency) => {
  return new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'zh-CN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#f43f5e', '#14b8a6', '#84cc16', '#eab308', '#6366f1', '#d946ef'];

const DashboardSection: React.FC<{ id: string, children: React.ReactNode, className?: string }> = ({ id, children, className }) => {
  const dragControls = useDragControls();
  return (
    <Reorder.Item 
      value={id} 
      dragControls={dragControls} 
      dragListener={false}
      className={className}
    >
      <div className="relative group h-full">
        <div 
          onPointerDown={(e) => dragControls.start(e)}
          className="absolute top-4 right-4 z-20 p-1.5 rounded-md bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm hover:bg-slate-100 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1.5"
          title="拖动调整位置"
        >
          <GripVertical className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">DRAG</span>
        </div>
        {children}
      </div>
    </Reorder.Item>
  );
};

export default function Dashboard() {
  const [timezone, setTimezone] = useState<Timezone>('UTC');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [packageFilter, setPackageFilter] = useState<string>('all');
  
  const [realtimePeriod, setRealtimePeriod] = useState<string>('today');
  const [realtimeData, setRealtimeData] = useState<RealtimeMetrics | null>(null);
  const [dramaTab, setDramaTab] = useState<'trending' | 'new'>('trending');
  const [dramaLanguage, setDramaLanguage] = useState<string>('ALL');
  const [channelDate, setChannelDate] = useState<'today' | 'yesterday'>('today');
  const [appFunnelDate, setAppFunnelDate] = useState<'today' | 'yesterday'>('today');
  const [distributionDate, setDistributionDate] = useState<'today' | 'yesterday'>('today');
  const [channelTypeFilter, setChannelTypeFilter] = useState<'all' | 'self' | 'dist'>('all');
  const [distributorMonth, setDistributorMonth] = useState<string>('2024-03');
  const [leadRankingMonth, setLeadRankingMonth] = useState<string>('2024-03');
  const [rechargeChartType, setRechargeChartType] = useState<'cumulative' | 'hourly'>('cumulative');
  const [isPrdOpen, setIsPrdOpen] = useState(false);
  const [isVisibilityMenuOpen, setIsVisibilityMenuOpen] = useState(false);

  // Section order state for drag and drop
  const [sectionOrder, setSectionOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('dashboard_section_order_v3');
    return saved ? JSON.parse(saved) : [
      'realtime-metrics',
      'charts-row',
      'rankings-row',
      'distributor-ranking',
      'monthly-lead-ranking'
    ];
  });

  const [hiddenSections, setHiddenSections] = useState<string[]>(() => {
    const saved = localStorage.getItem('dashboard_hidden_sections_v3');
    return saved ? JSON.parse(saved) : ['app-funnel'];
  });

  useEffect(() => {
    localStorage.setItem('dashboard_section_order_v3', JSON.stringify(sectionOrder));
  }, [sectionOrder]);

  useEffect(() => {
    localStorage.setItem('dashboard_hidden_sections_v3', JSON.stringify(hiddenSections));
  }, [hiddenSections]);

  const toggleSectionVisibility = (sectionId: string) => {
    if (hiddenSections.includes(sectionId)) {
      // Show section: remove from hidden, add to order
      setHiddenSections(prev => prev.filter(id => id !== sectionId));
      setSectionOrder(prev => {
        if (!prev.includes(sectionId)) {
          // Find original index based on default order to insert it in a reasonable place
          const defaultOrder = Object.keys(sectionNames);
          const newOrder = [...prev];
          const defaultIndex = defaultOrder.indexOf(sectionId);
          
          // Simple insertion: just push to end for now, or you could try to insert at original index
          // For simplicity and reliability, appending to the end is safest
          newOrder.push(sectionId);
          
          // Sort based on default order to maintain logical flow
          return newOrder.sort((a, b) => defaultOrder.indexOf(a) - defaultOrder.indexOf(b));
        }
        return prev;
      });
    } else {
      // Hide section: add to hidden, remove from order
      setHiddenSections(prev => [...prev, sectionId]);
      setSectionOrder(prev => prev.filter(id => id !== sectionId));
    }
  };

  const sectionNames: Record<string, string> = {
    'realtime-metrics': '实时数据',
    'charts-row': '趋势图表',
    'rankings-row': '排行榜',
    'app-funnel': '应用活跃与转化漏斗',
    'distributor-ranking': '渠道充值排行',
    'monthly-lead-ranking': '优化师组长月度排行'
  };

  const dramaData = getDramaRankings(currency, dramaLanguage);
  const rawChannelData = getChannelData(currency, channelDate);
  const monthlyRawChannelData = React.useMemo(() => getChannelData(currency, 'month', leadRankingMonth), [currency, leadRankingMonth]);
  
  const channelData = React.useMemo(() => {
    if (channelTypeFilter === 'all') return rawChannelData;
    return rawChannelData.filter(item => item.type === channelTypeFilter);
  }, [rawChannelData, channelTypeFilter]);

  const monthlyLeadRankings = React.useMemo(() => {
    const leads: Record<string, { 
      name: string, 
      recharge: number, 
      spend: number, 
      roi: number, 
      count: number, 
      department: string,
      promoLinkCount: number,
      optimizerCount: number
    }> = {};
    
    monthlyRawChannelData.forEach(item => {
      if (item.leadName && item.leadName !== '-' && item.type === 'self') {
        if (!leads[item.leadName]) {
          leads[item.leadName] = { 
            name: item.leadName, 
            recharge: 0, 
            spend: 0, 
            roi: 0, 
            count: 0, 
            department: item.department,
            promoLinkCount: 0,
            optimizerCount: 0
          };
        }
        leads[item.leadName].recharge += item.recharge;
        leads[item.leadName].spend += item.spend || 0;
        leads[item.leadName].count += 1;
        leads[item.leadName].promoLinkCount += item.promoLinkCount;
        leads[item.leadName].optimizerCount += item.optimizerCount;
      }
    });

    return Object.values(leads)
      .map(p => ({
        ...p,
        roi: p.spend > 0 ? p.recharge / p.spend : 0
      }))
      .sort((a, b) => b.recharge - a.recharge);
  }, [monthlyRawChannelData]);

  const distributors = getDistributorData(currency, distributorMonth);
  const hourlyData = getHourlyRechargeData(currency);
  const regionData = getRegionData(currency, distributionDate);
  const appData = getAppData(distributionDate);
  const hourlyActiveUserData = getHourlyActiveUserData();
  const activeUserAppDistribution = getActiveUserAppDistribution(appFunnelDate);

  const getComparisonLabel = (period: string) => {
    switch (period) {
      case 'today':
      case 'yesterday':
        return '较前一日';
      case '7days':
        return '较前7日';
      case 'month':
        return '较上月';
      case 'lastMonth':
        return null;
      default:
        return '较前一日';
    }
  };

  const cumulativeHourlyData = React.useMemo(() => {
    let todaySum = 0;
    let yesterdaySum = 0;
    return hourlyData.map(d => {
      todaySum += d.today;
      yesterdaySum += d.yesterday;
      return {
        ...d,
        today: todaySum,
        yesterday: yesterdaySum
      };
    });
  }, [hourlyData]);

  useEffect(() => {
    setRealtimeData(getRealtimeMetrics(timezone, currency, realtimePeriod));
  }, [timezone, currency, clientFilter, packageFilter, realtimePeriod]);

  const renderRealtimeMetrics = () => (
    <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-800">实时大盘数据</h2>
          </div>
          
          <div className="h-6 w-px bg-slate-200 hidden md:block"></div>

          <div className="flex items-center gap-4">
            {/* Client Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">客户端:</span>
              <select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded px-2 py-1 focus:outline-none cursor-pointer hover:border-indigo-300 transition-colors"
              >
                <option value="all">全部</option>
                <option value="ios">iOS端</option>
                <option value="android">安卓端</option>
                <option value="h5">H5</option>
                <option value="miniapp">小程序</option>
              </select>
            </div>

            {/* Package Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">应用:</span>
              <select
                value={packageFilter}
                onChange={(e) => setPackageFilter(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded px-2 py-1 focus:outline-none cursor-pointer hover:border-indigo-300 transition-colors"
              >
                <option value="all">全部</option>
                <option value="yoo">yoo包</option>
                <option value="manseen">manseen包</option>
                <option value="packageA">马甲包A</option>
                <option value="packageB">马甲包B</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex items-center bg-slate-100 p-1 rounded-md border border-slate-200">
          {[
            { value: 'today', label: '实时' },
            { value: 'yesterday', label: '昨日' },
            { value: '7days', label: '7日' },
            { value: 'month', label: '本月' },
            { value: 'lastMonth', label: '上月' }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setRealtimePeriod(option.value)}
              className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${
                realtimePeriod === option.value
                  ? 'bg-white shadow-sm text-indigo-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="p-6 space-y-6">
        {/* 一级指标 (Primary Metrics) */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <div className="w-1 h-3 bg-indigo-600 rounded-full"></div>
            核心指标
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
            {/* 1. 总充值 */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-center col-span-2 sm:col-span-1">
              <div className="text-xs text-slate-500 mb-1 font-medium whitespace-nowrap">总充值</div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <div className="text-lg font-bold font-mono text-slate-800">{formatCurrency(realtimeData.totalRecharge, currency)}</div>
                {getComparisonLabel(realtimePeriod) && (
                  <div className="flex flex-col">
                    <div className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center w-fit">
                      <TrendingUp className="w-3 h-3 mr-0.5" />
                      12.5%
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 whitespace-nowrap transform scale-90 origin-left">
                      {getComparisonLabel(realtimePeriod)}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* 2. 预计实收 */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-center">
              <div className="text-xs text-slate-500 mb-1 font-medium whitespace-nowrap">预计实收</div>
              <div className="text-lg font-bold font-mono text-slate-800">{formatCurrency(realtimeData.netRevenue, currency)}</div>
            </div>
            {/* 3. 活跃人数 */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-center">
              <div className="text-xs text-slate-500 mb-1 font-medium whitespace-nowrap">活跃人数</div>
              <div className="text-lg font-bold font-mono text-slate-800">{realtimeData.activeUsers.toLocaleString()}</div>
            </div>
            {/* 4. 观看人数 */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-center">
              <div className="text-xs text-slate-500 mb-1 font-medium whitespace-nowrap">观看人数</div>
              <div className="text-lg font-bold font-mono text-slate-800">{realtimeData.viewingUsers.toLocaleString()}</div>
            </div>
            {/* 5. 意向人数 */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-center">
              <div className="text-xs text-slate-500 mb-1 font-medium whitespace-nowrap">意向人数 (拉起支付)</div>
              <div className="text-lg font-bold font-mono text-slate-800">{realtimeData.intentUsers.toLocaleString()}</div>
            </div>
            {/* 6. 充值人数 */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-center">
              <div className="text-xs text-slate-500 mb-1 font-medium whitespace-nowrap">充值人数</div>
              <div className="text-lg font-bold font-mono text-slate-800">{realtimeData.rechargeUsers.toLocaleString()}</div>
            </div>
            {/* 7. 客单价 */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-center">
              <div className="text-xs text-slate-500 mb-1 font-medium whitespace-nowrap">客单价</div>
              <div className="text-lg font-bold font-mono text-slate-800">{formatCurrency(realtimeData.arpu, currency)}</div>
            </div>
            {/* 8. 当日新增付费人数 */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-center">
              <div className="text-xs text-slate-500 mb-1 font-medium whitespace-nowrap">当日新增付费人数</div>
              <div className="text-lg font-bold font-mono text-slate-800">{realtimeData.newPayingUsers.toLocaleString()}</div>
            </div>
            {/* 9. 当日新增付费金额 */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-center">
              <div className="text-xs text-slate-500 mb-1 font-medium whitespace-nowrap">当日新增付费金额</div>
              <div className="text-lg font-bold font-mono text-slate-800">{formatCurrency(realtimeData.newPayingAmount, currency)}</div>
            </div>
            {/* 10. 成交转化率 */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-center">
              <div className="text-xs text-slate-500 mb-1 font-medium whitespace-nowrap">成交转化率</div>
              <div className="text-lg font-bold font-mono text-slate-800">{realtimeData.conversionRate.toFixed(2)}%</div>
            </div>
          </div>
        </div>

        {/* 次级指标 (Secondary Metrics) */}
        <div className="pt-5 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <div className="w-1 h-3 bg-slate-400 rounded-full"></div>
            投放指标
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {/* 1. 自投充值金额 */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-center">
              <div className="text-xs text-slate-500 mb-1 font-medium whitespace-nowrap">自投充值金额</div>
              <div className="text-lg font-bold font-mono text-slate-800 truncate">{formatCurrency(realtimeData.selfRecharge, currency)}</div>
            </div>
            {/* 2. 自投消耗 */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-center">
              <div className="text-xs text-slate-500 mb-1 font-medium whitespace-nowrap">自投消耗</div>
              <div className="text-lg font-bold font-mono text-slate-800 truncate">{formatCurrency(realtimeData.selfSpend, currency)}</div>
            </div>
            {/* 3. 自投roi */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-center">
              <div className="text-xs text-slate-500 mb-1 font-medium whitespace-nowrap">自投roi</div>
              <div className="text-lg font-bold font-mono text-slate-800 truncate">{realtimeData.selfRoi.toFixed(2)}</div>
            </div>
            {/* 4. 自投预计实收 */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-center">
              <div className="text-xs text-slate-500 mb-1 font-medium whitespace-nowrap">自投预计实收</div>
              <div className="text-lg font-bold font-mono text-slate-800 truncate">{formatCurrency(realtimeData.selfNetRevenue, currency)}</div>
            </div>
            {/* 5. 分销充值金额 */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-center">
              <div className="text-xs text-slate-500 mb-1 font-medium whitespace-nowrap">分销充值金额</div>
              <div className="text-lg font-bold font-mono text-slate-800 truncate">{formatCurrency(realtimeData.distRecharge, currency)}</div>
            </div>
            {/* 6. 分销预计实收 */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-center">
              <div className="text-xs text-slate-500 mb-1 font-medium whitespace-nowrap">分销预计实收</div>
              <div className="text-lg font-bold font-mono text-slate-800 truncate">{formatCurrency(realtimeData.distNetRevenue, currency)}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const renderDramaRankings = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Film className="w-5 h-5 text-rose-500" />
          <h3 className="font-bold text-slate-800">实时短剧排行</h3>
        </div>
        <div className="flex bg-slate-200/70 p-1 rounded-lg">
          <button 
            onClick={() => setDramaTab('trending')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${dramaTab === 'trending' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            起量剧
          </button>
          <button 
            onClick={() => setDramaTab('new')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${dramaTab === 'new' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            新上架
          </button>
        </div>
      </div>
      {/* Language Filter */}
      <div className="px-5 py-2 border-b border-slate-100 bg-white flex items-center gap-2">
        <span className="text-xs text-slate-500">对应语言:</span>
        <div className="flex gap-1">
          {[
            { code: 'ALL', label: '全部' },
            { code: 'EN', label: '英语' },
            { code: 'ES', label: '西班牙语' },
            { code: 'ID', label: '印尼语' }
          ].map(lang => (
            <button 
              key={lang.code}
              onClick={() => setDramaLanguage(lang.code)}
              className={`px-2 py-0.5 text-[10px] font-medium rounded border ${dramaLanguage === lang.code ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>
      <div className="p-0 flex-1 overflow-auto max-h-[770px] lg:max-h-none">
        <ul className="divide-y divide-slate-100">
          {dramaData[dramaTab].length > 0 ? dramaData[dramaTab].slice(0, 5).map((drama, idx) => (
            <li 
              key={drama.id} 
              className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-3 cursor-pointer group"
              onClick={() => console.log(`Entering drama list for: ${drama.name}`)}
            >
              <div className="relative shrink-0">
                <img 
                  src={drama.cover} 
                  alt={drama.name} 
                  className="w-16 h-20 object-cover rounded shadow-sm border border-slate-100"
                  referrerPolicy="no-referrer"
                />
                <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm ${idx < 3 ? 'bg-rose-500 text-white' : 'bg-slate-400 text-white'}`}>
                  {idx + 1}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="truncate">
                    <div className="font-bold text-slate-900 truncate text-sm group-hover:text-indigo-600 transition-colors">{drama.name}</div>
                    <div className="text-xs text-slate-500 truncate mt-0.5">{drama.chineseName}</div>
                  </div>
                </div>
                
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                  <div className="flex items-center gap-3">
                    <span>ID: <span className="text-slate-600 font-mono">{drama.id}</span></span>
                    <span className="bg-slate-100 px-1 py-0.5 rounded text-slate-500 font-medium">
                      {drama.language === 'EN' ? '英语' : drama.language === 'ES' ? '西班牙语' : drama.language === 'ID' ? '印尼语' : drama.language}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5 items-start shrink-0">
                    <span className="text-slate-600 font-medium">观看: {drama.viewingUsers.toLocaleString()}人</span>
                    <span className="text-slate-600 font-medium">意向: {drama.intentionCount.toLocaleString()}人</span>
                    <span className="text-slate-600 font-medium">支付: {drama.payingUsers.toLocaleString()}人</span>
                  </div>
                </div>

                {/* Recovery Metrics */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[10px]">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500 font-medium">自投(消耗/ROI):</span>
                    <span className="font-mono font-bold text-amber-600">{formatCurrency(drama.selfSpend, currency)}</span>
                    <span className="text-slate-300">/</span>
                    <span className={`font-mono font-bold ${drama.selfRoi >= 1.2 ? 'text-emerald-600' : 'text-slate-600'}`}>
                      {drama.selfRoi.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500 font-medium">充值(自投/分销):</span>
                    <span className="font-mono font-bold text-indigo-600">{formatCurrency(drama.selfRecharge, currency)}</span>
                    <span className="text-slate-300">/</span>
                    <span className="font-mono font-bold text-emerald-600">{formatCurrency(drama.distRecharge, currency)}</span>
                  </div>
                </div>
              </div>
            </li>
          )) : (
            <li className="p-8 text-center text-sm text-slate-500">暂无该语言数据</li>
          )}
        </ul>
      </div>
    </div>
  );

  const renderHourlyTrend = () => (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" />
          <h3 className="font-semibold text-slate-800">充值分布图</h3>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200">
          <button 
            onClick={() => setRechargeChartType('cumulative')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${rechargeChartType === 'cumulative' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-600 hover:text-slate-900'}`}
          >
            累计趋势
          </button>
          <button 
            onClick={() => setRechargeChartType('hourly')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${rechargeChartType === 'hourly' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-600 hover:text-slate-900'}`}
          >
            时段趋势
          </button>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rechargeChartType === 'cumulative' ? cumulativeHourlyData : hourlyData} margin={{ top: 10, right: 20, bottom: 0, left: -10 }}>
            <defs>
              <linearGradient id="colorToday" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorYesterday" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#eab308" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} interval={2} />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={(val) => currency === 'USD' ? `${val/1000}k` : `¥${val/1000}k`}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              formatter={(value: number, name: string) => [
                formatCurrency(value, currency), 
                name === 'today' ? '今日' : '昨日'
              ]}
            />
            <Legend 
              verticalAlign="top" 
              height={36} 
              iconType="plainline"
              formatter={(value) => <span className="text-xs text-slate-600 font-medium">{value === 'today' ? '今日' : '昨日'}</span>}
            />
            <Area type="monotone" dataKey="yesterday" name="yesterday" stroke="#eab308" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorYesterday)" />
            <Area type="monotone" dataKey="today" name="today" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorToday)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderDistributionAnalysis = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-500" />
          <h3 className="font-bold text-slate-800">分布分析</h3>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setDistributionDate('today')}
            className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all ${distributionDate === 'today' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            今日
          </button>
          <button
            onClick={() => setDistributionDate('yesterday')}
            className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all ${distributionDate === 'yesterday' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            昨日
          </button>
        </div>
      </div>
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Registration Country Distribution */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Map className="w-4 h-4 text-slate-500" />
            <h4 className="text-sm font-semibold text-slate-700">注册国家充值分布</h4>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={regionData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  width={80}
                  tickFormatter={(value) => {
                    const item = regionData.find(d => d.name === value);
                    return item ? `${item.name} ${item.label}` : value;
                  }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelFormatter={(value) => {
                    const item = regionData.find(d => d.name === value);
                    return item ? `${item.name} - ${item.label}` : value;
                  }}
                  formatter={(value: number) => [formatCurrency(value, currency), '充值金额']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                  {regionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Method Distribution */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <CreditCard className="w-4 h-4 text-slate-500" />
            <h4 className="text-sm font-semibold text-slate-700">支付方式分布</h4>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={appData.payments}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="name"
                >
                  {appData.payments.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`${value}%`, '占比']}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                  formatter={(value) => <span className="text-[10px] text-slate-600 font-medium">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAppFunnel = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-indigo-500" />
          <h3 className="font-bold text-slate-800">应用活跃与转化漏斗</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setAppFunnelDate('today')}
              className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all ${appFunnelDate === 'today' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              今日
            </button>
            <button
              onClick={() => setAppFunnelDate('yesterday')}
              className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all ${appFunnelDate === 'yesterday' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              昨日
            </button>
          </div>
          <div className="text-[10px] text-slate-400 font-medium">按活跃人数排行</div>
        </div>
      </div>
      <div className="overflow-auto max-h-[670px]">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/50 text-slate-500 font-medium text-[11px] uppercase tracking-wider border-b border-slate-100">
            <tr>
              <th className="px-6 py-3">应用名称</th>
              <th className="px-6 py-3">活跃用户 (DAU)</th>
              <th className="px-6 py-3">观看人数 (Viewing)</th>
              <th className="px-6 py-3">意向转化 (拉起)</th>
              <th className="px-6 py-3">充值转化 (成功)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {activeUserAppDistribution.map((app) => {
              const viewingRate = ((app.viewingUsers / app.activeUsers) * 100).toFixed(1);
              const intentRate = ((app.intentUsers / app.viewingUsers) * 100).toFixed(1);
              const rechargeRate = ((app.rechargeUsers / app.intentUsers) * 100).toFixed(1);
              
              return (
                <tr key={app.name} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{app.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-slate-800">{app.activeUsers.toLocaleString()}</span>
                      </div>
                      <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full" 
                          style={{ width: `${(app.activeUsers / activeUserAppDistribution[0].activeUsers) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-indigo-400">{app.viewingUsers.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{viewingRate}%</span>
                      </div>
                      <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-300 rounded-full" 
                          style={{ width: `${viewingRate}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-amber-600">{app.intentUsers.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{intentRate}%</span>
                      </div>
                      <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-400 rounded-full" 
                          style={{ width: `${intentRate}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-emerald-600">{app.rechargeUsers.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{rechargeRate}%</span>
                      </div>
                      <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full" 
                          style={{ width: `${rechargeRate}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderChannelRanking = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-50/50 gap-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-500" />
          <h3 className="font-bold text-slate-800">渠道充值排行</h3>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {[
              { value: 'all', label: '全部' },
              { value: 'self', label: '自投' },
              { value: 'dist', label: '分销' }
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setChannelTypeFilter(opt.value as any)}
                className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all ${channelTypeFilter === opt.value ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setChannelDate('today')}
              className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all ${channelDate === 'today' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              今日
            </button>
            <button
              onClick={() => setChannelDate('yesterday')}
              className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all ${channelDate === 'yesterday' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              昨日
            </button>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
            <tr>
              <th className="px-4 py-3 whitespace-nowrap">渠道ID</th>
              <th className="px-4 py-3 whitespace-nowrap">优化师信息</th>
              <th className="px-4 py-3 whitespace-nowrap">平台</th>
              <th className="px-4 py-3 whitespace-nowrap">类型</th>
              <th className="px-4 py-3 whitespace-nowrap">剧名/ID/语言</th>
              <th className="px-4 py-3 whitespace-nowrap text-right">充值金额/人数</th>
              <th className="px-4 py-3 whitespace-nowrap text-right">消耗</th>
              <th className="px-4 py-3 whitespace-nowrap text-right">预计实收</th>
              <th className="px-4 py-3 whitespace-nowrap text-right">ROI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {channelData.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.id}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-slate-800 text-sm">{item.name}</span>
                    <span className="text-[10px] font-medium text-slate-600">组长: {item.leadName}</span>
                    <span className="text-[10px] text-slate-400">{item.department}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${item.platform === 'fb' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                    {item.platform}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {item.type === 'self' ? (
                    <span className="inline-flex items-center px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold border border-indigo-100 uppercase tracking-wider">自投</span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[10px] font-bold border border-emerald-100 uppercase tracking-wider">分销</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-slate-700 truncate max-w-[120px]" title={item.dramaName}>{item.dramaName}</span>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <span>ID: {item.dramaId}</span>
                      <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                      <span>{item.language}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex flex-col items-end">
                    <span className="font-mono text-blue-600 font-medium">{formatCurrency(item.recharge, currency)}</span>
                    <span className="text-[10px] text-slate-400">{item.rechargeUsers.toLocaleString()}人</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-mono text-amber-600">{item.spend ? formatCurrency(item.spend, currency) : '-'}</td>
                <td className="px-4 py-3 text-right font-mono text-teal-600 font-semibold">{formatCurrency(item.netRevenue, currency)}</td>
                <td className="px-4 py-3 text-right font-mono">
                  {item.roi ? (
                    <span className={`px-2 py-1 rounded text-xs font-bold ${item.roi >= 1.3 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                      {item.roi.toFixed(2)}
                    </span>
                  ) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDistributorRanking = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold text-slate-800">月度分销排行</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">选择月份:</span>
          <select
            value={distributorMonth}
            onChange={(e) => setDistributorMonth(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded px-2 py-1 focus:outline-none cursor-pointer hover:border-indigo-300 transition-colors"
          >
            <option value="2024-03">2024年03月</option>
            <option value="2024-02">2024年02月</option>
            <option value="2024-01">2024年01月</option>
            <option value="2023-12">2023年12月</option>
          </select>
        </div>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {distributors.map((dist, idx) => (
            <div key={dist.name} className="border border-slate-100 rounded-lg p-4 bg-gradient-to-br from-white to-slate-50 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                TOP {idx + 1}
              </div>
              <div className="text-sm font-semibold text-slate-800 mb-3 pr-8 truncate" title={dist.name}>{dist.name}</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">充值</div>
                  <div className="font-mono font-bold text-blue-600">{formatCurrency(dist.recharge, currency)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">新增推广链</div>
                  <div className="flex items-center gap-1">
                    <Link className="w-3 h-3 text-slate-400" />
                    <span className="font-mono font-bold text-slate-700">{dist.newPromoLinks}</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">预计实收</div>
                  <div className="font-mono font-bold text-teal-600">{formatCurrency(dist.netRevenue, currency)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMonthlyLeadRanking = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-50/50 gap-4">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-500" />
          <h3 className="font-bold text-slate-800">优化师组长月度排行</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">选择月份:</span>
            <select
              value={leadRankingMonth}
              onChange={(e) => setLeadRankingMonth(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded px-2 py-1 focus:outline-none cursor-pointer hover:border-indigo-300 transition-colors"
            >
              <option value="2024-03">2024年03月</option>
              <option value="2024-02">2024年02月</option>
              <option value="2024-01">2024年01月</option>
              <option value="2023-12">2023年12月</option>
            </select>
          </div>
          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold border border-indigo-100 uppercase tracking-wider">自投数据</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
            <tr>
              <th className="px-4 py-3 whitespace-nowrap">排名</th>
              <th className="px-4 py-3 whitespace-nowrap">组长姓名</th>
              <th className="px-4 py-3 whitespace-nowrap">部门</th>
              <th className="px-4 py-3 whitespace-nowrap text-right">充值金额</th>
              <th className="px-4 py-3 whitespace-nowrap text-right">消耗</th>
              <th className="px-4 py-3 whitespace-nowrap text-right text-indigo-600">推广链数量</th>
              <th className="px-4 py-3 whitespace-nowrap text-right text-indigo-600">投手数量</th>
              <th className="px-4 py-3 whitespace-nowrap text-right">ROI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {monthlyLeadRankings.map((lead, idx) => (
              <tr key={lead.name} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    idx === 0 ? 'bg-amber-100 text-amber-700' : 
                    idx === 1 ? 'bg-slate-200 text-slate-700' : 
                    idx === 2 ? 'bg-orange-100 text-orange-700' : 
                    'bg-slate-50 text-slate-400'
                  }`}>
                    {idx + 1}
                  </div>
                </td>
                <td className="px-4 py-3 font-bold text-slate-800">{lead.name}</td>
                <td className="px-4 py-3 text-slate-500">{lead.department}</td>
                <td className="px-4 py-3 text-right font-mono text-blue-600 font-medium">{formatCurrency(lead.recharge, currency)}</td>
                <td className="px-4 py-3 text-right font-mono text-amber-600">{formatCurrency(lead.spend, currency)}</td>
                <td className="px-4 py-3 text-right font-mono font-bold text-indigo-600">{lead.promoLinkCount}</td>
                <td className="px-4 py-3 text-right font-mono font-bold text-indigo-600">{lead.optimizerCount}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${lead.roi >= 1.3 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                    {lead.roi.toFixed(2)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  
  const renderSection = (id: string) => {
    switch (id) {
      case 'realtime-metrics':
        return (
          <>
            {/* Section 1: Realtime Data (实时数据) */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-800">实时大盘数据</h2>
              </div>
              
              <div className="h-6 w-px bg-slate-200 hidden md:block"></div>

              <div className="flex items-center gap-4">
                {/* Client Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">客户端:</span>
                  <select
                    value={clientFilter}
                    onChange={(e) => setClientFilter(e.target.value)}
                    className="bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded px-2 py-1 focus:outline-none cursor-pointer hover:border-indigo-300 transition-colors"
                  >
                    <option value="all">全部</option>
                    <option value="ios">iOS端</option>
                    <option value="android">安卓端</option>
                    <option value="h5">H5</option>
                    <option value="miniapp">小程序</option>
                  </select>
                </div>

                {/* Package Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">应用:</span>
                  <select
                    value={packageFilter}
                    onChange={(e) => setPackageFilter(e.target.value)}
                    className="bg-white border border-slate-200 text-slate-700 text-xs font-medium rounded px-2 py-1 focus:outline-none cursor-pointer hover:border-indigo-300 transition-colors"
                  >
                    <option value="all">全部</option>
                    <option value="yoo">yoo包</option>
                    <option value="manseen">manseen包</option>
                    <option value="packageA">马甲包A</option>
                    <option value="packageB">马甲包B</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center bg-slate-100 p-1 rounded-md border border-slate-200">
              {[
                { value: 'today', label: '实时' },
                { value: 'yesterday', label: '昨日' },
                { value: '7days', label: '7日' },
                { value: 'month', label: '本月' },
                { value: 'lastMonth', label: '上月' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setRealtimePeriod(option.value)}
                  className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${
                    realtimePeriod === option.value
                      ? 'bg-white shadow-sm text-indigo-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="p-6 space-y-6">
            {/* 一级指标 (Primary Metrics) */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <div className="w-1 h-3 bg-indigo-600 rounded-full"></div>
                核心指标
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                {/* 1. 总充值 */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-center col-span-2 sm:col-span-1">
                  <div className="text-xs text-slate-500 mb-1 font-medium whitespace-nowrap">总充值</div>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <div className="text-lg font-bold font-mono text-slate-800">{formatCurrency(realtimeData.totalRecharge, currency)}</div>
                    {getComparisonLabel(realtimePeriod) && (
                      <div className="flex flex-col">
                        <div className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center w-fit">
                          <TrendingUp className="w-3 h-3 mr-0.5" />
                          12.5%
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 whitespace-nowrap transform scale-90 origin-left">
                          {getComparisonLabel(realtimePeriod)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {/* 2. 预计实收 */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-center">
                  <div className="text-xs text-slate-500 mb-1 font-medium whitespace-nowrap">预计实收</div>
                  <div className="text-lg font-bold font-mono text-slate-800">{formatCurrency(realtimeData.netRevenue, currency)}</div>
                </div>
                {/* 3. 活跃人数 */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-center">
                  <div className="text-xs text-slate-500 mb-1 font-medium whitespace-nowrap">活跃人数</div>
                  <div className="text-lg font-bold font-mono text-slate-800">{realtimeData.activeUsers.toLocaleString()}</div>
                </div>
                {/* 4. 观看人数 */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-center">
                  <div className="text-xs text-slate-500 mb-1 font-medium whitespace-nowrap">观看人数</div>
                  <div className="text-lg font-bold font-mono text-slate-800">{realtimeData.viewingUsers.toLocaleString()}</div>
                </div>
                {/* 5. 意向人数 */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-center">
                  <div className="text-xs text-slate-500 mb-1 font-medium whitespace-nowrap">意向人数 (拉起支付)</div>
                  <div className="text-lg font-bold font-mono text-slate-800">{realtimeData.intentUsers.toLocaleString()}</div>
                </div>
                {/* 6. 充值人数 */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-center">
                  <div className="text-xs text-slate-500 mb-1 font-medium whitespace-nowrap">充值人数</div>
                  <div className="text-lg font-bold font-mono text-slate-800">{realtimeData.rechargeUsers.toLocaleString()}</div>
                </div>
                {/* 7. 客单价 */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-center">
                  <div className="text-xs text-slate-500 mb-1 font-medium whitespace-nowrap">客单价</div>
                  <div className="text-lg font-bold font-mono text-slate-800">{formatCurrency(realtimeData.arpu, currency)}</div>
                </div>
                {/* 8. 当日新增付费人数 */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-center">
                  <div className="text-xs text-slate-500 mb-1 font-medium whitespace-nowrap">当日新增付费人数</div>
                  <div className="text-lg font-bold font-mono text-slate-800">{realtimeData.newPayingUsers.toLocaleString()}</div>
                </div>
                {/* 9. 当日新增付费金额 */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-center">
                  <div className="text-xs text-slate-500 mb-1 font-medium whitespace-nowrap">当日新增付费金额</div>
                  <div className="text-lg font-bold font-mono text-slate-800">{formatCurrency(realtimeData.newPayingAmount, currency)}</div>
                </div>
                {/* 10. 成交转化率 */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-center">
                  <div className="text-xs text-slate-500 mb-1 font-medium whitespace-nowrap">成交转化率</div>
                  <div className="text-lg font-bold font-mono text-slate-800">{realtimeData.conversionRate.toFixed(2)}%</div>
                </div>
              </div>
            </div>

            {/* 次级指标 (Secondary Metrics) */}
            <div className="pt-5 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <div className="w-1 h-3 bg-slate-400 rounded-full"></div>
                投放指标
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                {/* 1. 自投充值金额 */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-center">
                  <div className="text-xs text-slate-500 mb-1 font-medium whitespace-nowrap">自投充值金额</div>
                  <div className="text-lg font-bold font-mono text-slate-800 truncate">{formatCurrency(realtimeData.selfRecharge, currency)}</div>
                </div>
                {/* 2. 自投消耗 */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-center">
                  <div className="text-xs text-slate-500 mb-1 font-medium whitespace-nowrap">自投消耗</div>
                  <div className="text-lg font-bold font-mono text-slate-800 truncate">{formatCurrency(realtimeData.selfSpend, currency)}</div>
                </div>
                {/* 3. 自投roi */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-center">
                  <div className="text-xs text-slate-500 mb-1 font-medium whitespace-nowrap">自投roi</div>
                  <div className="text-lg font-bold font-mono text-slate-800 truncate">{realtimeData.selfRoi.toFixed(2)}</div>
                </div>
                {/* 4. 自投预计实收 */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-center">
                  <div className="text-xs text-slate-500 mb-1 font-medium whitespace-nowrap">自投预计实收</div>
                  <div className="text-lg font-bold font-mono text-slate-800 truncate">{formatCurrency(realtimeData.selfNetRevenue, currency)}</div>
                </div>
                {/* 5. 分销充值金额 */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-center">
                  <div className="text-xs text-slate-500 mb-1 font-medium whitespace-nowrap">分销充值金额</div>
                  <div className="text-lg font-bold font-mono text-slate-800 truncate">{formatCurrency(realtimeData.distRecharge, currency)}</div>
                </div>
                {/* 6. 分销预计实收 */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-center">
                  <div className="text-xs text-slate-500 mb-1 font-medium whitespace-nowrap">分销预计实收</div>
                  <div className="text-lg font-bold font-mono text-slate-800 truncate">{formatCurrency(realtimeData.distNetRevenue, currency)}</div>
                </div>
              </div>
            </div>
          </div>
        </section>
          </>
        );
      case 'charts-row':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hourly Recharge Trend (充值分布图) */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <h3 className="font-semibold text-slate-800">充值分布图</h3>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200">
                  <button 
                    onClick={() => setRechargeChartType('cumulative')}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${rechargeChartType === 'cumulative' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    累计趋势
                  </button>
                  <button 
                    onClick={() => setRechargeChartType('hourly')}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${rechargeChartType === 'hourly' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    时段趋势
                  </button>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={rechargeChartType === 'cumulative' ? cumulativeHourlyData : hourlyData} margin={{ top: 10, right: 20, bottom: 0, left: -10 }}>
                    <defs>
                      <linearGradient id="colorToday" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorYesterday" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#eab308" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} interval={2} />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickFormatter={(val) => currency === 'USD' ? `$${val/1000}k` : `¥${val/1000}k`}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number, name: string) => [
                        formatCurrency(value, currency), 
                        name === 'today' ? '今日' : '昨日'
                      ]}
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={36} 
                      iconType="plainline"
                      formatter={(value) => <span className="text-xs text-slate-600 font-medium">{value === 'today' ? '今日' : '昨日'}</span>}
                    />
                    <Area type="monotone" dataKey="yesterday" name="yesterday" stroke="#eab308" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorYesterday)" />
                    <Area type="monotone" dataKey="today" name="today" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorToday)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Distribution Analysis (分布分析) */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-bold text-slate-800">分布分析</h3>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <button
                    onClick={() => setDistributionDate('today')}
                    className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all ${distributionDate === 'today' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    今日
                  </button>
                  <button
                    onClick={() => setDistributionDate('yesterday')}
                    className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all ${distributionDate === 'yesterday' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    昨日
                  </button>
                </div>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Registration Country Distribution */}
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <Map className="w-4 h-4 text-slate-500" />
                    <h4 className="text-sm font-semibold text-slate-700">注册国家充值分布</h4>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={regionData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                        <XAxis type="number" hide />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fill: '#64748b' }}
                          width={80}
                          tickFormatter={(value) => {
                            const item = regionData.find(d => d.name === value);
                            return item ? `${item.name} ${item.label}` : value;
                          }}
                        />
                        <Tooltip 
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          labelFormatter={(value) => {
                            const item = regionData.find(d => d.name === value);
                            return item ? `${item.name} - ${item.label}` : value;
                          }}
                          formatter={(value: number) => [formatCurrency(value, currency), '充值金额']}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                          {regionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Payment Method Distribution */}
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <CreditCard className="w-4 h-4 text-slate-500" />
                    <h4 className="text-sm font-semibold text-slate-700">支付方式分布</h4>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={appData.payments}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          nameKey="name"
                        >
                          {appData.payments.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          formatter={(value: number) => [`${value}%`, '占比']}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          iconType="circle"
                          formatter={(value) => <span className="text-[10px] text-slate-600 font-medium">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'rankings-row':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 flex flex-col h-full">
              {/* Short Drama Rankings */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Film className="w-5 h-5 text-rose-500" />
                  <h3 className="font-bold text-slate-800">实时短剧排行</h3>
                </div>
                <div className="flex bg-slate-200/70 p-1 rounded-lg">
                  <button 
                    onClick={() => setDramaTab('trending')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${dramaTab === 'trending' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    起量剧
                  </button>
                  <button 
                    onClick={() => setDramaTab('new')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${dramaTab === 'new' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    新上架
                  </button>
                </div>
              </div>
              {/* Language Filter */}
              <div className="px-5 py-2 border-b border-slate-100 bg-white flex items-center gap-2">
                <span className="text-xs text-slate-500">对应语言:</span>
                <div className="flex gap-1">
                  {[
                    { code: 'ALL', label: '全部' },
                    { code: 'EN', label: '英语' },
                    { code: 'ES', label: '西班牙语' },
                    { code: 'ID', label: '印尼语' }
                  ].map(lang => (
                    <button 
                      key={lang.code}
                      onClick={() => setDramaLanguage(lang.code)}
                      className={`px-2 py-0.5 text-[10px] font-medium rounded border ${dramaLanguage === lang.code ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-0 flex-1 overflow-auto max-h-[770px] lg:max-h-none">
                <ul className="divide-y divide-slate-100">
                  {dramaData[dramaTab].length > 0 ? dramaData[dramaTab].slice(0, 5).map((drama, idx) => (
                    <li 
                      key={drama.id} 
                      className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-3 cursor-pointer group"
                      onClick={() => console.log(`Entering drama list for: ${drama.name}`)}
                    >
                      <div className="relative shrink-0">
                        <img 
                          src={drama.cover} 
                          alt={drama.name} 
                          className="w-16 h-20 object-cover rounded shadow-sm border border-slate-100"
                          referrerPolicy="no-referrer"
                        />
                        <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm ${idx < 3 ? 'bg-rose-500 text-white' : 'bg-slate-400 text-white'}`}>
                          {idx + 1}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="truncate">
                            <div className="font-bold text-slate-900 truncate text-sm group-hover:text-indigo-600 transition-colors">{drama.name}</div>
                            <div className="text-xs text-slate-500 truncate mt-0.5">{drama.chineseName}</div>
                          </div>
                        </div>
                        
                        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                          <div className="flex items-center gap-3">
                            <span>ID: <span className="text-slate-600 font-mono">{drama.id}</span></span>
                            <span className="bg-slate-100 px-1 py-0.5 rounded text-slate-500 font-medium">
                              {drama.language === 'EN' ? '英语' : drama.language === 'ES' ? '西班牙语' : drama.language === 'ID' ? '印尼语' : drama.language}
                            </span>
                          </div>
                          <div className="flex flex-col gap-0.5 items-start shrink-0">
                            <span className="text-slate-600 font-medium">观看: {drama.viewingUsers.toLocaleString()}人</span>
                            <span className="text-slate-600 font-medium">意向: {drama.intentionCount.toLocaleString()}人</span>
                            <span className="text-slate-600 font-medium">支付: {drama.payingUsers.toLocaleString()}人</span>
                          </div>
                        </div>

                        {/* Recovery Metrics */}
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[10px]">
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500 font-medium">自投(消耗/ROI):</span>
                            <span className="font-mono font-bold text-amber-600">{formatCurrency(drama.selfSpend, currency)}</span>
                            <span className="text-slate-300">/</span>
                            <span className={`font-mono font-bold ${drama.selfRoi >= 1.2 ? 'text-emerald-600' : 'text-slate-600'}`}>
                              {drama.selfRoi.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500 font-medium">充值(自投/分销):</span>
                            <span className="font-mono font-bold text-indigo-600">{formatCurrency(drama.selfRecharge, currency)}</span>
                            <span className="text-slate-300">/</span>
                            <span className="font-mono font-bold text-emerald-600">{formatCurrency(drama.distRecharge, currency)}</span>
                          </div>
                        </div>
                      </div>
                    </li>
                  )) : (
                    <li className="p-8 text-center text-sm text-slate-500">暂无该语言数据</li>
                  )}
                </ul>
              </div>
            </div>
            </div>
            <div className="lg:col-span-8 flex flex-col h-full">
              {/* Channel Rankings Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
          <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-50/50 gap-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-500" />
              <h3 className="font-bold text-slate-800">渠道充值排行</h3>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Type Filter */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                {[
                  { value: 'all', label: '全部' },
                  { value: 'self', label: '自投' },
                  { value: 'dist', label: '分销' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setChannelTypeFilter(opt.value as any)}
                    className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all ${channelTypeFilter === opt.value ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Date Filter */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  onClick={() => setChannelDate('today')}
                  className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all ${channelDate === 'today' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  今日
                </button>
                <button
                  onClick={() => setChannelDate('yesterday')}
                  className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all ${channelDate === 'yesterday' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  昨日
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">渠道ID</th>
                  <th className="px-4 py-3 whitespace-nowrap">优化师信息</th>
                  <th className="px-4 py-3 whitespace-nowrap">平台</th>
                  <th className="px-4 py-3 whitespace-nowrap">类型</th>
                  <th className="px-4 py-3 whitespace-nowrap">剧名/ID/语言</th>
                  <th className="px-4 py-3 whitespace-nowrap text-right">充值金额/人数</th>
                  <th className="px-4 py-3 whitespace-nowrap text-right">消耗</th>
                  <th className="px-4 py-3 whitespace-nowrap text-right">预计实收</th>
                  <th className="px-4 py-3 whitespace-nowrap text-right">ROI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {channelData.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-slate-800 text-sm">{item.name}</span>
                        <span className="text-[10px] font-medium text-slate-600">组长: {item.leadName}</span>
                        <span className="text-[10px] text-slate-400">{item.department}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${item.platform === 'fb' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                        {item.platform}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {item.type === 'self' ? (
                        <span className="inline-flex items-center px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold border border-indigo-100 uppercase tracking-wider">自投</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[10px] font-bold border border-emerald-100 uppercase tracking-wider">分销</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-slate-700 truncate max-w-[120px]" title={item.dramaName}>{item.dramaName}</span>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                          <span>ID: {item.dramaId}</span>
                          <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                          <span>{item.language}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-mono text-blue-600 font-medium">{formatCurrency(item.recharge, currency)}</span>
                        <span className="text-[10px] text-slate-400">{item.rechargeUsers.toLocaleString()}人</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-amber-600">{item.spend ? formatCurrency(item.spend, currency) : '-'}</td>
                    <td className="px-4 py-3 text-right font-mono text-teal-600 font-semibold">{formatCurrency(item.netRevenue, currency)}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      {item.roi ? (
                        <span className={`px-2 py-1 rounded text-xs font-bold ${item.roi >= 1.3 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                          {item.roi.toFixed(2)}
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
            </div>
          </div>
        );
      case 'app-funnel':
        return (
          <>
            {/* Active User & Conversion Funnel List (New Row) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-slate-800">应用活跃与转化漏斗</h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  onClick={() => setAppFunnelDate('today')}
                  className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all ${appFunnelDate === 'today' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  今日
                </button>
                <button
                  onClick={() => setAppFunnelDate('yesterday')}
                  className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all ${appFunnelDate === 'yesterday' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  昨日
                </button>
              </div>
              <div className="text-[10px] text-slate-400 font-medium">按活跃人数排行</div>
            </div>
          </div>
          <div className="overflow-auto max-h-[670px]">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 text-slate-500 font-medium text-[11px] uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">应用名称</th>
                  <th className="px-6 py-3">活跃用户 (DAU)</th>
                  <th className="px-6 py-3">观看人数 (Viewing)</th>
                  <th className="px-6 py-3">意向转化 (拉起)</th>
                  <th className="px-6 py-3">充值转化 (成功)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {activeUserAppDistribution.map((app) => {
                  const viewingRate = ((app.viewingUsers / app.activeUsers) * 100).toFixed(1);
                  const intentRate = ((app.intentUsers / app.viewingUsers) * 100).toFixed(1);
                  const rechargeRate = ((app.rechargeUsers / app.intentUsers) * 100).toFixed(1);
                  
                  return (
                    <tr key={app.name} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{app.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono font-bold text-slate-800">{app.activeUsers.toLocaleString()}</span>
                          </div>
                          <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500 rounded-full" 
                              style={{ width: `${(app.activeUsers / activeUserAppDistribution[0].activeUsers) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono font-bold text-indigo-400">{app.viewingUsers.toLocaleString()}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{viewingRate}%</span>
                          </div>
                          <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-300 rounded-full" 
                              style={{ width: `${viewingRate}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono font-bold text-amber-600">{app.intentUsers.toLocaleString()}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{intentRate}%</span>
                          </div>
                          <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-amber-400 rounded-full" 
                              style={{ width: `${intentRate}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono font-bold text-emerald-600">{app.rechargeUsers.toLocaleString()}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{rechargeRate}%</span>
                          </div>
                          <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full" 
                              style={{ width: `${rechargeRate}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
          </>
        );
      case 'distributor-ranking':
        return renderDistributorRanking();
      case 'monthly-lead-ranking':
        return renderMonthlyLeadRanking();
      default:
        return null;
    }
  };

  if (!realtimeData) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-inner">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">出海短剧运营大盘</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm border border-indigo-200">
              AD
            </div>
          </div>
        </div>
      </header>

      {/* Global Filter Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-20 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6 shrink-0">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <Filter className="w-4 h-4" />
              <span>全局筛选:</span>
            </div>
            
            {/* Currency Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">币种:</span>
              <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200">
                <button 
                  onClick={() => setCurrency('USD')}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${currency === 'USD' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  USD ($)
                </button>
                <button 
                  onClick={() => setCurrency('CNY')}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${currency === 'CNY' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  CNY (¥)
                </button>
              </div>
            </div>

            {/* Timezone Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">时区:</span>
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200 transition-colors hover:bg-slate-200">
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value as Timezone)}
                  className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer text-slate-700"
                >
                  <option value="UTC">UTC (UTC+0)</option>
                  <option value="Asia/Shanghai">Beijing (UTC+8)</option>
                </select>
              </div>
            </div>

            <div className="h-8 w-px bg-slate-200 mx-2"></div>

            {/* Section Visibility Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsVisibilityMenuOpen(!isVisibilityMenuOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border transition-colors ${isVisibilityMenuOpen ? 'bg-slate-50 border-slate-300 text-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
              >
                <Filter className="w-4 h-4" />
                <span className="text-xs font-bold">模块显示</span>
              </button>
              
              {isVisibilityMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setIsVisibilityMenuOpen(false)}
                  />
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
                    {Object.entries(sectionNames).map(([id, name]) => (
                      <label key={id} className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={!hiddenSections.includes(id)}
                          onChange={() => toggleSectionVisibility(id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-slate-700">{name}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* PRD Button */}
            <button 
              onClick={() => setIsPrdOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-md border border-indigo-100 hover:bg-indigo-100 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="text-xs font-bold">数据说明 (PRD)</span>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Reorder.Group 
          axis="y" 
          values={sectionOrder} 
          onReorder={setSectionOrder} 
          className="space-y-6"
        >
          {sectionOrder.map((sectionId) => (
            <DashboardSection key={sectionId} id={sectionId}>
              {renderSection(sectionId)}
            </DashboardSection>
          ))}
        </Reorder.Group>
      </main>

      {/* PRD Documentation Modal */}
      {isPrdOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">数据字段说明文档 (PRD)</h3>
                  <p className="text-xs text-slate-500">详细说明每一个数据的内容和获取公式</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPrdOpen(false)} 
                className="p-2 hover:bg-slate-200 rounded-full transition-colors group"
              >
                <X className="w-6 h-6 text-slate-400 group-hover:text-slate-600" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-12">
              {/* Section: Global Description */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-6 bg-slate-800 rounded-full"></div>
                  <h4 className="text-base font-bold text-slate-800 uppercase tracking-wide">全局说明 (Global Description)</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="font-bold text-slate-700 text-sm mb-1">币种统计</div>
                    <div className="text-xs text-slate-500 leading-relaxed">
                      系统默认以 <span className="text-indigo-600 font-semibold">USD (美金)</span> 为基础币种进行统计。支持通过顶部切换开关实时按汇率转换为 <span className="text-indigo-600 font-semibold">CNY (人民币)</span> 展示。
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="font-bold text-slate-700 text-sm mb-1">时区筛选</div>
                    <div className="text-xs text-slate-500 leading-relaxed">
                      支持 <span className="text-indigo-600 font-semibold">UTC+0 (默认)</span> 和 <span className="text-indigo-600 font-semibold">UTC+8 (北京时间)</span> 切换。所有时间维度（如小时充值、当日新增）均会随之重算。
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Real-time Dashboard */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                  <h4 className="text-base font-bold text-slate-800 uppercase tracking-wide">实时大盘数据 (Real-time Dashboard)</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="font-bold text-slate-700 text-sm mb-1">客户端筛选</div>
                    <div className="text-xs text-slate-500">支持 iOS, Android, Web 等不同终端的数据隔离查看，用于分析不同平台的表现。</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="font-bold text-slate-700 text-sm mb-1">应用筛选</div>
                    <div className="text-xs text-slate-500">支持按具体应用包名（Package Name）进行数据过滤，查看单一应用的运营情况。</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="font-bold text-slate-700 text-sm mb-1">筛选日期说明</div>
                    <div className="text-xs text-slate-500">“今日”指当前选定时区下的 00:00 至今；“昨日”指完整的前一自然日。</div>
                  </div>
                </div>
              </div>

              {/* Section: Core Metrics */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                  <h4 className="text-base font-bold text-slate-800 uppercase tracking-wide">核心指标 (Core Metrics)</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: '总充值 (Total Recharge)', desc: '统计周期内，所有渠道产生的充值流水总额。', formula: 'Σ(各渠道充值金额)' },
                    { name: '预计实收 (Net Revenue)', desc: '扣除国税（如适用）和应用市场佣金（如30%）后的公司预计净收入。', formula: '总充值 - 国税 - 佣金' },
                    { name: '活跃人数 (Active Users)', desc: '统计周期内，登录并进入应用的用户去重总数（含新注册和老用户）。', formula: 'Count(New_Users + Returning_Users)' },
                    { name: '观看人数 (Viewers)', desc: '统计周期内，至少观看过任意一集剧集的用户去重总数。', formula: '去重计数(Play_Event_User_ID)' },
                    { name: '意向人数 (Intention)', desc: '统计周期内，点击充值档位并成功唤起支付页面的用户数。', formula: '去重计数(Trigger_Payment_User_ID)' },
                    { name: '充值人数 (Payers)', desc: '统计周期内，成功完成至少一笔充值订单的用户去重总数。', formula: '去重计数(Success_Pay_User_ID)' },
                    { name: '客单价 (ARPU)', desc: '统计周期内，平均每个付费用户的充值金额。', formula: '支付成功总金额 / 充值人数' },
                    { name: '当日新增付费人数', desc: '当日新注册且在当日完成付费的用户数（含染色新增）。', formula: '当日新注册且在当日完成付费的用户数' },
                    { name: '当日新增付费金额', desc: '当日新注册用户在当日产生的充值成功总金额。', formula: 'Sum(Amount where Reg_Date == Today and Pay_Date == Today)' },
                    { name: '成交转化率 (CVR)', desc: '付费用户占意向用户的比例。', formula: '(充值人数 / 意向人数) * 100%' },
                  ].map((item, i) => (
                    <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="font-bold text-slate-700 text-sm mb-1">{item.name}</div>
                      <div className="text-xs text-slate-500 mb-2 leading-relaxed">{item.desc}</div>
                      <div className="text-[10px] font-mono bg-white p-2 rounded border border-slate-200 text-indigo-600">
                        <span className="text-slate-400 mr-2">公式:</span>{item.formula}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section: Marketing Metrics */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                  <h4 className="text-base font-bold text-slate-800 uppercase tracking-wide">投放指标 (Marketing Metrics)</h4>
                </div>
                
                <div className="space-y-6">
                  <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-slate-700 text-sm">实时短剧排行</span>
                    </div>
                    <div className="text-xs text-slate-500 leading-relaxed space-y-2">
                      <p><span className="font-bold text-slate-700">起量剧：</span>当日充值金额排行前五的剧集。</p>
                      <p><span className="font-bold text-slate-700">新上架：</span>按最新上架时间排序的前五部剧集。</p>
                      <p><span className="font-bold text-slate-700">排序逻辑：</span>支持按语言类型进行过滤和排序。</p>
                      <div className="bg-white p-3 rounded border border-slate-200 mt-2">
                        <span className="font-bold text-slate-700 block mb-1">展示字段：</span>
                        原剧名、现剧名、剧ID、剧语言、观看人数、意向人数、支付人数、自投消耗、自投充值、分销充值、自投ROI。
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="font-bold text-slate-700 text-sm mb-1">充值分布 (Recharge Dist)</div>
                      <div className="text-xs text-slate-500 mb-2">对比今日与昨日同时段数据，分析充值趋势。</div>
                      <div className="text-[10px] font-mono bg-white p-2 rounded border border-slate-200 text-emerald-600">
                        维度: 累计金额、时段充值金额 (Hourly)
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="font-bold text-slate-700 text-sm mb-1">分布分析 (Analysis)</div>
                      <div className="text-xs text-slate-500 mb-2">对比今日与昨日同时段数据，分析用户构成。</div>
                      <div className="text-[10px] font-mono bg-white p-2 rounded border border-slate-200 text-emerald-600">
                        维度: 注册国家 (Country)、支付方式 (Pay Method)
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: App Activity */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-6 bg-rose-500 rounded-full"></div>
                  <h4 className="text-base font-bold text-slate-800 uppercase tracking-wide">应用活跃 (App Activity)</h4>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-xs text-slate-500 mb-3">按应用维度统计的漏斗转化数据：</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { name: '基础信息', val: '应用名称、客户端' },
                      { name: '活跃人数', val: '注册 + 登录去重总数' },
                      { name: '观看人数', val: 'Play事件去重总数' },
                      { name: '意向转化', val: '意向人数 / 活跃人数' },
                      { name: '充值转化', val: '充值人数 / 活跃人数' },
                    ].map((m, i) => (
                      <div key={i} className="bg-white p-2 rounded border border-slate-100">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">{m.name}</div>
                        <div className="text-xs text-slate-700 font-medium">{m.val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 text-center">
              <p className="text-[10px] text-slate-400 italic">最后更新时间: 2026-03-24 | 版本: v1.2.0</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
