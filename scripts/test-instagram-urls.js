// 測試 Instagram URL 有效性
const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

async function testInstagramUrls() {
    try {
        const dataPath = path.join(__dirname, '../travel-map/data/travel-data.json');
        const data = JSON.parse(await fs.readFile(dataPath, 'utf8'));
        
        console.log('🔍 測試 Instagram 圖片 URL 有效性...');
        
        let validCount = 0;
        let invalidCount = 0;
        let testCount = 0;
        const maxTests = 10; // 只測試前 10 個 URL
        
        for (const [countryName, countryData] of Object.entries(data.countries)) {
            if (testCount >= maxTests) break;
            
            for (const post of countryData.posts) {
                if (testCount >= maxTests) break;
                testCount++;
                
                const url = post.mediaUrl;
                console.log(`\n📷 測試 ${countryName} - Post ${post.id}`);
                console.log(`URL: ${url.substring(0, 80)}...`);
                
                try {
                    const response = await fetch(url, { method: 'HEAD', timeout: 10000 });
                    if (response.ok) {
                        console.log(`✅ 有效 (${response.status})`);
                        validCount++;
                    } else {
                        console.log(`❌ 無效 (${response.status})`);
                        invalidCount++;
                    }
                } catch (error) {
                    console.log(`❌ 錯誤: ${error.message}`);
                    invalidCount++;
                }
                
                // 避免過快請求
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        
        console.log(`\n📊 測試結果:`);
        console.log(`✅ 有效 URL: ${validCount}`);
        console.log(`❌ 無效 URL: ${invalidCount}`);
        console.log(`📋 總測試數: ${testCount}`);
        
        if (invalidCount > validCount) {
            console.log('\n⚠️ 大部分 URL 已過期，建議重新獲取 Instagram 數據');
            return false;
        } else {
            console.log('\n✅ 大部分 URL 仍然有效');
            return true;
        }
        
    } catch (error) {
        console.error('❌ 測試失敗:', error.message);
        return false;
    }
}

if (require.main === module) {
    testInstagramUrls().then(isValid => {
        process.exit(isValid ? 0 : 1);
    });
}

module.exports = testInstagramUrls;
