// Check the actual characters in the captions
const testString = "Bolivia • La Paz";

console.log('Character analysis:');
for (let i = 0; i < testString.length; i++) {
    const char = testString[i];
    const code = char.charCodeAt(0);
    console.log(`Position ${i}: "${char}" (Unicode: U+${code.toString(16).toUpperCase().padStart(4, '0')})`);
}

console.log('\nTesting different bullet characters:');
const patterns = [
    { name: 'Japanese bullet ・', regex: /([A-Za-z ]+)・([A-Za-z ]+)/ },
    { name: 'Regular bullet •', regex: /([A-Za-z ]+)•([A-Za-z ]+)/ },
    { name: 'Both bullets', regex: /([A-Za-z ]+)[•・]([A-Za-z ]+)/ },
    { name: 'With spaces', regex: /([A-Za-z ]+)\s*[•・]\s*([A-Za-z ]+)/ }
];

patterns.forEach(pattern => {
    const match = testString.match(pattern.regex);
    console.log(`${pattern.name}: ${match ? `✅ "${match[1]}" | "${match[2]}"` : '❌ No match'}`);
});
