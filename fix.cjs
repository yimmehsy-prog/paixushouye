const fs = require('fs');

let content = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// Fix realtime-metrics
content = content.replace(
  /case 'realtime-metrics':\s*return \(\s*\{\/\* Section 1: Realtime Data \(实时数据\) \*\/\}/,
  `case 'realtime-metrics':
        return (
          <>
            {/* Section 1: Realtime Data (实时数据) */}`
);

content = content.replace(
  /<\/section>\s*\);\s*case 'charts-row':/,
  `</section>
          </>
        );
      case 'charts-row':`
);

// Fix app-funnel
content = content.replace(
  /case 'app-funnel':\s*return \(\s*\{\/\* Active User & Conversion Funnel List \(New Row\) \*\/\}/,
  `case 'app-funnel':
        return (
          <>
            {/* Active User & Conversion Funnel List (New Row) */}`
);

// Find the end of app-funnel. It's before case 'distributor-ranking':
content = content.replace(
  /<\/div>\s*\);\s*case 'distributor-ranking':/,
  `</div>
          </>
        );
      case 'distributor-ranking':`
);

fs.writeFileSync('src/components/Dashboard.tsx', content);
console.log("Fixes applied");
