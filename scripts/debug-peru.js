const testCaption = "Peru \n秘魯 .\n.\n是因為有出發的理由\n還是沒有留在這的理由\n而選擇出走？";

console.log("Testing Peru caption:");
console.log("Caption:", JSON.stringify(testCaption));
console.log();

// Test the specific patterns that should match
const countryList = ['Peru','Bolivia','Chile','Argentina','Brazil','Colombia','Venezuela','Ecuador','Uruguay','Paraguay','Guyana','Suriname','French Guiana'];

// Pattern 1: Start of line country detection
const startPattern = new RegExp(`^\\s*(${countryList.join('|')})\\s*`, 'i');
console.log("Start pattern:", startPattern);
console.log("Start pattern match:", testCaption.match(startPattern));

// Pattern 2: Word boundary country detection  
const boundaryPattern = new RegExp(`\\b(${countryList.join('|')})\\b`, 'i');
console.log("Boundary pattern:", boundaryPattern);
console.log("Boundary pattern match:", testCaption.match(boundaryPattern));

// Pattern 3: Chinese location pattern (the problematic one)
const chinesePattern = /在([^#@\n\r。，]+?)(?=[。，\s]*[#@\n\r]|$)/i;
console.log("Chinese pattern:", chinesePattern);
console.log("Chinese pattern match:", testCaption.match(chinesePattern));

console.log();
console.log("Caption analysis:");
console.log("- Starts with 'Peru':", testCaption.startsWith('Peru'));
console.log("- Contains Chinese '在':", testCaption.includes('在'));
console.log("- Chinese text part:", testCaption.match(/[\u4e00-\u9fff]+/g));
