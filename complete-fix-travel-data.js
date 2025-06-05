// 完整修正 travel-data.json 中重複的墨西哥帖子問題

const fs = require('fs').promises;
const path = require('path');

async function completeFixTravelData() {
    console.log('🔧 開始完整修正 travel-data.json...\n');
    
    try {
        // 讀取當前數據
        const dataPath = path.join(__dirname, 'travel-map/data/travel-data.json');
        const data = JSON.parse(await fs.readFile(dataPath, 'utf-8'));
        
        console.log('📊 修正前數據統計：');
        console.log(`- 總國家數: ${Object.keys(data.countries).length}`);
        console.log(`- Peru 帖子數: ${data.countries.Peru?.posts?.length || 0}`);
        console.log(`- Mexico 帖子數: ${data.countries.Mexico?.posts?.length || 0}`);
        
        // 找出所有Mexico帖子（在Peru和posts兩個地方）
        const mexicoPostIds = new Set();
        
        // 1. 從Peru國家中移除Mexico帖子
        if (data.countries.Peru && data.countries.Peru.posts) {
            data.countries.Peru.posts = data.countries.Peru.posts.filter(post => {
                if (post.caption && (
                    post.caption.includes('Mexico • Guanajuato') ||
                    post.caption.includes('墨西哥 • 瓜納華托')
                )) {
                    mexicoPostIds.add(post.id);
                    console.log(`❌ 從Peru中移除墨西哥帖子: ${post.id}`);
                    return false; // 從Peru中移除
                }
                return true; // 保留在Peru中
            });
        }
        
        // 2. 從posts陣列中找出Mexico帖子並修正
        if (data.posts && Array.isArray(data.posts)) {
            data.posts.forEach(post => {
                if (post.caption && (
                    post.caption.includes('Mexico • Guanajuato') ||
                    post.caption.includes('墨西哥 • 瓜納華托')
                )) {
                    // 修正帖子的location信息
                    post.location = {
                        city: "Guanajuato",
                        country: "Mexico",
                        coordinates: { lat: 21.0190, lng: -101.2574 },
                        countryCoordinates: { lat: 23.6345, lng: -102.5528 }
                    };
                    mexicoPostIds.add(post.id);
                    console.log(`✅ 修正posts中的墨西哥帖子: ${post.id}`);
                }
            });
        }
        
        // 3. 確保Mexico國家條目包含所有Mexico帖子
        const mexicoPosts = [];
        if (data.countries.Mexico && data.countries.Mexico.posts) {
            mexicoPosts.push(...data.countries.Mexico.posts);
        }
        
        // 從posts中找出Mexico帖子補充到Mexico國家
        if (data.posts && Array.isArray(data.posts)) {
            data.posts.forEach(post => {
                if (post.location && post.location.country === "Mexico") {
                    // 檢查是否已經在Mexico國家中
                    const alreadyExists = mexicoPosts.some(mp => mp.id === post.id);
                    if (!alreadyExists) {
                        mexicoPosts.push(post);
                        console.log(`➕ 添加墨西哥帖子到Mexico國家: ${post.id}`);
                    }
                }
            });
        }
        
        // 更新Mexico國家條目
        data.countries.Mexico = {
            posts: mexicoPosts,
            cities: ["Guanajuato"],
            coordinates: { lat: 23.6345, lng: -102.5528 }
        };
        
        // 更新cities集合
        if (!data.cities.includes('Guanajuato')) {
            data.cities.push('Guanajuato');
        }
        
        // 確保國家座標正確設置為本土
        if (data.countries.France) {
            data.countries.France.coordinates = { lat: 46.2276, lng: 2.2137 }; // 法國本土
            console.log('🇫🇷 確認法國座標為本土位置');
        }
        
        if (data.countries['United States']) {
            data.countries['United States'].coordinates = { lat: 37.0902, lng: -95.7129 }; // 美國本土
            console.log('🇺🇸 確認美國座標為本土位置');
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
        console.log(`- 發現的墨西哥帖子ID: ${Array.from(mexicoPostIds).join(', ')}`);
        
        console.log('\n✅ travel-data.json 完整修正完成！');
        
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
    completeFixTravelData().catch(console.error);
}

module.exports = { completeFixTravelData };
