import { formatInTimeZone } from 'date-fns-tz';

export type Timezone = 'UTC' | 'Asia/Shanghai';
export type Currency = 'USD' | 'CNY';

export interface GlobalRechargeData {
  period: string;
  totalRecharge: number;
  totalRevenue: number;
  selfSpend: number;
  selfRecharge: number;
  selfNetRevenue: number;
  selfNetRoi: number;
  selfRechargeRoi: number;
  distRecharge: number;
  distNetRevenue: number;
}

export interface DramaData {
  id: string;
  name: string;
  chineseName: string;
  language: string;
  revenue: number;
  viewingUsers: number;
  intentionCount: number;
  payingUsers: number;
  trend: number;
  cover: string;
  selfSpend: number;
  selfSpendTrend: number;
  selfRecharge: number;
  selfRechargeTrend: number;
  selfRoi: number;
  distRecharge: number;
  distRechargeTrend: number;
  netRevenue: number;
}

export interface ChannelData {
  id: string; // Channel ID
  name: string; // Optimizer (优化师)
  leadName: string; // Optimizer Lead (优化师组长)
  platform: 'fb' | 'tk';
  type: 'self' | 'dist';
  recharge: number;
  rechargeUsers: number;
  newRecharge: number;
  newRechargeUsers: number;
  spend?: number;
  netRevenue: number;
  roi?: number;
  activeUsers?: number;
  promoLinkCount: number;
  optimizerCount: number;
  dramaName: string;
  dramaId: string;
  language: string;
  department: string;
}

export interface DistributorData {
  name: string;
  recharge: number;
  netRevenue: number;
  newPromoLinks: number;
}

export interface LtvData {
  day: string;
  amount: number;
}

export interface HourlyData {
  hour: string;
  today: number;
  yesterday: number;
}

export interface HourlyActiveUserData {
  hour: string;
  activeUsers: number;
  previousActiveUsers: number;
}

const generateRandomGlobalData = (multiplier: number, currencyRate: number): Omit<GlobalRechargeData, 'period'> => {
  const selfSpend = Math.round((Math.random() * 5000 + 1000) * multiplier * currencyRate);
  const selfRechargeRoi = +(Math.random() * 0.5 + 1.1).toFixed(2); // 1.1 to 1.6
  const selfRecharge = Math.round(selfSpend * selfRechargeRoi);
  
  const taxRate = 0.15; // 15% platform fee/tax
  const selfNetRevenue = Math.round(selfRecharge * (1 - taxRate));
  const selfNetRoi = +(selfNetRevenue / selfSpend).toFixed(2);

  const distRecharge = Math.round((Math.random() * 3000 + 500) * multiplier * currencyRate);
  const distNetRevenue = Math.round(distRecharge * (1 - taxRate) * 0.7); // Assuming 70% share to us

  const totalRecharge = selfRecharge + distRecharge;
  const totalRevenue = selfNetRevenue + distNetRevenue;

  return {
    totalRecharge,
    totalRevenue,
    selfSpend,
    selfRecharge,
    selfNetRevenue,
    selfNetRoi,
    selfRechargeRoi,
    distRecharge,
    distNetRevenue,
  };
};

export const getGlobalRechargeData = (timezone: Timezone, currency: Currency): GlobalRechargeData[] => {
  const tzMultiplier = timezone === 'Asia/Shanghai' ? 1.2 : timezone === 'UTC' ? 1.0 : 0.8;
  const currencyRate = currency === 'CNY' ? 7.2 : 1;

  return [
    { period: '今日 (Today)', ...generateRandomGlobalData(1 * tzMultiplier, currencyRate) },
    { period: '昨日 (Yesterday)', ...generateRandomGlobalData(1.2 * tzMultiplier, currencyRate) },
    { period: '当月 (This Month)', ...generateRandomGlobalData(15 * tzMultiplier, currencyRate) },
    { period: '上月 (Last Month)', ...generateRandomGlobalData(30 * tzMultiplier, currencyRate) },
    { period: '年度 (Yearly)', ...generateRandomGlobalData(150 * tzMultiplier, currencyRate) },
  ];
};

export interface RealtimeMetrics {
  totalRecharge: number;
  netRevenue: number;
  selfRecharge: number;
  selfSpend: number;
  selfRoi: number;
  selfNetRevenue: number;
  distRecharge: number;
  distNetRevenue: number;
  activeUsers: number;
  viewingUsers: number;
  intentUsers: number;
  rechargeUsers: number;
  arpu: number;
  newPayingUsers: number;
  newPayingAmount: number;
  conversionRate: number;
}

