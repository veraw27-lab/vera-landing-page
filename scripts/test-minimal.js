const { countryList, locationPatterns } = require('./location-patterns');

console.log('Testing Peru extraction...');
const caption = 'Peru \n秘魯 .\n.\n是因為有出發的理由';
console.log('Caption starts with:', caption.split('\n')[0]);

const countryPattern = locationPatterns.find(p => p.type === 'country');
if (countryPattern) {
    console.log('Country pattern found:', countryPattern.type);
    const match = caption.match(countryPattern.regex);
    if (match) {
        console.log('✅ Match:', match[1] || match[0]);
    } else {
        console.log('❌ No match');
    }
}
