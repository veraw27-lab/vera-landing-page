// Debug script to identify problematic location patterns
const { locationPatterns } = require('./scripts/location-patterns.js');

// Test problematic captions
const testCaptions = [
    "Bolivia • La Paz\n玻利維亞 • 首都\n.\n.\n拍完這張照片的下一秒\n開始下大雨夾雜著\n這個氣候啊⋯\n.\n.\nBolivia 的簽證是我辦過最隨性的一個\n由於在美國沒有重新拍頭貼\n我用手機翻拍了張以前三四年前拍的後直接上傳簽證系統",
    "Malaysia • Kapailai \n馬來西亞 • 卡帕來\n.\n.\n有人說睡覺的時候\n腦袋會重組一次今天發生的事情\n把該記憶的東西放到深層記憶裡\n該忘記的東西清掉\n關於這點我感同身受\n.\n.\n我很常會有意識感受到\n在睡覺時候想事情"
];

console.log('Testing location patterns on problematic captions:\n');

testCaptions.forEach((caption, index) => {
    console.log(`=== Caption ${index + 1} ===`);
    console.log(`Caption: ${caption.substring(0, 100)}...`);
    console.log('Pattern matches:');
    
    locationPatterns.forEach((pattern, patternIndex) => {
        const match = caption.match(pattern.regex);
        if (match) {
            console.log(`  Pattern ${patternIndex} (${pattern.type}): "${match[1] || match[0]}"`);
        }
    });
    console.log('');
});