export const getRealtimeMetrics = (timezone: Timezone, currency: Currency, period: string): RealtimeMetrics => {
  const tzMultiplier = timezone === 'Asia/Shanghai' ? 1.2 : timezone === 'UTC' ? 1.0 : 0.8;
  const currencyRate = currency === 'CNY' ? 7.2 : 1;
  let multiplier = 1;
  switch (period) {
    case 'today': multiplier = 1; break;
    case 'yesterday': multiplier = 1.2; break;
    case '7days': multiplier = 7.5; break;
    case 'month': multiplier = 15; break;
    case 'lastMonth': multiplier = 30; break;
  }

  const base = multiplier * tzMultiplier * currencyRate;
  
  const selfSpend = Math.round((Math.random() * 3000 + 2000) * base);
  const selfRoi = +(Math.random() * 0.5 + 1.0).toFixed(2);
  const selfRecharge = Math.round(selfSpend * selfRoi);
  const selfNetRevenue = Math.round(selfRecharge * 0.85);

  const distRecharge = Math.round((Math.random() * 2000 + 1000) * base);
  const distNetRevenue = Math.round(distRecharge * 0.85 * 0.7);

  const totalRecharge = selfRecharge + distRecharge;
  const netRevenue = selfNetRevenue + distNetRevenue;

  const rechargeUsers = Math.round((Math.random() * 500 + 200) * multiplier * tzMultiplier);
  const arpu = totalRecharge / rechargeUsers;
  const activeUsers = Math.round(rechargeUsers * (Math.random() * 5 + 10));
  const viewingUsers = Math.round(activeUsers * (Math.random() * 0.3 + 0.5));
  const intentUsers = Math.round(viewingUsers * (Math.random() * 0.4 + 0.2));
  const conversionRate = (rechargeUsers / intentUsers) * 100;

  const newPayingUsers = Math.round(rechargeUsers * (Math.random() * 0.3 + 0.1));
  const newPayingAmount = Math.round(newPayingUsers * arpu * (Math.random() * 0.5 + 0.8));

  return {
    totalRecharge,
    netRevenue,
    selfRecharge,
    selfSpend,
    selfRoi,
    selfNetRevenue,
    distRecharge,
    distNetRevenue,
    activeUsers,
    viewingUsers,
    intentUsers,
    rechargeUsers,
    arpu,
    newPayingUsers,
    newPayingAmount,
    conversionRate
  };
};

export const getActiveUserAppDistribution = (date: 'today' | 'yesterday' = 'today') => {
  const m = date === 'today' ? 1 : 0.85;
  return [
    { name: 'yoo', activeUsers: Math.round(12500 * m), viewingUsers: Math.round(8500 * m), intentUsers: Math.round(4200 * m), rechargeUsers: Math.round(1250 * m), color: '#4f46e5' },
    { name: 'manseen', activeUsers: Math.round(8200 * m), viewingUsers: Math.round(5600 * m), intentUsers: Math.round(2800 * m), rechargeUsers: Math.round(980 * m), color: '#0ea5e9' },
    { name: '马甲包A', activeUsers: Math.round(6400 * m), viewingUsers: Math.round(4300 * m), intentUsers: Math.round(2100 * m), rechargeUsers: Math.round(810 * m), color: '#10b981' },
    { name: '马甲包B', activeUsers: Math.round(5100 * m), viewingUsers: Math.round(3500 * m), intentUsers: Math.round(1750 * m), rechargeUsers: Math.round(650 * m), color: '#f59e0b' },
    { name: '马甲包C', activeUsers: Math.round(4200 * m), viewingUsers: Math.round(2800 * m), intentUsers: Math.round(1400 * m), rechargeUsers: Math.round(520 * m), color: '#8b5cf6' },
    { name: '马甲包D', activeUsers: Math.round(3600 * m), viewingUsers: Math.round(2400 * m), intentUsers: Math.round(1200 * m), rechargeUsers: Math.round(450 * m), color: '#ec4899' },
    { name: '马甲包E', activeUsers: Math.round(2800 * m), viewingUsers: Math.round(1900 * m), intentUsers: Math.round(950 * m), rechargeUsers: Math.round(340 * m), color: '#f43f5e' },
    { name: '马甲包F', activeUsers: Math.round(2100 * m), viewingUsers: Math.round(1400 * m), intentUsers: Math.round(700 * m), rechargeUsers: Math.round(260 * m), color: '#14b8a6' },
    { name: '马甲包G', activeUsers: Math.round(1500 * m), viewingUsers: Math.round(1000 * m), intentUsers: Math.round(500 * m), rechargeUsers: Math.round(180 * m), color: '#84cc16' },
    { name: '其他', activeUsers: Math.round(1200 * m), viewingUsers: Math.round(800 * m), intentUsers: Math.round(400 * m), rechargeUsers: Math.round(140 * m), color: '#eab308' },
  ];
};

