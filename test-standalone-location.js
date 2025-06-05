// Test just the location extraction function without Instagram API
const { locationPatterns } = require('./scripts/location-patterns.js');

// Mock the necessary functions for testing
class LocationTester {
    normalizeCountryName(country) {
        return country.trim();
    }

    getCountryCoordinates(country) {
        // Simple coordinates for testing
        const coords = {
            'Bolivia': { lat: -16.2902, lng: -63.5887 },
            'Malaysia': { lat: 4.2105, lng: 101.9758 },
            'Peru': { lat: -9.1900, lng: -75.0152 },
            'Singapore': { lat: 1.3521, lng: 103.8198 },
            'Philippines': { lat: 12.8797, lng: 121.7740 }
        };
        return coords[country] || { lat: 0, lng: 0 };
    }

    static async getLocationMap() {
        return {
            'Bolivia': { city: '', country: 'Bolivia', coordinates: null, countryCoordinates: null },
            'La Paz': { city: 'La Paz', country: 'Bolivia', coordinates: null, countryCoordinates: null },
            'Malaysia': { city: '', country: 'Malaysia', coordinates: null, countryCoordinates: null },
            'Kapailai': { city: 'Kapailai', country: 'Malaysia', coordinates: null, countryCoordinates: null },
            'Peru': { city: '', country: 'Peru', coordinates: null, countryCoordinates: null },
            'Singapore': { city: '', country: 'Singapore', coordinates: null, countryCoordinates: null },
            'Philippines': { city: '', country: 'Philippines', coordinates: null, countryCoordinates: null },
            'Manila': { city: 'Manila', country: 'Philippines', coordinates: null, countryCoordinates: null }
        };
    }

    async parseLocationMatch(match, type) {
        const locationMap = await LocationTester.getLocationMap();
        
        // Handle specific pattern types first (before general location map lookup)
        if (type === 'country_dot_city') {
            const country = this.normalizeCountryName(match[1].trim());
            const city = match[2].trim();
            return {
                city,
                country,
                coordinates: null,
                countryCoordinates: this.getCountryCoordinates(country)
            };
        }
        
        if (type === 'country') {
            const text = match[1] ? match[1].trim() : match[0].trim();
            const country = this.normalizeCountryName(text);
            return {
                city: '',
                country,
                coordinates: null,
                countryCoordinates: this.getCountryCoordinates(country)
            };
        }
        
        // General location map lookup
        const text = match[1] ? match[1].trim() : match[0].trim();
        for (const [key, location] of Object.entries(locationMap)) {
            if (text.toLowerCase().includes(key.toLowerCase())) {
                return location;
            }
        }
        
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
                return await this.parseLocationMatch(match, pattern.type);
            }
        }
        return null;
    }
}

async function testLocationExtraction() {
    console.log('🧪 Testing Fixed Location Extraction\n');
    
    const tester = new LocationTester();
    
    const testCases = [
        {
            name: "Bolivia • La Paz (Should work now)",
            caption: "Bolivia • La Paz\n玻利維亞 • 首都\n.\n.\n拍完這張照片的下一秒\n開始下大雨夾雜著\n這個氣候啊⋯",
            expected: { city: "La Paz", country: "Bolivia" }
        },
        {
            name: "Malaysia • Kapailai (Should work now)", 
            caption: "Malaysia • Kapailai \n馬來西亞 • 卡帕來\n.\n.\n有人說睡覺的時候\n腦袋會重組一次今天發生的事情",
            expected: { city: "Kapailai", country: "Malaysia" }
        },
        {
            name: "Peru (Country only)",
            caption: "Peru \n秘魯 .\n.\n是因為有出發的理由\n還是沒有留在這的理由\n而選擇出走？",
            expected: { city: "", country: "Peru" }
        },
        {
            name: "Singapore • Marina Bay (New Asian country)",
            caption: "Singapore • Marina Bay\n新加坡 • 濱海灣\nSomething about the city",
            expected: { city: "Marina Bay", country: "Singapore" }
        },
        {
            name: "Philippines • Manila (New Asian country)", 
            caption: "Philippines • Manila\n菲律賓 • 馬尼拉\nSomething about the city",
            expected: { city: "Manila", country: "Philippines" }
        }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const testCase of testCases) {
        console.log(`=== ${testCase.name} ===`);
        
        try {
            const result = await tester.extractLocationFromCaption(testCase.caption);
            
            if (!result) {
                console.log(`❌ No location extracted`);
                failed++;
                continue;
            }
            
            const cityMatch = result.city === testCase.expected.city;
            const countryMatch = result.country === testCase.expected.country;
            
            console.log(`City: ${cityMatch ? '✅' : '❌'} (got "${result.city}", expected "${testCase.expected.city}")`);
            console.log(`Country: ${countryMatch ? '✅' : '❌'} (got "${result.country}", expected "${testCase.expected.country}")`);
            
            if (cityMatch && countryMatch) {
                console.log(`🎉 PASS`);
                passed++;
            } else {
                console.log(`💥 FAIL`);
                failed++;
            }
            
        } catch (error) {
            console.log(`💥 ERROR: ${error.message}`);
            failed++;
        }
        
        console.log('');
    }
    
    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
        console.log('🎉 All tests passed! Location extraction is working correctly.');
        console.log('\n✅ Ready to re-process Instagram data with fixed location parsing.');
    } else {
        console.log('❌ Some tests failed. Review the issues above.');
    }
}

testLocationExtraction().catch(console.error);
