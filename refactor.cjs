const fs = require('fs');

let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// 1. Update sectionOrder state
content = content.replace(
  /const \[sectionOrder, setSectionOrder\] = useState<string\[\]>\(\(\) => \{[\s\S]*?\}\);[\s\S]*?useEffect\(\(\) => \{[\s\S]*?\}, \[sectionOrder\]\);/,
  `const [sectionOrder, setSectionOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('dashboard_section_order_v2');
    return saved ? JSON.parse(saved) : [
      'realtime-metrics',
      'charts-row',
      'rankings-row',
      'app-funnel',
      'distributor-ranking',
      'monthly-lead-ranking'
    ];
  });

  useEffect(() => {
    localStorage.setItem('dashboard_section_order_v2', JSON.stringify(sectionOrder));
  }, [sectionOrder]);`
);

// 2. Extract sections
const getBlock = (startMarker, endMarker) => {
  const startIdx = content.indexOf(startMarker);
  if (startIdx === -1) throw new Error("Start marker not found: " + startMarker);
  const endIdx = content.indexOf(endMarker, startIdx);
  if (endIdx === -1) throw new Error("End marker not found: " + endMarker);
  return content.substring(startIdx, endIdx);
};

const realtimeMetrics = getBlock(
  '{/* Section 1: Realtime Data (实时数据) */}',
  '{/* Main Dashboard Grid */}'
).trim();

const dramaRankings = getBlock(
  '{/* Short Drama Rankings */}',
  '          </div>\n\n          {/* Right Column: Charts */}'
).trim();

const hourlyTrend = getBlock(
  '{/* Hourly Recharge Trend (充值分布图) */}',
  '{/* Distribution Analysis (分布分析) */}'
).trim();

const distributionAnalysis = getBlock(
  '{/* Distribution Analysis (分布分析) */}',
  '          </div>\n        </div>\n\n        {/* Active User & Conversion Funnel List (New Row) */}'
).trim();

const appFunnel = getBlock(
  '{/* Active User & Conversion Funnel List (New Row) */}',
  '{/* Channel Rankings Table */}'
).trim();

const channelRankings = getBlock(
  '{/* Channel Rankings Table */}',
  '{/* Section 5: Distributor Rankings (Cards) */}'
).trim();

// 3. Create render functions
const renderFunctions = `
  const renderSection = (id: string) => {
    switch (id) {
      case 'realtime-metrics':
        return (
          ${realtimeMetrics}
        );
      case 'charts-row':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            ${hourlyTrend}
            ${distributionAnalysis}
          </div>
        );
      case 'rankings-row':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 flex flex-col h-full">
              ${dramaRankings}
            </div>
            <div className="lg:col-span-8 flex flex-col h-full">
              ${channelRankings}
            </div>
          </div>
        );
      case 'app-funnel':
        return (
          ${appFunnel}
        );
      case 'distributor-ranking':
        return renderDistributorRanking();
      case 'monthly-lead-ranking':
        return renderMonthlyLeadRanking();
      default:
        return null;
    }
  };
`;

// 4. Replace main block
const mainStart = content.indexOf('<main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">');
const mainEnd = content.indexOf('</main>', mainStart) + '</main>'.length;

const newMain = `<main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      </main>`;

content = content.substring(0, mainStart) + newMain + content.substring(mainEnd);

// 5. Insert renderFunctions right before "if (!realtimeData) return null;"
const insertIdx = content.indexOf('if (!realtimeData) return null;');
content = content.substring(0, insertIdx) + renderFunctions + '\n  ' + content.substring(insertIdx);

fs.writeFileSync('src/components/Dashboard.tsx', content);
console.log("Refactoring complete");