export const getAppData = (date: 'today' | 'yesterday' = 'today') => {
  const m = date === 'today' ? 1 : 0.85;
  return {
    clients: [
      { name: 'iOS', value: 45 },
      { name: 'Android', value: 35 },
      { name: 'H5', value: 15 },
      { name: '小程序', value: 5 },
    ],
    packages: [
      { name: 'yoo', value: 50 },
      { name: 'manseen', value: 30 },
      { name: '马甲包A', value: 12 },
      { name: '马甲包B', value: 8 },
    ],
    payments: [
      { name: 'Apple Pay', value: Math.round(40 * m) },
      { name: 'Google Pay', value: Math.round(30 * m) },
      { name: 'Credit Card', value: Math.round(20 * m) },
      { name: 'PayPal', value: Math.round(10 * m) },
    ]
  };
};

export const getRegionData = (currency: Currency, date: 'today' | 'yesterday' = 'today') => {
  const rate = currency === 'CNY' ? 7.2 : 1;
  const m = date === 'today' ? 1 : 0.92;
  return [
    { name: 'US', label: '美国', value: 4500 * rate * m },
    { name: 'UK', label: '英国', value: 2100 * rate * m },
    { name: 'AU', label: '澳大利亚', value: 1800 * rate * m },
    { name: 'CA', label: '加拿大', value: 1500 * rate * m },
    { name: 'SG', label: '新加坡', value: 900 * rate * m },
    { name: 'MY', label: '马来西亚', value: 600 * rate * m },
    { name: 'ID', label: '印尼', value: 450 * rate * m },
    { name: 'TH', label: '泰国', value: 300 * rate * m },
  ];
};

