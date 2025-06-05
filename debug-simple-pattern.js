console.log('Testing problematic patterns...');

const { locationPatterns } = require('./scripts/location-patterns.js');

console.log('Loaded', locationPatterns.length, 'patterns');

const testText = "美國沒有重新拍頭貼";
console.log('Testing text:', testText);

for (let i = 0; i < locationPatterns.length; i++) {
    const pattern = locationPatterns[i];
    const match = testText.match(pattern.regex);
    if (match) {
        console.log(`Match found at pattern ${i}: ${pattern.type} -> "${match[0]}"`);
    }
}

console.log('Done.');
