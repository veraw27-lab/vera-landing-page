// 修正 travel-data.json 中的墨西哥帖子分類問題
// 同時調整法國和美國的地理座標到本土

const fs = require('fs').promises;
const path = require('path');

async function fixTravelData() {
    console.log('🔧 開始修正 travel-data.json...\n');
    
    try {
        // 讀取當前數據
        const dataPath = path.join(__dirname, 'travel-map/data/travel-data.json');
        const data = JSON.parse(await fs.readFile(dataPath, 'utf-8'));
        
        console.log('📊 修正前數據統計：');
        console.log(`- 總國家數: ${Object.keys(data.countries).length}`);
        console.log(`- Peru 帖子數: ${data.countries.Peru?.posts?.length || 0}`);
        console.log(`- Mexico 帖子數: ${data.countries.Mexico?.posts?.length || 0}`);
        
        // 找出所有Mexico帖子（目前錯誤分類在Peru中）
        const mexicoPosts = [];
        if (data.countries.Peru && data.countries.Peru.posts) {
            data.countries.Peru.posts = data.countries.Peru.posts.filter(post => {
                if (post.caption && (
                    post.caption.includes('Mexico • Guanajuato') ||
                    post.caption.includes('墨西哥 • 瓜納華托') ||
                    (post.caption.includes('Mexico') && post.caption.includes('Guanajuato'))
                )) {
                    // 修正帖子的location信息
                    post.location = {
                        city: "Guanajuato",
                        country: "Mexico",
                        coordinates: { lat: 21.0190, lng: -101.2574 },
                        countryCoordinates: { lat: 23.6345, lng: -102.5528 }
                    };
                    mexicoPosts.push(post);
                    console.log(`✅ 找到墨西哥帖子: ${post.id}`);
                    return false; // 從Peru中移除
                }
                return true; // 保留在Peru中
            });
        }
        
        // 創建或更新Mexico國家條目
        if (mexicoPosts.length > 0) {
            data.countries.Mexico = {
                posts: mexicoPosts,
                cities: ["Guanajuato"],
                coordinates: { lat: 23.6345, lng: -102.5528 }
            };
            console.log(`🎉 創建Mexico國家條目，包含 ${mexicoPosts.length} 個帖子`);
        }
        
        // 更新cities集合
        if (!data.cities.includes('Guanajuato')) {
            data.cities.push('Guanajuato');
        }
        
        // 確保國家座標正確設置為本土
        if (data.countries.France) {
            data.countries.France.coordinates = { lat: 46.2276, lng: 2.2137 }; // 法國本土
            console.log('🇫🇷 修正法國座標為本土位置');
        }
        
        if (data.countries['United States']) {
            data.countries['United States'].coordinates = { lat: 37.0902, lng: -95.7129 }; // 美國本土
            console.log('🇺🇸 修正美國座標為本土位置');
        }
        
        // 更新統計信息
        data.totalCountries = Object.keys(data.countries).length;
        data.lastUpdated = new Date().toISOString();
        
        // 寫回文件
        await fs.writeFile(dataPath, JSON.stringify(data, null, 2), 'utf-8');
        
        console.log('\n📊 修正後數據統計：');
        console.log(`- 總國家數: ${Object.keys(data.countries).length}`);
        console.log(`- Peru 帖子數: ${data.countries.Peru?.posts?.length || 0}`);
        console.log(`- Mexico 帖子數: ${data.countries.Mexico?.posts?.length || 0}`);
        console.log(`- 總城市數: ${data.cities.length}`);
        
        console.log('\n✅ travel-data.json 修正完成！');
        
        // 更新summary.json
        const summaryPath = path.join(__dirname, 'travel-map/data/summary.json');
        const summary = JSON.parse(await fs.readFile(summaryPath, 'utf-8'));
        summary.totalCountries = Object.keys(data.countries).length;
        summary.totalCities = data.cities.length;
        summary.lastUpdated = new Date().toISOString();
        
        await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');
        console.log('✅ summary.json 也已更新！');
        
    } catch (error) {
        console.error('❌ 修正過程中出現錯誤:', error);
    }
}

if (require.main === module) {
    fixTravelData().catch(console.error);
}

module.exports = { fixTravelData };
