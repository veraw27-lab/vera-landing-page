// Test only the location extraction methods without class inheritance
const fs = require('fs');

// Import the main class
const InstagramGraphAPIFetcher = require('./scripts/fetch-instagram-data.js');

// Create a minimal test instance
function createMockFetcher() {
    // Read the actual class file and extract just the methods we need
    const fetcher = new InstagramGraphAPIFetcher();
    
    // Override the constructor check by setting required properties
    fetcher.accessToken = 'test-token';
    fetcher.baseURL = 'test';
    fetcher.outputPath = 'test';
    
    return fetcher;
}

async function testLocationExtraction() {
    console.log('🧪 Testing Location Extraction Methods\n');
    
    let fetcher;
    try {
        // Try to create instance by temporarily setting env var
        process.env.INSTAGRAM_ACCESS_TOKEN = 'test-token';
        fetcher = new InstagramGraphAPIFetcher();
        delete process.env.INSTAGRAM_ACCESS_TOKEN;
    } catch (error) {
        console.log('❌ Could not create fetcher instance:', error.message);
        return;
    }
    
    const testCases = [
        {
            name: "Bolivia • La Paz (Priority: Bullet Pattern)",
            caption: "Bolivia • La Paz\n玻利維亞 • 首都\n.\n.\n拍完這張照片的下一秒\n開始下大雨夾雜著\n這個氣候啊⋯",
            expected: { city: "La Paz", country: "Bolivia" }
        },
        {
            name: "Malaysia • Kapailai (Priority: Bullet Pattern + City Mapping)", 
            caption: "Malaysia • Kapailai \n馬來西亞 • 卡帕來\n.\n.\n有人說睡覺的時候\n腦袋會重組一次今天發生的事情",
            expected: { city: "Kapailai", country: "Malaysia" }
        },
        {
            name: "Peru (Priority: Country Name Direct)",
            caption: "Peru \n秘魯 .\n.\n是因為有出發的理由\n還是沒有留在這的理由\n而選擇出走？",
            expected: { city: "", country: "Peru" }
        },
        {
            name: "📍 Kuala Lumpur, Malaysia (Priority: GPS Marker - Highest)",
            caption: "📍 Kuala Lumpur, Malaysia\n馬來西亞 • 吉隆坡\nGPS location test",
            expected: { city: "Kuala Lumpur", country: "Malaysia" }
        },
        {
            name: "Holland • Amsterdam (Country Normalization)",
            caption: "Holland • Amsterdam\n荷蘭 • 阿姆斯特丹\nSomething about the city",
            expected: { city: "Amsterdam", country: "Netherlands" }
        },
        {
            name: "Seoul (City-to-Country Mapping)",
            caption: "Seoul\n서울\nSouth Korea capital",
            expected: { city: "Seoul", country: "South Korea" }
        },
        {
            name: "YiIlan • Sup (City-First Pattern)",
            caption: "YiIlan • Sup\n宜蘭 • 立槳\nPaddleboarding in Taiwan",
            expected: { city: "YiIlan", country: "Taiwan" }
        },
        {
            name: "Korean cuisine (Country Name Normalization)",
            caption: "Korean cuisine\n한국 요리\nDelicious food",
            expected: { city: "", country: "South Korea" }
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
                console.log(`Expected: country="${testCase.expected.country}", city="${testCase.expected.city}"`);
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
            console.log(`Expected: country="${testCase.expected.country}", city="${testCase.expected.city}"`);
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
    
    return { passed, failed };
}

if (require.main === module) {
    testLocationExtraction().catch(console.error);
}

module.exports = { testLocationExtraction };
