// Comprehensive test of the fixed location extraction
const InstagramGraphAPIFetcher = require('./scripts/fetch-instagram-data.js');

async function testLocationExtraction() {
    console.log('🧪 Testing Fixed Location Extraction\n');
    
    const fetcher = new InstagramGraphAPIFetcher();
    
    const testCases = [
        {
            name: "Bolivia • La Paz (Should work now)",
            caption: "Bolivia • La Paz\n玻利維亞 • 首都\n.\n.\n拍完這張照片的下一秒\n開始下大雨夾雜著\n這個氣候啊⋯\n.\n.\nBolivia 的簽證是我辦過最隨性的一個\n由於在美國沒有重新拍頭貼",
            expected: { city: "La Paz", country: "Bolivia" }
        },
        {
            name: "Malaysia • Kapailai (Should work now)", 
            caption: "Malaysia • Kapailai \n馬來西亞 • 卡帕來\n.\n.\n有人說睡覺的時候\n腦袋會重組一次今天發生的事情\n把該記憶的東西放到深層記憶裡\n該忘記的東西清掉\n關於這點我感同身受\n.\n.\n我很常會有意識感受到\n在睡覺時候想事情",
            expected: { city: "Kapailai", country: "Malaysia" }
        },
        {
            name: "Peru (Country only)",
            caption: "Peru \n秘魯 .\n.\n是因為有出發的理由\n還是沒有留在這的理由\n而選擇出走？",
            expected: { city: "", country: "Peru" }
        },
        {
            name: "Singapore • Marina Bay (New Asian country)",
            caption: "Singapore • Marina Bay\n新加坡 • 濱海灣\nSomething about the city",
            expected: { city: "Marina Bay", country: "Singapore" }
        },
        {
            name: "Philippines • Manila (New Asian country)", 
            caption: "Philippines • Manila\n菲律賓 • 馬尼拉\nSomething about the city",
            expected: { city: "Manila", country: "Philippines" }
        }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const testCase of testCases) {
        console.log(`=== ${testCase.name} ===`);
        
        try {
            const result = await fetcher.extractLocationFromCaption(testCase.caption);
            
            if (!result) {
                console.log(`❌ No location extracted`);
                failed++;
                continue;
            }
            
            const cityMatch = result.city === testCase.expected.city;
            const countryMatch = result.country === testCase.expected.country;
            
            console.log(`City: ${cityMatch ? '✅' : '❌'} (got "${result.city}", expected "${testCase.expected.city}")`);
            console.log(`Country: ${countryMatch ? '✅' : '❌'} (got "${result.country}", expected "${testCase.expected.country}")`);
            
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
        console.log('🎉 All tests passed! Location extraction is working correctly.');
    } else {
        console.log('❌ Some tests failed. Review the issues above.');
    }
}

testLocationExtraction().catch(console.error);
