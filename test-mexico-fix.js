// Test script to verify Mexico location parsing fix
const { countryList, locationPatterns } = require('./scripts/location-patterns');

// Mock the Instagram class methods we need for testing
class MockInstagramFetcher {
    static async getLocationMap() {
        // Return a simplified location map for testing
        return {
            'Mexico': { city: '', country: 'Mexico', coordinates: null, countryCoordinates: { lat: 23.6345, lng: -102.5528 } },
            'Guanajuato': { city: 'Guanajuato', country: 'Mexico', coordinates: { lat: 21.0190, lng: -101.2574 }, countryCoordinates: { lat: 23.6345, lng: -102.5528 } },
            'Malaysia': { city: '', country: 'Malaysia', coordinates: null, countryCoordinates: { lat: 4.2105, lng: 101.9758 } },
            'Kapailai': { city: 'Kapailai', country: 'Malaysia', coordinates: { lat: 4.6298, lng: 118.9617 }, countryCoordinates: { lat: 4.2105, lng: 101.9758 } },
            'Peru': { city: '', country: 'Peru', coordinates: null, countryCoordinates: { lat: -9.1900, lng: -75.0152 } }
        };
    }

    normalizeCountryName(country) {
        return country.trim();
    }

    getCountryCoordinates(country) {
        const coords = {
            'Mexico': { lat: 23.6345, lng: -102.5528 },
            'Malaysia': { lat: 4.2105, lng: 101.9758 },
            'Peru': { lat: -9.1900, lng: -75.0152 }
        };
        return coords[country] || { lat: 0, lng: 0 };
    }

    extractFromBulletPattern(firstLine, secondLine) {
        const bulletPattern = /([A-Za-z\s]+)\s*•\s*([A-Za-z\s]+)/;
        const match = firstLine.match(bulletPattern);
        
        if (match) {
            const extractedCountry = match[1].trim();
            const extractedCity = match[2].trim();
            
            // Check if country is in the list
            if (countryList.includes(extractedCountry)) {
                return {
                    city: extractedCity,
                    country: extractedCountry,
                    coordinates: null,
                    countryCoordinates: this.getCountryCoordinates(extractedCountry)
                };
            }
        }
        
        return null;
    }

    extractFromCountryName(line) {
        for (const country of countryList) {
            if (line.toLowerCase().includes(country.toLowerCase())) {
                return {
                    city: '',
                    country: country,
                    coordinates: null,
                    countryCoordinates: this.getCountryCoordinates(country)
                };
            }
        }
        return null;
    }

    async extractLocationFromCaption(caption) {
        if (!caption) return null;
        
        const lines = caption.split('\n');
        const firstLine = (lines[0] || '').trim();
        const secondLine = (lines[1] || '').trim();
        
        console.log(`  🔍 Processing: "${firstLine}"`);
        
        // 1. Handle Country • City format (highest priority)
        const bulletResult = this.extractFromBulletPattern(firstLine, secondLine);
        if (bulletResult) {
            console.log(`  ✅ Bullet pattern found: ${JSON.stringify(bulletResult)}`);
            return bulletResult;
        }
        
        // 2. Handle direct country names
        const countryResult = this.extractFromCountryName(firstLine);
        if (countryResult) {
            console.log(`  ✅ Country name found: ${JSON.stringify(countryResult)}`);
            return countryResult;
        }
        
        console.log(`  ❌ No location found in: "${firstLine}"`);
        return null;
    }
}

// Test cases with actual problematic captions from the dataset
const testCases = [
    {
        name: "Mexico • Guanajuato (actual problematic post)",
        caption: "Mexico • Guanajuato (UNESCO)\n墨西哥 • 瓜納華托 （聯合國世界遺產）\n\n我不說 你知道我在墨西哥嗎？",
        expected: { country: "Mexico", city: "Guanajuato" }
    },
    {
        name: "Malaysia • Kapailai (test case)",
        caption: "Malaysia • Kapailai\n馬來西亞 • 卡帕萊",
        expected: { country: "Malaysia", city: "Kapailai" }
    },
    {
        name: "Plain Peru (should still work)",
        caption: "Peru\n秘魯\n\nAmazing trip to Peru!",
        expected: { country: "Peru", city: "" }
    }
];

async function runTests() {
    console.log('🧪 Testing Mexico and Malaysia location parsing fixes\n');
    
    const fetcher = new MockInstagramFetcher();
    let passedTests = 0;
    
    for (const testCase of testCases) {
        console.log(`=== ${testCase.name} ===`);
        
        const result = await fetcher.extractLocationFromCaption(testCase.caption);
        
        const cityMatch = result?.city === testCase.expected.city;
        const countryMatch = result?.country === testCase.expected.country;
        
        console.log(`Expected: country="${testCase.expected.country}", city="${testCase.expected.city}"`);
        console.log(`Got: country="${result?.country || 'null'}", city="${result?.city || 'null'}"`);
        console.log(`City: ${cityMatch ? '✅' : '❌'} Country: ${countryMatch ? '✅' : '❌'}`);
        
        if (cityMatch && countryMatch) {
            console.log('🎉 通過\n');
            passedTests++;
        } else {
            console.log('❌ 失敗\n');
        }
    }
    
    console.log(`📊 測試結果: ${passedTests}/${testCases.length} 通過`);
    
    // Check if Mexico is in country list
    console.log(`\n📋 Country List Check:`);
    console.log(`- Mexico in countryList: ${countryList.includes('Mexico')}`);
    console.log(`- Malaysia in countryList: ${countryList.includes('Malaysia')}`);
    console.log(`- Total countries: ${countryList.length}`);
}

runTests().catch(console.error);
