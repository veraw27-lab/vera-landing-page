// Test script to verify Peru location extraction fix
const { countryList, locationPatterns } = require('./location-patterns');

// Simulate the extractLocationFromCaption function
function testLocationExtraction(caption) {
    console.log(`\n測試標題: "${caption}"`);
    console.log("=".repeat(50));
    
    for (let i = 0; i < locationPatterns.length; i++) {
        const pattern = locationPatterns[i];
        const match = caption.match(pattern.regex);
        if (match) {
            console.log(`✅ 匹配成功! Pattern #${i + 1} (${pattern.type})`);
            console.log(`   正則: ${pattern.regex}`);
            console.log(`   匹配結果: ${JSON.stringify(match)}`);
            console.log(`   提取的文字: "${match[1] || match[0]}"`);
            return { match, pattern, index: i + 1 };
        }
    }
    console.log("❌ 沒有匹配到任何模式");
    return null;
}

// Test cases
const testCases = [
    // Original Peru post caption that was causing issues
    "Peru \n秘魯 .\n.\n是因為有出發的理由\n還是沒有留在這的理由\n而選擇出走？\n.\n.\n#verasworld #adventure #explore #travelphotography #traveltheworld #travelblogger #backpacking #peru #lifequotes #outdoors #trip  #tbt #memory #traveler",
    
    // Test other countries
    "Japan • Hokkaido \n日本 · 北海道\n.\n.\nI miss you. A lot of you.",
    
    // Test city, country format
    "Tokyo, Japan\nGreat trip!",
    
    // Test Bolivia post
    "Bolivia • La Paz\n玻利維亞 • 首都\n.\n.\n拍完這張照片的下一秒",
    
    // Test simple country name
    "France",
    
    // Test country with dot notation
    "Nepal • Kathmandu",
    
    // Test hashtag country (should still be detected)
    "Amazing trip #peru #travel"
];

console.log("🧪 測試地點提取功能（移除中文模式後）");
console.log("國家清單包含的南美國家:", countryList.filter(c => ['Peru', 'Bolivia', 'Chile', 'Argentina', 'Brazil'].includes(c)));

testCases.forEach((caption, index) => {
    console.log(`\n📍 測試案例 ${index + 1}:`);
    testLocationExtraction(caption);
});

console.log("\n" + "=".repeat(70));
console.log("🎯 重點檢查：Peru 標題是否正確識別為 Peru 國家而不是中文內容");
