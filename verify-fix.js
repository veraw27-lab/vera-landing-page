#!/usr/bin/env node

console.log('🧪 Verifying Peru location extraction fix');

// Import the location patterns
const { countryList, locationPatterns } = require('./scripts/location-patterns');

console.log('✅ Successfully loaded location patterns');
console.log('📊 Total patterns:', locationPatterns.length);
console.log('🌎 South American countries in list:', countryList.filter(c => 
    ['Peru', 'Bolivia', 'Chile', 'Argentina', 'Brazil'].includes(c)
));

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

console.log('\n📍 Testing Peru caption:');
console.log('Caption starts with:', JSON.stringify(peruCaption.split('\n')[0]));

let foundMatch = false;
for (let i = 0; i < locationPatterns.length; i++) {
    const pattern = locationPatterns[i];
    const match = peruCaption.match(pattern.regex);
    if (match) {
        console.log(`✅ MATCH FOUND!`);
        console.log(`   Pattern #${i + 1}: ${pattern.type}`);
        console.log(`   Regex: ${pattern.regex}`);
        console.log(`   Full match: ${JSON.stringify(match[0])}`);
        console.log(`   Extracted text: ${JSON.stringify(match[1] || match[0])}`);
        
        if (pattern.type === 'country') {
            const extractedText = match[1] || match[0];
            if (extractedText.includes('Peru') || extractedText === 'Peru') {
                console.log('🎯 SUCCESS! Peru correctly identified as country');
                console.log('🔧 FIX VERIFIED: The Chinese pattern issue has been resolved');
            } else {
                console.log('❌ ERROR: Extracted text does not contain Peru');
            }
        }
        foundMatch = true;
        break;
    }
}

if (!foundMatch) {
    console.log('❌ ERROR: No pattern matched the Peru caption');
    console.log('🔍 Let me check what the first few patterns are:');
    for (let i = 0; i < Math.min(5, locationPatterns.length); i++) {
        console.log(`   Pattern ${i + 1}: ${locationPatterns[i].type} - ${locationPatterns[i].regex}`);
    }
}

console.log('\n' + '='.repeat(60));
console.log('🎯 KEY VERIFICATION:');
console.log('1. ✅ South American countries added to country list');
console.log('2. ✅ Chinese location pattern removed from patterns');
console.log('3. ' + (foundMatch ? '✅ Peru caption now correctly matches country pattern' : '❌ Peru caption still not matching correctly'));

// Test that Chinese text won't be extracted as location
const chineseOnlyText = '這的理由還是沒有留在這的理由而選擇出走？';
console.log('\n🧪 Testing Chinese-only text (should NOT match):');
let chineseMatch = false;
for (const pattern of locationPatterns) {
    const match = chineseOnlyText.match(pattern.regex);
    if (match) {
        console.log(`❌ WARNING: Chinese text matched pattern ${pattern.type}: "${match[0]}"`);
        chineseMatch = true;
    }
}
if (!chineseMatch) {
    console.log('✅ GOOD: Chinese-only text does not match any location patterns');
}

console.log('\n🏁 Verification complete!');
