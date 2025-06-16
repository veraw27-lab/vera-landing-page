const fs = require('fs');

try {
    // 讀取數據文件
    const data = JSON.parse(fs.readFileSync('./travel-map/data/travel-data.json', 'utf8'));
    
    // 獲取所有國家
    const countries = Object.keys(data.countries);
    
    console.log('=== 當前數據統計 ===');
    console.log(`總共有 ${countries.length} 個國家/地區\n`);
    
    console.log('完整國家列表：');
    countries.sort().forEach((country, index) => {
        const postCount = data.countries[country].posts ? data.countries[country].posts.length : 0;
        console.log(`${index + 1}. ${country} (${postCount} 篇貼文)`);
    });
    
    // 檢查是否有問題數據
    console.log('\n=== 數據品質檢查 ===');
    const suspicious = [];
    const duplicates = [];
    
    countries.forEach(country => {
        // 檢查異常名稱
        if (country.length <= 2 || country.includes('undefined') || country === 'n' || country === 'A' || country === 'LA') {
            suspicious.push(country);
        }
        
    });
    
    // 檢查重複（不同大小寫）
    const lowerCaseMap = {};
    countries.forEach(country => {
        const lower = country.toLowerCase();
        if (lowerCaseMap[lower]) {
            if (!duplicates.includes(lower)) {
                duplicates.push(lower);
                console.log(`重複國家: ${lowerCaseMap[lower]} 和 ${country}`);
            }
        } else {
            lowerCaseMap[lower] = country;
        }
    });
    
    if (suspicious.length > 0) {
        console.log(`可疑的國家名稱: ${suspicious.join(', ')}`);
    }
    
    if (suspicious.length === 0 && duplicates.length === 0) {
        console.log('✅ 數據品質良好，沒有發現問題');
    }
    
    console.log(`\n網站顯示的數字應該是: ${countries.length}`);
    
} catch (error) {
    console.error('讀取數據時發生錯誤:', error.message);
}