export const getDramaRankings = (currency: Currency, languageFilter: string = 'ALL') => {
  const rate = currency === 'CNY' ? 7.2 : 1;
  
  const generateDramaMetrics = (revenue: number) => {
    const selfRecharge = Math.round(revenue * (Math.random() * 0.4 + 0.4)); // 40% to 80% self
    const distRecharge = revenue - selfRecharge;
    
    const selfRoi = +(Math.random() * 0.6 + 0.9).toFixed(2); // 0.9 to 1.5
    const selfSpend = Math.round(selfRecharge / selfRoi);
    
    const selfSpendTrend = Math.round(Math.random() * 40 - 15); // -15% to +25%
    const selfRechargeTrend = Math.round(Math.random() * 40 - 10); // -10% to +30%
    const distRechargeTrend = Math.round(Math.random() * 50 - 10); // -10% to +40%
    
    const netRevenue = Math.round(revenue * 0.85); // 85% after platform fees
    
    // Generate user counts: viewing > intention > paying
    const payingUsers = Math.round((revenue / rate) / (Math.random() * 20 + 10)); 
    const intentionCount = Math.round(payingUsers * (Math.random() * 3 + 1.5));
    const viewingUsers = Math.round(intentionCount * (Math.random() * 5 + 3));
    
    return { 
      selfSpend, selfSpendTrend, selfRecharge, selfRechargeTrend, selfRoi,
      distRecharge, distRechargeTrend,
      netRevenue, viewingUsers, intentionCount, payingUsers 
    };
  };

  const allDramas = {
    trending: [
      { 
        id: '1001', 
        name: 'Billionaire\'s Secret Wife', 
        chineseName: '亿万富翁的秘密妻子',
        language: 'EN', 
        revenue: 125000 * rate, 
        trend: 15,
        cover: 'https://picsum.photos/seed/drama1/120/160',
        ...generateDramaMetrics(125000 * rate)
      },
      { 
        id: '1002', 
        name: 'Alpha\'s Rejected Mate', 
        chineseName: '阿尔法的被拒伴侣',
        language: 'EN', 
        revenue: 98000 * rate, 
        trend: 22,
        cover: 'https://picsum.photos/seed/drama2/120/160',
        ...generateDramaMetrics(98000 * rate)
      },
      { 
        id: '1003', 
        name: 'El Amor del CEO', 
        chineseName: 'CEO之爱',
        language: 'ES', 
        revenue: 85000 * rate, 
        trend: 8,
        cover: 'https://picsum.photos/seed/drama3/120/160',
        ...generateDramaMetrics(85000 * rate)
      },
      { 
        id: '1004', 
        name: 'Vampire King', 
        chineseName: '吸血鬼之王',
        language: 'EN', 
        revenue: 76000 * rate, 
        trend: -5,
        cover: 'https://picsum.photos/seed/drama4/120/160',
        ...generateDramaMetrics(76000 * rate)
      },
      { 
        id: '1005', 
        name: 'Cinta Sang Miliarder', 
        chineseName: '亿万富翁之恋',
        language: 'ID', 
        revenue: 65000 * rate, 
        trend: 12,
        cover: 'https://picsum.photos/seed/drama5/120/160',
        ...generateDramaMetrics(65000 * rate)
      },
      { 
        id: '1009', 
        name: 'La Venganza', 
        chineseName: '复仇',
        language: 'ES', 
        revenue: 54000 * rate, 
        trend: 18,
        cover: 'https://picsum.photos/seed/drama6/120/160',
        ...generateDramaMetrics(54000 * rate)
      },
    ],
    new: [
      { 
        id: '2001', 
        name: 'Rebirth of the Heiress', 
        chineseName: '继承人的重生',
        language: 'EN', 
        revenue: 45000 * rate, 
        trend: 150,
        cover: 'https://picsum.photos/seed/drama7/120/160',
        ...generateDramaMetrics(45000 * rate)
      },
      { 
        id: '2002', 
        name: 'Mi Dulce Venganza', 
        chineseName: '我的甜蜜复仇',
        language: 'ES', 
        revenue: 38000 * rate, 
        trend: 120,
        cover: 'https://picsum.photos/seed/drama8/120/160',
        ...generateDramaMetrics(38000 * rate)
      },
      { 
        id: '2003', 
        name: 'Dragon\'s Bride', 
        chineseName: '龙的新娘',
        language: 'EN', 
        revenue: 32000 * rate, 
        trend: 85,
        cover: 'https://picsum.photos/seed/drama9/120/160',
        ...generateDramaMetrics(32000 * rate)
      },
      { 
        id: '2004', 
        name: 'Istri yang Terbuang', 
        chineseName: '被抛弃的妻子',
        language: 'ID', 
        revenue: 28000 * rate, 
        trend: 210,
        cover: 'https://picsum.photos/seed/drama10/120/160',
        ...generateDramaMetrics(28000 * rate)
      },
    ]
  };

  if (languageFilter === 'ALL') return allDramas;

  return {
    trending: allDramas.trending.filter(d => d.language === languageFilter),
    new: allDramas.new.filter(d => d.language === languageFilter),
  };
};

