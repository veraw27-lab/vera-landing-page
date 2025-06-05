// Test specific regex patterns
const { countryList } = require('./scripts/location-patterns.js');

const testStrings = [
    "Bolivia • La Paz",
    "Malaysia • Kapailai ",  // Note the space at the end
    "Peru • Lima"
];

// Test the country_dot_city pattern
const countryDotCityPattern = /([A-Za-z ]+)・([A-Za-z ]+)/;

console.log('Testing country_dot_city pattern:');
testStrings.forEach((str, index) => {
    console.log(`\nTest ${index + 1}: "${str}"`);
    const match = str.match(countryDotCityPattern);
    if (match) {
        console.log(`  ✅ Match found: full="${match[0]}", country="${match[1]}", city="${match[2]}"`);
    } else {
        console.log(`  ❌ No match`);
    }
});

// Test the country patterns
console.log('\n\nTesting country patterns:');
const countryPattern1 = new RegExp(`^\\s*(${countryList.join('|')})\\s*`, 'i');
const countryPattern2 = new RegExp(`\\b(${countryList.join('|')})\\b`, 'i');

testStrings.forEach((str, index) => {
    console.log(`\nTest ${index + 1}: "${str}"`);
    
    const match1 = str.match(countryPattern1);
    if (match1) {
        console.log(`  Pattern 1 (^\\s*): ✅ "${match1[1]}"`);
    } else {
        console.log(`  Pattern 1 (^\\s*): ❌ No match`);
    }
    
    const match2 = str.match(countryPattern2);
    if (match2) {
        console.log(`  Pattern 2 (\\b): ✅ "${match2[1]}"`);
    } else {
        console.log(`  Pattern 2 (\\b): ❌ No match`);
    }
});
