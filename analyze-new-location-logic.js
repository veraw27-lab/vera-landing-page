// 新的location extraction規則 - 根據用戶要求重新設計
// 1. 優先GPS座標
// 2. 第一句英文、第二句中文包含都市國家
// 3. 專注地名提取，不做語意判斷

const fs = require('fs');

// 讀取現有數據
const data = JSON.parse(fs.readFileSync('./travel-map/data/travel-data.json', 'utf8'));

console.log('🔍 重新分析location extraction邏輯...\n');

// 分析各種pattern的例子
const patterns = {
  bulletPattern: [],
  gpsPattern: [],
  cityCountryPattern: [],
  problemCases: []
};

let totalAnalyzed = 0;

Object.keys(data.countries).forEach(country => {
  data.countries[country].posts.forEach(post => {
    if (totalAnalyzed > 100) return; // 限制分析數量
    totalAnalyzed++;
    
    const caption = post.caption;
    const location = post.location;
    const lines = caption.split('\n');
    const firstLine = (lines[0] || '').trim();
    const secondLine = (lines[1] || '').trim();
    
    // 分析GPS pattern
    if (firstLine.includes('📍')) {
      patterns.gpsPattern.push({
        firstLine,
        secondLine,
        assigned: `${location.country} / ${location.city}`,
        permalink: post.permalink
      });
    }
    
    // 分析bullet pattern (Country • City)
    else if (firstLine.includes('•')) {
      const parts = firstLine.split('•').map(p => p.trim());
      if (parts.length === 2) {
        const extractedCountry = parts[0];
        const extractedCity = parts[1];
        
        patterns.bulletPattern.push({
          firstLine,
          secondLine,
          extractedCountry,
          extractedCity,
          assigned: `${location.country} / ${location.city}`,
          permalink: post.permalink,
          correct: location.country === extractedCountry || normalizeCountryName(extractedCountry) === location.country
        });
        
        // 檢查是否有明顯錯誤
        if (extractedCountry !== location.country && 
            !isCountryVariation(extractedCountry, location.country)) {
          patterns.problemCases.push({
            issue: `Extracted "${extractedCountry}" but assigned "${location.country}"`,
            firstLine,
            secondLine,
            permalink: post.permalink
          });
        }
      }
    }
    
    // 分析其他patterns
    else {
      // 檢查是否有城市名稱作為第一個字
      const firstWord = firstLine.split(' ')[0];
      const knownCities = ['Tokyo', 'Taipei', 'Seoul', 'NYC', 'Milan', 'Toscana'];
      
      if (knownCities.includes(firstWord)) {
        patterns.cityCountryPattern.push({
          firstLine,
          secondLine,
          extractedCity: firstWord,
          assigned: `${location.country} / ${location.city}`,
          permalink: post.permalink
        });
      }
    }
  });
});

// 輸出分析結果
console.log('📍 GPS Patterns found:', patterns.gpsPattern.length);
patterns.gpsPattern.slice(0, 3).forEach(p => {
  console.log(`  "${p.firstLine}" → ${p.assigned}`);
});

console.log('\n🟢 Bullet Patterns found:', patterns.bulletPattern.length);
patterns.bulletPattern.slice(0, 5).forEach(p => {
  console.log(`  "${p.extractedCountry} • ${p.extractedCity}" → ${p.assigned} ${p.correct ? '✅' : '❌'}`);
});

console.log('\n🏙️ City-first Patterns found:', patterns.cityCountryPattern.length);
patterns.cityCountryPattern.slice(0, 3).forEach(p => {
  console.log(`  "${p.extractedCity}..." → ${p.assigned}`);
});

console.log('\n❌ Problem Cases found:', patterns.problemCases.length);
patterns.problemCases.slice(0, 5).forEach(p => {
  console.log(`  ${p.issue}`);
  console.log(`     "${p.firstLine}"`);
});

// 輔助函數
function normalizeCountryName(country) {
  const countryMap = {
    'Holland': 'Netherlands',
    'Korean': 'South Korea',
    'Korea': 'South Korea',
    'USA': 'United States',
    'UK': 'United Kingdom',
    'Swiss': 'Switzerland',
    'NZ': 'New Zealand'
  };
  return countryMap[country] || country;
}

function isCountryVariation(extracted, assigned) {
  const variations = {
    'Holland': 'Netherlands',
    'Korean': 'South Korea',
    'Korea': 'South Korea',
    'USA': 'United States',
    'Taiwán': 'Taiwan',
    'Milan': 'Italy',
    'Toscana': 'Italy',
    'NYC': 'United States',
    'New York': 'United States',
    'Seoul': 'South Korea',
    'Taipei': 'Taiwan'
  };
  
  return variations[extracted] === assigned;
}
