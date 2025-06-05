// Test the full location extraction pipeline
const InstagramGraphAPIFetcher = require('./fetch-instagram-data');

// Create a test instance without requiring real API credentials
class TestFetcher extends InstagramGraphAPIFetcher {
    constructor() {
        // Override the constructor to avoid API key requirement
        this.outputDir = './test-output';
    }
}

async function testLocationExtraction() {
    console.log('🧪 測試完整的地點提取流程');
    
    const fetcher = new TestFetcher();
    
    // Test the problematic Peru caption
    const peruCaption = `Peru 
秘魯 .
.
是因為有出發的理由
還是沒有留在這的理由
而選擇出走？
.
.
#verasworld #adventure #explore #travelphotography #traveltheworld #travelblogger #backpacking #peru #lifequotes #outdoors #trip  #tbt #memory #traveler`;

    console.log('\n📍 測試 Peru 貼文標題解析:');
    console.log('標題:', peruCaption.split('\n')[0] + '...');
    
    try {
        const location = await fetcher.extractLocationFromCaption(peruCaption);
        console.log('✅ 解析結果:', JSON.stringify(location, null, 2));
        
        if (location && location.country === 'Peru') {
            console.log('🎯 成功！Peru 貼文現在正確識別為 Peru 國家');
        } else {
            console.log('❌ 失敗！地點仍然解析錯誤');
        }
    } catch (error) {
        console.error('❌ 解析過程出錯:', error.message);
    }
    
    // Test other captions
    const testCases = [
        {
            name: 'Bolivia 貼文',
            caption: 'Bolivia • La Paz\n玻利維亞 • 首都\n.\n.\n拍完這張照片的下一秒'
        },
        {
            name: 'Japan 貼文',
            caption: 'Japan • Hokkaido \n日本 · 北海道\n.\n.\nI miss you.'
        }
    ];
    
    for (const test of testCases) {
        console.log(`\n📍 測試 ${test.name}:`);
        try {
            const location = await fetcher.extractLocationFromCaption(test.caption);
            console.log('解析結果:', JSON.stringify(location, null, 2));
        } catch (error) {
            console.error('解析錯誤:', error.message);
        }
    }
}

testLocationExtraction().catch(console.error);
