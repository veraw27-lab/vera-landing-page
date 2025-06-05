// 分析現有數據的location patterns，重新設計extraction規則
const fs = require('fs');

// 讀取現有的travel data
const data = JSON.parse(fs.readFileSync('./travel-map/data/travel-data.json', 'utf8'));

console.log('📊 分析現有數據的location patterns...\n');

// 收集所有的第一行和第二行patterns
const patterns = new Map();
let totalPosts = 0;

Object.keys(data.countries).forEach(country => {
  data.countries[country].posts.forEach(post => {
    totalPosts++;
    const caption = post.caption;
    const lines = caption.split('\n');
    const firstLine = (lines[0] || '').trim();
    const secondLine = (lines[1] || '').trim();
    
    // 分析第一行的pattern
    if (firstLine) {
      // 檢查是否包含 • 符號
      if (firstLine.includes('•')) {
        const parts = firstLine.split('•').map(p => p.trim());
        const key = `BULLET: ${parts.length} parts`;
        patterns.set(key, (patterns.get(key) || 0) + 1);
        
        if (parts.length === 2) {
          console.log(`🟢 BULLET PATTERN: "${firstLine}"`);
          console.log(`   → Country: "${parts[0]}", City: "${parts[1]}"`);
          console.log(`   → Second line: "${secondLine}"`);
          console.log(`   → Assigned: ${post.location.country} / ${post.location.city}`);
          console.log(`   → Link: ${post.permalink}`);
          console.log('');
        }
      }
      
      // 檢查其他patterns
      if (firstLine.match(/^[A-Za-z\s]+$/)) {
        patterns.set('ENGLISH_ONLY', (patterns.get('ENGLISH_ONLY') || 0) + 1);
      }
      
      if (firstLine.includes('📍')) {
        patterns.set('GPS_MARKER', (patterns.get('GPS_MARKER') || 0) + 1);
        console.log(`📍 GPS PATTERN: "${firstLine}"`);
        console.log(`   → Assigned: ${post.location.country} / ${post.location.city}`);
        console.log('');
      }
    }
  });
});

console.log('\n📈 Pattern 統計:');
for (const [pattern, count] of patterns.entries()) {
  console.log(`${pattern}: ${count} posts (${(count/totalPosts*100).toFixed(1)}%)`);
}

console.log(`\n📊 總計: ${totalPosts} posts`);
