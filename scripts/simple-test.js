// Simple test for location extraction
const { countryList, locationPatterns } = require('./location-patterns');

console.log('🧪 簡化測試地點提取');
console.log('南美國家支援:', countryList.filter(c => ['Peru', 'Bolivia', 'Chile', 'Argentina', 'Brazil'].includes(c)));

// Test Peru caption
const peruCaption = `Peru 
秘魯 .
.
是因為有出發的理由
還是沒有留在這的理由
而選擇出走？
.
.
#verasworld #adventure #explore #travelphotography #traveltheworld #travelblogger #backpacking #peru #lifequotes #outdoors #trip  #tbt #memory #traveler`;

console.log('\n📍 測試 Peru 標題:');
console.log('標題前幾行:', peruCaption.split('\n').slice(0, 3).join('\\n'));

for (let i = 0; i < locationPatterns.length; i++) {
    const pattern = locationPatterns[i];
    const match = peruCaption.match(pattern.regex);
    if (match) {
        console.log(`✅ 匹配成功! Pattern #${i + 1} (${pattern.type})`);
        console.log(`   提取的文字: "${match[1] || match[0]}"`);
        
        if (pattern.type === 'country' && (match[1] === 'Peru' || match[0] === 'Peru')) {
            console.log('🎯 成功！正確識別 Peru 為國家');
        }
        break;
    }
}

console.log('\n✅ 測試完成');
