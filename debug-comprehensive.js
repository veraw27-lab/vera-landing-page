// Comprehensive debug script to understand location parsing issues
const { locationPatterns } = require('./scripts/location-patterns.js');

// Mock the Instagram class methods we need
class MockInstagramFetcher {
    static async getLocationMap() {
        // Simplified location map for testing
        return {
            'Bolivia': { city: '', country: 'Bolivia', coordinates: null, countryCoordinates: null },
            'La Paz': { city: 'La Paz', country: 'Bolivia', coordinates: null, countryCoordinates: null },
            'Malaysia': { city: '', country: 'Malaysia', coordinates: null, countryCoordinates: null },
            'Kapailai': { city: 'Kapailai', country: 'Malaysia', coordinates: null, countryCoordinates: null }
        };
    }

    normalizeCountryName(country) {
        return country.trim();
    }

    getCountryCoordinates(country) {
        return { lat: 0, lng: 0 };
    }

    async parseLocationMatch(match, type) {
        const locationMap = await MockInstagramFetcher.getLocationMap();
        
        console.log(`    Match details: type="${type}", match[0]="${match[0]}", match[1]="${match[1] || 'N/A'}", match[2]="${match[2] || 'N/A'}"`);
        
        // Handle specific pattern types first (before general location map lookup)
        if (type === 'country_dot_city') {
            const country = this.normalizeCountryName(match[1].trim());
            const city = match[2].trim();
            console.log(`    ✅ country_dot_city: country="${country}", city="${city}"`);
            return {
                city,
                country,
                coordinates: null,
                countryCoordinates: this.getCountryCoordinates(country)
            };
        }
        
        // Check if text matches any location map key
        const text = match[1] ? match[1].trim() : match[0].trim();
        for (const [key, location] of Object.entries(locationMap)) {
            if (text.toLowerCase().includes(key.toLowerCase())) {
                console.log(`    ✅ Found in locationMap: "${key}" -> ${JSON.stringify(location)}`);
                return location;
            }
        }
        
        if (type === 'country') {
            const country = this.normalizeCountryName(text);
            console.log(`    ✅ country: "${country}"`);
            return {
                city: '',
                country,
                coordinates: null,
                countryCoordinates: this.getCountryCoordinates(country)
            };
        }
        
        console.log(`    ❌ No handler for type "${type}"`);
        return {
            city: text,
            country: null,
            coordinates: null,
            countryCoordinates: null
        };
    }

    async extractLocationFromCaption(caption) {
        if (!caption) return null;
        
        for (const pattern of locationPatterns) {
            const match = caption.match(pattern.regex);
            if (match) {
                console.log(`  🎯 Pattern matched: ${pattern.type}`);
                return await this.parseLocationMatch(match, pattern.type);
            }
        }
        return null;
    }
}

// Test problematic captions
const testCaptions = [
    {
        name: "Bolivia • La Paz",
        caption: "Bolivia • La Paz\n玻利維亞 • 首都\n.\n.\n拍完這張照片的下一秒\n開始下大雨夾雜著\n這個氣候啊⋯\n.\n.\nBolivia 的簽證是我辦過最隨性的一個\n由於在美國沒有重新拍頭貼\n我用手機翻拍了張以前三四年前拍的後直接上傳簽證系統",
        expected: { city: "La Paz", country: "Bolivia" }
    },
    {
        name: "Malaysia • Kapailai",
        caption: "Malaysia • Kapailai \n馬來西亞 • 卡帕來\n.\n.\n有人說睡覺的時候\n腦袋會重組一次今天發生的事情\n把該記憶的東西放到深層記憶裡\n該忘記的東西清掉\n關於這點我感同身受\n.\n.\n我很常會有意識感受到\n在睡覺時候想事情",
        expected: { city: "Kapailai", country: "Malaysia" }
    }
];

async function testLocationExtraction() {
    console.log('🔍 Comprehensive Location Extraction Test\n');
    
    const fetcher = new MockInstagramFetcher();
    
    for (const testCase of testCaptions) {
        console.log(`=== ${testCase.name} ===`);
        console.log(`Caption start: "${testCase.caption.substring(0, 50)}..."`);
        console.log(`Expected: ${JSON.stringify(testCase.expected)}`);
        
        const result = await fetcher.extractLocationFromCaption(testCase.caption);
        console.log(`Result: ${JSON.stringify(result)}`);
        
        if (result) {
            const cityMatch = result.city === testCase.expected.city;
            const countryMatch = result.country === testCase.expected.country;
            console.log(`✅ City: ${cityMatch ? 'PASS' : 'FAIL'} (got "${result.city}", expected "${testCase.expected.city}")`);
            console.log(`✅ Country: ${countryMatch ? 'PASS' : 'FAIL'} (got "${result.country}", expected "${testCase.expected.country}")`);
        } else {
            console.log(`❌ No location extracted`);
        }
        console.log('');
    }
}

testLocationExtraction().catch(console.error);
