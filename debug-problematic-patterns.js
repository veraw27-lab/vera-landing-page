// Test script to identify what patterns match problematic text
const { locationPatterns } = require('./scripts/location-patterns.js');

const problematicTexts = [
    "美國沒有重新拍頭貼",
    "睡覺時候想事情",
    "這的理由",
    "由於在美國沒有重新拍頭貼",
    "在睡覺時候想事情"
];

console.log('Testing problematic Chinese text against all patterns:\n');

problematicTexts.forEach((text, index) => {
    console.log(`=== Text ${index + 1}: "${text}" ===`);
    
    let foundMatch = false;
    locationPatterns.forEach((pattern, patternIndex) => {
        const match = text.match(pattern.regex);
        if (match) {
            console.log(`  Pattern ${patternIndex} (${pattern.type}): "${match[1] || match[0]}"`);
            foundMatch = true;
        }
    });
    
    if (!foundMatch) {
        console.log(`  ✅ No patterns match this text`);
    }
    console.log('');
});

// Also test the full captions to see what's happening
const fullCaptions = [
    "Bolivia • La Paz\n玻利維亞 • 首都\n.\n.\n拍完這張照片的下一秒\n開始下大雨夾雜著\n這個氣候啊⋯\n.\n.\nBolivia 的簽證是我辦過最隨性的一個\n由於在美國沒有重新拍頭貼",
    "Malaysia • Kapailai \n馬來西亞 • 卡帕來\n.\n.\n有人說睡覺的時候\n腦袋會重組一次今天發生的事情\n把該記憶的東西放到深層記憶裡\n該忘記的東西清掉\n關於這點我感同身受\n.\n.\n我很常會有意識感受到\n在睡覺時候想事情"
];

console.log('\n🔍 Testing full captions to understand incorrect parsing:\n');

fullCaptions.forEach((caption, index) => {
    console.log(`=== Caption ${index + 1} ===`);
    console.log(`Start: "${caption.substring(0, 60)}..."`);
    
    locationPatterns.forEach((pattern, patternIndex) => {
        const match = caption.match(pattern.regex);
        if (match) {
            console.log(`  Pattern ${patternIndex} (${pattern.type}): full="${match[0]}", group1="${match[1] || 'N/A'}", group2="${match[2] || 'N/A'}"`);
        }
    });
    console.log('');
});
