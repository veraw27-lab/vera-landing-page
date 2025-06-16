const fs = require('fs');

// 讀取 travel-data.json 文件
const data = JSON.parse(fs.readFileSync('/workspaces/vera-landing-page/travel-map/data/travel-data.json', 'utf8'));

console.log('=== 開始清理數據 ===\n');

// 定義需要合併或修正的映射關係
const countryMapping = {
    'taiwan': 'Taiwan',
    'peru': 'Peru', 
    'belgium': 'Belgium',
    'US': 'United States',
    'Philippine': 'Philippines',
    'Macus': 'Macau', // 可能是打字錯誤
    'xico': 'Mexico', // 可能是截斷錯誤
};

// 需要刪除的無效條目
const invalidEntries = ['n', 'A', 'LA', 'Life', 'Tomorrowland'];

// 地區到國家的映射
const regionToCountry = {
    'Toscana': 'Italy',
    'Provence': 'France'
};

let cleanedData = { countries: {} };
let mergeLog = [];
let removeLog = [];

// 處理每個國家/地區
Object.keys(data.countries).forEach(countryName => {
    const countryData = data.countries[countryName];
    
    // 檢查是否需要刪除
    if (invalidEntries.includes(countryName)) {
        removeLog.push(`刪除無效條目: ${countryName} (${countryData.posts?.length || 0} 篇貼文)`);
        return;
    }
    
    // 檢查是否需要映射到其他國家
    let targetCountry = countryName;
    
    if (countryMapping[countryName]) {
        targetCountry = countryMapping[countryName];
        mergeLog.push(`合併 ${countryName} → ${targetCountry}`);
    } else if (regionToCountry[countryName]) {
        targetCountry = regionToCountry[countryName];
        mergeLog.push(`地區合併 ${countryName} → ${targetCountry}`);
    }
    
    // 如果目標國家還不存在，創建它
    if (!cleanedData.countries[targetCountry]) {
        cleanedData.countries[targetCountry] = {
            name: targetCountry,
            posts: []
        };
    }
    
    // 合併貼文數據
    if (countryData.posts && Array.isArray(countryData.posts)) {
        cleanedData.countries[targetCountry].posts.push(...countryData.posts);
    }
});

// 顯示處理日誌
console.log('=== 合併操作 ===');
mergeLog.forEach(log => console.log(log));

console.log('\n=== 刪除操作 ===');
removeLog.forEach(log => console.log(log));

// 統計清理後的結果
const cleanedCountries = Object.keys(cleanedData.countries);
console.log('\n=== 清理後統計 ===');
console.log(`清理前: 42 個條目`);
console.log(`清理後: ${cleanedCountries.length} 個國家`);

console.log('\n清理後的國家列表：');
cleanedCountries
    .sort()
    .forEach((country, index) => {
        const postCount = cleanedData.countries[country].posts.length;
        console.log(`${index + 1}. ${country} (${postCount} 篇貼文)`);
    });

// 創建備份
const backupPath = '/workspaces/vera-landing-page/travel-map/data/travel-data-backup.json';
fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
console.log(`\n原始數據已備份到: ${backupPath}`);

// 寫入清理後的數據
const outputPath = '/workspaces/vera-landing-page/travel-map/data/travel-data.json';
fs.writeFileSync(outputPath, JSON.stringify(cleanedData, null, 2));
console.log(`清理後的數據已保存到: ${outputPath}`);

console.log('\n=== 數據清理完成 ===');
