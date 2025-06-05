// 診斷為什麼 Mexico 和 Malaysia 帖子沒有被正確解析

const InstagramGraphAPIFetcher = require('./scripts/fetch-instagram-data.js');

async function debugMissingCountries() {
    console.log('🔍 調試缺失的國家帖子\n');
    
    // 設置環境變量以避免錯誤
    process.env.INSTAGRAM_ACCESS_TOKEN = 'test-token';
    const fetcher = new InstagramGraphAPIFetcher();
    delete process.env.INSTAGRAM_ACCESS_TOKEN;
    
    const testCases = [
        {
            name: "Mexico • Guanajuato 帖子",
            caption: "Mexico • Guanajuato (UNESCO)\n墨西哥 • 瓜納華托 （聯合國世界遺產）\n\n我不說 你知道我在墨西哥嗎？",
            expected: { country: "Mexico", city: "Guanajuato" }
        },
        {
            name: "Malaysia • Kapailai 帖子（假設的caption）",
            caption: "Malaysia • Kapailai \n馬來西亞 • 卡帕來\n.\n.\n有人說睡覺的時候\n腦袋會重組一次今天發生的事情",
            expected: { country: "Malaysia", city: "Kapailai" }
        },
        {
            name: "純 Mexico 文字",
            caption: "Mexico\n墨西哥\n.\nAmazing trip",
            expected: { country: "Mexico", city: "" }
        },
        {
            name: "純 Malaysia 文字",
            caption: "Malaysia\n馬來西亞\n.\nBeautiful country",
            expected: { country: "Malaysia", city: "" }
        }
    ];
    
    console.log('🧪 測試位置解析:\n');
    
    for (const testCase of testCases) {
        console.log(`=== ${testCase.name} ===`);
        console.log(`Caption: "${testCase.caption.split('\n')[0]}..."`);
        
        try {
            const result = await fetcher.extractLocationFromCaption(testCase.caption);
            
            if (!result) {
                console.log(`❌ 沒有提取到位置信息`);
                console.log(`預期: country="${testCase.expected.country}", city="${testCase.expected.city}"`);
            } else {
                const cityMatch = result.city === testCase.expected.city;
                const countryMatch = result.country === testCase.expected.country;
                
                console.log(`預期: country="${testCase.expected.country}", city="${testCase.expected.city}"`);
                console.log(`得到: country="${result.country}", city="${result.city}"`);
                console.log(`City: ${cityMatch ? '✅' : '❌'} Country: ${countryMatch ? '✅' : '❌'}`);
                
                if (cityMatch && countryMatch) {
                    console.log(`🎉 通過`);
                } else {
                    console.log(`💥 失敗`);
                    
                    // 額外調試信息
                    console.log('🔍 調試步驟:');
                    const lines = testCase.caption.split('\n');
                    const firstLine = (lines[0] || '').trim();
                    const secondLine = (lines[1] || '').trim();
                    
                    console.log(`  - 第一行: "${firstLine}"`);
                    console.log(`  - 第二行: "${secondLine}"`);
                    
                    // 測試各個提取方法
                    console.log(`  - GPS 提取:`, await fetcher.extractFromGPS(firstLine));
                    console.log(`  - Bullet 提取:`, await fetcher.extractFromBulletPattern(firstLine, secondLine));
                    console.log(`  - City-First 提取:`, await fetcher.extractFromCityFirst(firstLine, secondLine));
                    console.log(`  - Country 提取:`, await fetcher.extractFromCountryName(firstLine));
                }
            }
            
        } catch (error) {
            console.log(`💥 錯誤: ${error.message}`);
        }
        
        console.log('');
    }
    
    // 檢查 countryList 是否包含這些國家
    const { countryList } = require('./scripts/location-patterns.js');
    console.log('📋 檢查 countryList:');
    console.log(`- Mexico 在列表中: ${countryList.includes('Mexico')}`);
    console.log(`- Malaysia 在列表中: ${countryList.includes('Malaysia')}`);
    console.log(`- 總國家數: ${countryList.length}`);
    console.log(`- 南美國家:`, countryList.filter(c => ['Peru', 'Bolivia', 'Mexico', 'Brazil', 'Argentina'].includes(c)));
    console.log(`- 亞洲國家:`, countryList.filter(c => ['Malaysia', 'Singapore', 'Thailand', 'Philippines'].includes(c)));
}

if (require.main === module) {
    debugMissingCountries().catch(console.error);
}

module.exports = { debugMissingCountries };
