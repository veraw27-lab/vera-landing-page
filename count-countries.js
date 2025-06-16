const fs = require('fs');

// 讀取 travel-data.json 文件
const data = JSON.parse(fs.readFileSync('/workspaces/vera-landing-page/travel-map/data/travel-data.json', 'utf8'));

// 獲取所有國家
const countries = Object.keys(data.countries);

console.log('=== 國家統計 ===');
console.log(`總共有 ${countries.length} 個國家/地區`);
console.log('\n國家列表：');

countries.forEach((country, index) => {
    const postCount = data.countries[country].posts ? data.countries[country].posts.length : 0;
    console.log(`${index + 1}. ${country} (${postCount} 篇貼文)`);
});

// 檢查是否有重複或異常的國家名稱
console.log('\n=== 數據品質檢查 ===');
const duplicates = [];
const suspicious = [];

countries.forEach(country => {
    // 檢查是否有重複的國家（大小寫不同）
    const lowercase = country.toLowerCase();
    const similar = countries.filter(c => c.toLowerCase() === lowercase);
    if (similar.length > 1 && !duplicates.includes(lowercase)) {
        duplicates.push(lowercase);
        console.log(`重複國家: ${similar.join(', ')}`);
    }
    
    // 檢查異常的國家名稱
    if (country.length <= 2 || country.includes('undefined') || country === 'n' || country === 'A') {
        suspicious.push(country);
    }
});

if (suspicious.length > 0) {
    console.log(`可疑的國家名稱: ${suspicious.join(', ')}`);
}

console.log(`\n實際有效國家數量估計: ${countries.length - suspicious.length}`);
