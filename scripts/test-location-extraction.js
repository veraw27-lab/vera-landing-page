// Test script for location extraction logic
const { locationPatterns } = require('./location-patterns');

// Test captions that were problematic
const testCaptions = [
    {
        caption: "Peru \n秘魯 .\n.\n是因為有出發的理由\n還是沒有留在這的理由\n而選擇出走？\n.\n.\n#verasworld #adventure #explore #travelphotography #traveltheworld #travelblogger #backpacking #peru #lifequotes #outdoors #trip  #tbt #memory #traveler",
        expected: "Peru"
    },
    {
        caption: "Bolivia • La Paz\n玻利維亞 • 首都\n.\n.\n拍完這張照片的下一秒\n開始下大雨夾雜著\n這個氣候啊⋯\n.\n.\nBolivia 的簽證是我辦過最隨性的一個",
        expected: "Bolivia"
    },
    {
        caption: "Japan • Hokkaido \n日本 · 北海道\n.\n.\nI miss you. A lot of you.",
        expected: "Japan"
    }
];

function testLocationExtraction(caption) {
    console.log('\n=== Testing Caption ===');
    console.log(caption.substring(0, 100) + '...');
    console.log('\n--- Pattern Matches ---');
    
    for (const pattern of locationPatterns) {
        const match = caption.match(pattern.regex);
        if (match) {
            console.log(`✅ ${pattern.type}: "${match[0]}" -> extracted: "${match[1] || match[0]}"`);
            return {
                type: pattern.type,
                match: match[1] || match[0],
                fullMatch: match[0]
            };
        }
    }
    
    console.log('❌ No patterns matched');
    return null;
}

console.log('🧪 Testing Location Pattern Extraction\n');

testCaptions.forEach((test, index) => {
    console.log(`\n📍 Test ${index + 1}: Expected "${test.expected}"`);
    const result = testLocationExtraction(test.caption);
    
    if (result) {
        const success = result.match.toLowerCase().includes(test.expected.toLowerCase());
        console.log(`${success ? '✅ SUCCESS' : '❌ FAILED'}: Got "${result.match}" (${result.type})`);
    } else {
        console.log('❌ FAILED: No match found');
    }
    console.log('-'.repeat(50));
});

console.log('\n🔍 Pattern Priority Order:');
locationPatterns.forEach((pattern, index) => {
    console.log(`${index + 1}. ${pattern.type}: ${pattern.regex}`);
});