export const getChannelData = (currency: Currency, date: 'today' | 'yesterday' | 'month', month?: string): ChannelData[] => {
  const rate = currency === 'CNY' ? 7.2 : 1;
  let m = date === 'today' ? 1 : date === 'yesterday' ? 1.15 : 25; // multiplier for yesterday or month
  
  // Adjust multiplier slightly based on month string to simulate data changes
  if (month) {
    const monthNum = parseInt(month.split('-')[1]);
    m = m * (1 + (monthNum % 5) * 0.05);
  }

  const data: ChannelData[] = [
    { 
      id: 'CH001', name: '陈伟', leadName: '张强', platform: 'fb', type: 'self', 
      recharge: 150000 * rate * m, rechargeUsers: 1250, 
      newRecharge: 45000 * rate * m, newRechargeUsers: 380,
      spend: 100000 * rate * m, roi: 1.50, netRevenue: 127500 * rate * m,
      promoLinkCount: 45, optimizerCount: 3,
      dramaName: 'Billionaire\'s Secret Wife', dramaId: '1001', language: '英语',
      department: '深圳--市场部'
    },
    { 
      id: 'CH002', name: '李娜', leadName: '张强', platform: 'tk', type: 'self', 
      recharge: 120000 * rate * m, rechargeUsers: 980, 
      newRecharge: 38000 * rate * m, newRechargeUsers: 310,
      spend: 85000 * rate * m, roi: 1.41, netRevenue: 102000 * rate * m,
      promoLinkCount: 38, optimizerCount: 2,
      dramaName: 'Alpha\'s Rejected Mate', dramaId: '1002', language: '英语',
      department: '深圳--市场部'
    },
    { 
      id: 'CH003', name: '王明', leadName: '李华', platform: 'fb', type: 'self', 
      recharge: 95000 * rate * m, rechargeUsers: 750, 
      newRecharge: 25000 * rate * m, newRechargeUsers: 200,
      spend: 75000 * rate * m, roi: 1.26, netRevenue: 80750 * rate * m,
      promoLinkCount: 25, optimizerCount: 2,
      dramaName: 'The CEO\'s Contract', dramaId: '1004', language: '英语',
      department: '广州--市场部'
    },
    { 
      id: 'CH004', name: '刘芳', leadName: '李华', platform: 'tk', type: 'self', 
      recharge: 80000 * rate * m, rechargeUsers: 620, 
      newRecharge: 30000 * rate * m, newRechargeUsers: 240,
      spend: 50000 * rate * m, roi: 1.60, netRevenue: 68000 * rate * m,
      promoLinkCount: 30, optimizerCount: 1,
      dramaName: 'Billionaire\'s Secret Wife', dramaId: '1001', language: '英语',
      department: '广州--市场部'
    },
    { 
      id: 'CH005', name: '金大卫', leadName: '李华', platform: 'fb', type: 'self', 
      recharge: 60000 * rate * m, rechargeUsers: 480, 
      newRecharge: 15000 * rate * m, newRechargeUsers: 120,
      spend: 55000 * rate * m, roi: 1.09, netRevenue: 51000 * rate * m,
      promoLinkCount: 15, optimizerCount: 1,
      dramaName: 'Alpha\'s Rejected Mate', dramaId: '1002', language: '英语',
      department: '广州--市场部'
    },
    { 
      id: 'CH006', name: '分销商Alpha', leadName: '赵敏', platform: 'fb', type: 'dist', 
      recharge: 250000 * rate * m, rechargeUsers: 2100, 
      newRecharge: 60000 * rate * m, newRechargeUsers: 500,
      netRevenue: 87500 * rate * m, activeUsers: Math.floor(12500 * m),
      promoLinkCount: 125, optimizerCount: 12,
      dramaName: 'The CEO\'s Contract', dramaId: '1004', language: '英语',
      department: '分销--分销公司1'
    },
    { 
      id: 'CH007', name: '全球媒体网络', leadName: '孙悦', platform: 'tk', type: 'dist', 
      recharge: 180000 * rate * m, rechargeUsers: 1500, 
      newRecharge: 45000 * rate * m, newRechargeUsers: 380,
      netRevenue: 63000 * rate * m, activeUsers: Math.floor(9800 * m),
      promoLinkCount: 98, optimizerCount: 8,
      dramaName: 'Billionaire\'s Secret Wife', dramaId: '1001', language: '英语',
      department: '分销--分销公司2'
    },
    { 
      id: 'CH008', name: '短剧推广公司', leadName: '赵敏', platform: 'fb', type: 'dist', 
      recharge: 120000 * rate * m, rechargeUsers: 950, 
      newRecharge: 32000 * rate * m, newRechargeUsers: 260,
      netRevenue: 42000 * rate * m, activeUsers: Math.floor(6500 * m),
      promoLinkCount: 75, optimizerCount: 6,
      dramaName: 'Alpha\'s Rejected Mate', dramaId: '1002', language: '英语',
      department: '分销--分销公司1'
    },
    { 
      id: 'CH009', name: '亚洲触达', leadName: '孙悦', platform: 'tk', type: 'dist', 
      recharge: 90000 * rate * m, rechargeUsers: 720, 
      newRecharge: 21000 * rate * m, newRechargeUsers: 170,
      netRevenue: 31500 * rate * m, activeUsers: Math.floor(4200 * m),
      promoLinkCount: 42, optimizerCount: 4,
      dramaName: 'El Amor del CEO', dramaId: '1003', language: '西班牙语',
      department: '分销--分销公司2'
    },
    { 
      id: 'CH010', name: '欧洲流媒体', leadName: '赵敏', platform: 'fb', type: 'dist', 
      recharge: 65000 * rate * m, rechargeUsers: 520, 
      newRecharge: 15000 * rate * m, newRechargeUsers: 120,
      netRevenue: 22750 * rate * m, activeUsers: Math.floor(3100 * m),
      promoLinkCount: 31, optimizerCount: 3,
      dramaName: 'El Amor del CEO', dramaId: '1003', language: '西班牙语',
      department: '分销--分销公司1'
    },
  ];

  return data.sort((a, b) => b.recharge - a.recharge);
};

