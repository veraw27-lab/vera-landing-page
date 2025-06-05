// Test the improved location extraction system
const InstagramGraphAPIFetcher = require('./scripts/fetch-instagram-data.js');

async function testImprovedLocationExtraction() {
    console.log('🧪 Testing Improved Location Extraction System\n');
    
    // Create a test instance without requiring real API credentials
    class TestFetcher extends InstagramGraphAPIFetcher {
        constructor() {
            // Skip parent constructor to avoid environment variable requirement
            this.accessToken = 'test-token';
            this.baseURL = 'https://graph.instagram.com';
            this.outputPath = 'travel-map/data/travel-data.json';
            this.delay = ms => Promise.resolve();
        }
    }
    
    const fetcher = new TestFetcher();
    
    const testCases = [
        {
            name: "Bolivia • La Paz (Should work with improved parsing)",
            caption: "Bolivia • La Paz\n玻利維亞 • 首都\n.\n.\n拍完這張照片的下一秒\n開始下大雨夾雜著\n這個氣候啊⋯",
            expected: { city: "La Paz", country: "Bolivia" }
        },
        {
            name: "Malaysia • Kapailai (Should work with improved parsing)", 
            caption: "Malaysia • Kapailai \n馬來西亞 • 卡帕來\n.\n.\n有人說睡覺的時候\n腦袋會重組一次今天發生的事情",
            expected: { city: "Kapailai", country: "Malaysia" }
        },
        {
            name: "Peru (Country only - should work with improved parsing)",
            caption: "Peru \n秘魯 .\n.\n是因為有出發的理由\n還是沒有留在這的理由\n而選擇出走？",
            expected: { city: "", country: "Peru" }
        },
        {
            name: "Holland • Amsterdam (Country normalization test)",
            caption: "Holland • Amsterdam\n荷蘭 • 阿姆斯特丹\nSomething about the city",
            expected: { city: "Amsterdam", country: "Netherlands" }
        },
        {
            name: "Seoul • Bukchon (City mapping test)",
            caption: "Seoul • Bukchon Hanok village\n首爾 • 北村韓屋村\nTraditional houses",
            expected: { city: "Bukchon Hanok village", country: "South Korea" }
        },
        {
            name: "GPS Marker test",
            caption: "📍 Kuala Lumpur, Malaysia\n馬來西亞 • 吉隆坡\nGPS location test",
            expected: { city: "Kuala Lumpur", country: "Malaysia" }
        },
        {
            name: "YiIlan • Taiwan (City-first test)",
            caption: "YiIlan • Sup\n宜蘭 • 立槳\nPaddleboarding in Taiwan",
            expected: { city: "YiIlan", country: "Taiwan" }
        }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const testCase of testCases) {
        console.log(`=== ${testCase.name} ===`);
        console.log(`Caption: "${testCase.caption.split('\n')[0]}..."`);
        
        try {
            const result = await fetcher.extractLocationFromCaption(testCase.caption);
            
            if (!result) {
                console.log(`❌ No location extracted`);
                failed++;
                continue;
            }
            
            const cityMatch = result.city === testCase.expected.city;
            const countryMatch = result.country === testCase.expected.country;
            
            console.log(`Expected: country="${testCase.expected.country}", city="${testCase.expected.city}"`);
            console.log(`Got:      country="${result.country}", city="${result.city}"`);
            console.log(`City: ${cityMatch ? '✅' : '❌'} Country: ${countryMatch ? '✅' : '❌'}`);
            
            if (cityMatch && countryMatch) {
                console.log(`🎉 PASS`);
                passed++;
            } else {
                console.log(`💥 FAIL`);
                failed++;
            }
            
        } catch (error) {
            console.log(`💥 ERROR: ${error.message}`);
            failed++;
        }
        
        console.log('');
    }
    
    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
        console.log('🎉 All tests passed! Improved location extraction is working correctly.');
        console.log('\n✅ Ready to re-process Instagram data with enhanced location parsing.');
        console.log('🚀 The GitHub Actions workflow will automatically run and update the data.');
    } else {
        console.log(`⚠️  ${failed} tests failed. Please review the improvements.`);
    }
}

testImprovedLocationExtraction().catch(console.error);
