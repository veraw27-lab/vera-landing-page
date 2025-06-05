// Test the specific captions from the travel data
const { countryList, locationPatterns } = require('./scripts/location-patterns.js');

// Location mapping for countries and cities  
const locationMap = {
    // Countries
    'Peru': { country: 'Peru', coordinates: [-9.19, -75.0152] },
    'Bolivia': { country: 'Bolivia', coordinates: [-16.2902, -63.5887] },
    'Malaysia': { country: 'Malaysia', coordinates: [4.2105, 101.9758] },
    
    // Cities
    'La Paz': { city: 'La Paz', country: 'Bolivia', coordinates: [-16.5000, -68.1193] },
    'Kapailai': { city: 'Kapailai', country: 'Malaysia', coordinates: [4.635, 118.628] },
    'Lima': { city: 'Lima', country: 'Peru', coordinates: [-12.0464, -77.0428] },
    'Cusco': { city: 'Cusco', country: 'Peru', coordinates: [-13.5319, -71.9675] },
    'Kuala Lumpur': { city: 'Kuala Lumpur', country: 'Malaysia', coordinates: [3.139, 101.6869] },
};

function parseLocationMatch(match, type, caption) {
    console.log(`🔍 Pattern matched: type="${type}", match="${match}"`);
    
    switch (type) {
        case 'country_dot_city':
            const parts = match.split(/\s*•\s*/);
            if (parts.length === 2) {
                const country = parts[0].trim();
                const city = parts[1].trim();
                console.log(`   Country•City pattern: "${country}" • "${city}"`);
                
                if (countryList.some(c => c.toLowerCase() === country.toLowerCase())) {
                    return { country, city, coordinates: getCoordinates(city, country) };
                }
            }
            break;
            
        case 'city_country':
            const cityCountryParts = match.split(',');
            if (cityCountryParts.length === 2) {
                const city = cityCountryParts[0].trim();
                const country = cityCountryParts[1].trim();
                return { country, city, coordinates: getCoordinates(city, country) };
            }
            break;
            
        case 'country':
            const country = match.trim();
            console.log(`   Country-only pattern: "${country}"`);
            return { country, city: null, coordinates: getCoordinates(null, country) };
    }
    
    return null;
}

function getCoordinates(city, country) {
    if (city && locationMap[city]) return locationMap[city].coordinates;
    if (country && locationMap[country]) return locationMap[country].coordinates;
    return null;
}

function extractLocationFromCaption(caption) {
    console.log(`\n📝 Processing caption: "${caption.substring(0, 100)}..."`);
    
    for (const pattern of locationPatterns) {
        const match = caption.match(pattern.regex);
        if (match) {
            console.log(`✅ Regex matched: ${pattern.regex} (type: ${pattern.type})`);
            console.log(`   Full match: "${match[0]}", Groups: [${match.slice(1).join(', ')}]`);
            
            // For country_dot_city pattern, pass the full match
            const matchToProcess = pattern.type === 'country_dot_city' ? match[0] : (match[1] || match[0]);
            
            const result = parseLocationMatch(matchToProcess, pattern.type, caption);
            if (result) {
                console.log(`🎯 Location extracted: ${JSON.stringify(result)}`);
                return result;
            }
        }
    }
    
    console.log("❌ No location found");
    return { country: null, city: null, coordinates: null };
}

// Test the actual problematic captions from travel-data.json
const problematicCaptions = [
    {
        name: "Peru post (BvopOIqFv8Q) - was extracting '這的理由'",  
        caption: "Peru \n秘魯 .\n.\n是因為有出發的理由\n還是沒有留在這的理由\n而選擇出走？\n.\n.\n#verasworld #adventure #explore #travelphotography #traveltheworld #travelblogger #backpacking #peru #lifequotes #outdoors #trip  #tbt #memory #traveler",
        currentWrong: "這的理由",
        expected: { country: "Peru", city: null }
    },
    {
        name: "Bolivia • La Paz post (BveWGJgFRma) - was extracting 美國沒有重新拍頭貼", 
        caption: "Bolivia • La Paz\n玻利維亞 • 首都\n.\n.\n拍完這張照片的下一秒\n開始下大雨夾雜著\n這個氣候啊⋯\n.\n.\nBolivia 的簽證是我辦過最隨性的一個\n由於在美國沒有重新拍頭貼\n我用手機翻拍了張以前三四年前拍的後直接上傳簽證系統\n上傳的照片還是橫的  也沒有裁切超出的部分\n結果到秘魯的玻利維亞辦事處\n拿到了聽說有點麻煩的簽證\n上面的照片就是直接輸出 頭也是橫的呢 🤗🤗🤗\n我覺得南美洲的簽證最方便就是到當地辦理 \n秘魯不用簽證 很適合先當第一個停留點搞定其他國家的簽證💪💪\n.\n.\n#verasworld #travelphotography #travelblogger #backpacking #bolivia #lapaz #travelblogger #capital #travel #traveltheworld #traveltips #explore #adventure",
        currentWrong: "美國沒有重新拍頭貼",
        expected: { country: "Bolivia", city: "La Paz" }
    },
    {
        name: "Malaysia • Kapailai post - was extracting '睡覺時候想事情'",
        caption: "Malaysia • Kapailai \n馬來西亞 • 卡帕來\n.\n.\n有人說睡覺的時候\n腦袋會重組一次今天發生的事情\n把該記憶的東西放到深層記憶裡\n該忘記的東西清掉\n關於這點我感同身受\n.\n.\n我很常會有意識感受到\n在睡覺時候想事情\n想著想著\n問題就在夢中解開了\n前幾天在夢中\n又不小心解了一題\n你看\n人生很簡單的\n.\n.\n#verasworld #explore #malaysia #kapalai #travelphotography #sipadan #travelblogger #空拍",
        currentWrong: "睡覺時候想事情", 
        expected: { country: "Malaysia", city: "Kapailai" }
    }
];

console.log("🔍 Testing ACTUAL Problematic Captions from travel-data.json\n");
console.log("=" + "=".repeat(60));

problematicCaptions.forEach((test, index) => {
    console.log(`\n${index + 1}. ${test.name}`);
    console.log(`❌ Currently wrong: "${test.currentWrong}"`);
    console.log("-".repeat(50));
    
    const result = extractLocationFromCaption(test.caption);
    
    console.log("Expected:", JSON.stringify(test.expected));
    console.log("Got:     ", JSON.stringify(result));
    
    const matches = (
        result.country === test.expected.country &&
        result.city === test.expected.city
    );
    
    console.log(matches ? "✅ FIXED!" : "❌ Still broken");
});

console.log("\n" + "=".repeat(60));
console.log("🎯 Our fixes should resolve all these location parsing issues!");