export const getDistributorData = (currency: Currency, month: string = '2024-03'): DistributorData[] => {
  const rate = currency === 'CNY' ? 7.2 : 1;
  // Use month string as a seed for some variance
  const monthSeed = month.split('-').reduce((acc, part) => acc + parseInt(part), 0);
  const m = 0.8 + (monthSeed % 5) * 0.1; // Variance between 0.8 and 1.2
  
  return [
    { name: '分销商Alpha', recharge: 250000 * rate * m, netRevenue: 87500 * rate * m, newPromoLinks: Math.floor(125 * m) },
    { name: '全球媒体网络', recharge: 180000 * rate * m, netRevenue: 63000 * rate * m, newPromoLinks: Math.floor(98 * m) },
    { name: '短剧推广有限公司', recharge: 120000 * rate * m, netRevenue: 42000 * rate * m, newPromoLinks: Math.floor(75 * m) },
    { name: '亚洲触达', recharge: 90000 * rate * m, netRevenue: 31500 * rate * m, newPromoLinks: Math.floor(42 * m) },
    { name: '欧洲流媒体', recharge: 65000 * rate * m, netRevenue: 22750 * rate * m, newPromoLinks: Math.floor(31 * m) },
  ].sort((a, b) => b.recharge - a.recharge);
};

export const getLtvData = (currency: Currency, days: number = 7): LtvData[] => {
  const rate = currency === 'CNY' ? 7.2 : 1;
  const data: LtvData[] = [];
  let currentAmount = 15.5;

  for (let i = 1; i <= days; i++) {
    data.push({ day: `Day ${i}`, amount: +(currentAmount * rate).toFixed(2) });
    
    let increment = 0;
    if (i === 1) increment = 6.8;
    else if (i === 2) increment = 4.5;
    else if (i === 3) increment = 2.7;
    else if (i === 4) increment = 1.7;
    else if (i === 5) increment = 1.3;
    else if (i === 6) increment = 1.3;
    else increment = 1.2 * Math.pow(0.92, i - 7);

    currentAmount += increment;
  }

  return data;
};

export const getHourlyRechargeData = (currency: Currency): HourlyData[] => {
  const rate = currency === 'CNY' ? 7.2 : 1;
  const data: HourlyData[] = [];
  
  // Simulate a typical 24-hour curve (peak around evening)
  for (let i = 0; i < 24; i++) {
    const hour = `${i.toString().padStart(2, '0')}:00`;
    let base = 1000;
    if (i >= 18 && i <= 22) base = 5000; // Evening peak
    else if (i >= 8 && i <= 17) base = 2500; // Daytime
    else base = 800; // Night
    
    // Today's data (might be incomplete if we simulate current time, but let's show full for comparison)
    // Add some random variance
    const todayVariance = Math.random() * 0.4 + 0.8; // 0.8 to 1.2
    const yesterdayVariance = Math.random() * 0.3 + 0.85; // slightly different curve
    
    // Simulate today being generally 10% higher than yesterday
    const todayBase = base * 1.1;
    
    data.push({
      hour,
      today: Math.round(todayBase * todayVariance * rate),
      yesterday: Math.round(base * yesterdayVariance * rate)
    });
  }
  return data;
};

export const getHourlyActiveUserData = (): HourlyActiveUserData[] => {
  const data: HourlyActiveUserData[] = [];
  
  for (let i = 0; i < 24; i++) {
    const hour = `${i.toString().padStart(2, '0')}:00`;
    let base = 500;
    if (i >= 18 && i <= 22) base = 2500; // Evening peak
    else if (i >= 8 && i <= 17) base = 1200; // Daytime
    else base = 300; // Night
    
    const variance = Math.random() * 0.3 + 0.85;
    const prevVariance = Math.random() * 0.3 + 0.8;
    
    data.push({
      hour,
      activeUsers: Math.round(base * variance),
      previousActiveUsers: Math.round(base * 0.9 * prevVariance)
    });
  }
  return data;
};
