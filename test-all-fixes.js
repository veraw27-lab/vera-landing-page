#!/usr/bin/env node
// Test all fixes and analyze remaining issues

const fs = require('fs');
const { countryList, locationPatterns } = require('./scripts/location-patterns');

async function testAllFixes() {
    console.log('🔧 TESTING ALL FIXES AND ANALYZING REMAINING ISSUES\n');
    
    try {
        // Load current data
        const travelData = JSON.parse(fs.readFileSync('./travel-map/data/travel-data.json', 'utf8'));
        
        console.log('📊 CURRENT DATA STATUS:');
        console.log(`- Total countries: ${Object.keys(travelData.countries).length}`);
        console.log(`- Countries: ${Object.keys(travelData.countries).sort().join(', ')}\n`);
        
        // Test 1: Malaysia status
        console.log('1️⃣ MALAYSIA STATUS:');
        if (travelData.countries.Malaysia) {
            console.log(`   ✅ Malaysia found with ${travelData.countries.Malaysia.posts.length} posts`);
            
            // Check for Kapailai specifically
            const kapailaiPosts = travelData.countries.Malaysia.posts.filter(post => 
                post.caption && (
                    post.caption.toLowerCase().includes('kapailai') ||
                    post.caption.toLowerCase().includes('卡帕萊')
                )
            );
            console.log(`   🏝️ Kapailai posts: ${kapailaiPosts.length}`);
        } else {
            console.log('   ❌ Malaysia not found');
            
            // Search for Malaysia mentions in all posts
            console.log('   🔍 Searching for Malaysia mentions...');
            let malaysiaMentions = 0;
            Object.keys(travelData.countries).forEach(country => {
                travelData.countries[country].posts.forEach(post => {
                    if (post.caption && (
                        post.caption.toLowerCase().includes('malaysia') ||
                        post.caption.toLowerCase().includes('馬來西亞') ||
                        post.caption.toLowerCase().includes('kapailai') ||
                        post.caption.toLowerCase().includes('卡帕萊') ||
                        post.caption.toLowerCase().includes('mabul') ||
                        post.caption.toLowerCase().includes('馬布') ||
                        post.caption.toLowerCase().includes('sipadan') ||
                        post.caption.toLowerCase().includes('詩巴丹')
                    )) {
                        malaysiaMentions++;
                        console.log(`      - Found Malaysia content in ${country}: ${post.permalink}`);
                        console.log(`        Caption: ${post.caption.substring(0, 100)}...`);
                    }
                });
            });
            console.log(`   📊 Total Malaysia mentions: ${malaysiaMentions}`);
        }
        
        // Test 2: UAE/Dubai status
        console.log('\n2️⃣ UAE/DUBAI STATUS:');
        const uaeVariations = ['UAE', 'United Arab Emirates', 'Dubai'];
        let uaeFound = false;
        
        uaeVariations.forEach(variation => {
            if (travelData.countries[variation]) {
                console.log(`   ✅ Found ${variation} with ${travelData.countries[variation].posts.length} posts`);
                uaeFound = true;
            }
        });
        
        if (!uaeFound) {
            console.log('   ❌ No UAE/Dubai countries found');
            
            // Search for UAE/Dubai mentions
            console.log('   🔍 Searching for UAE/Dubai mentions...');
            let uaeMentions = 0;
            Object.keys(travelData.countries).forEach(country => {
                travelData.countries[country].posts.forEach(post => {
                    if (post.caption && (
                        post.caption.toLowerCase().includes('dubai') ||
                        post.caption.toLowerCase().includes('杜拜') ||
                        post.caption.toLowerCase().includes('uae') ||
                        post.caption.toLowerCase().includes('emirates') ||
                        post.caption.toLowerCase().includes('abu dhabi') ||
                        post.caption.toLowerCase().includes('阿布達比')
                    )) {
                        uaeMentions++;
                        console.log(`      - Found UAE content in ${country}: ${post.permalink}`);
                        console.log(`        Caption: ${post.caption.substring(0, 100)}...`);
                    }
                });
            });
            console.log(`   📊 Total UAE mentions: ${uaeMentions}`);
        }
        
        // Test 3: Mexico/Cancun verification
        console.log('\n3️⃣ MEXICO/CANCUN VERIFICATION:');
        if (travelData.countries.Mexico) {
            console.log(`   ✅ Mexico found with ${travelData.countries.Mexico.posts.length} posts`);
            
            const cancunPosts = travelData.countries.Mexico.posts.filter(post => 
                post.caption && (
                    post.caption.toLowerCase().includes('cancun') ||
                    post.caption.toLowerCase().includes('坎昆')
                )
            );
            console.log(`   🏖️ Cancun posts: ${cancunPosts.length}`);
            
            // Check coordinates
            const coordPosts = travelData.countries.Mexico.posts.filter(post => 
                post.location && post.location.countryCoordinates
            );
            console.log(`   📍 Posts with country coordinates: ${coordPosts.length}/${travelData.countries.Mexico.posts.length}`);
            
            if (coordPosts.length > 0) {
                const sampleCoord = coordPosts[0].location.countryCoordinates;
                console.log(`   📍 Sample coordinates: ${JSON.stringify(sampleCoord)}`);
            }
        } else {
            console.log('   ❌ Mexico not found (this should not happen after our fixes!)');
        }
        
        // Test 4: France duplication check
        console.log('\n4️⃣ FRANCE DUPLICATION CHECK:');
        if (travelData.countries.France) {
            console.log(`   🇫🇷 France has ${travelData.countries.France.posts.length} posts`);
            
            let duplicatesFound = 0;
            Object.keys(travelData.countries).forEach(country => {
                if (country !== 'France') {
                    travelData.countries[country].posts.forEach(post => {
                        if (post.caption && (
                            post.caption.toLowerCase().includes('france') ||
                            post.caption.toLowerCase().includes('法國') ||
                            post.caption.toLowerCase().includes('paris') ||
                            post.caption.toLowerCase().includes('巴黎') ||
                            post.caption.toLowerCase().includes('strasbourg') ||
                            post.caption.toLowerCase().includes('provence') ||
                            post.caption.toLowerCase().includes('avignon')
                        )) {
                            duplicatesFound++;
                            console.log(`      ⚠️ France content in ${country}: ${post.permalink}`);
                        }
                    });
                }
            });
            console.log(`   📊 Potential duplicates found: ${duplicatesFound}`);
        }
        
        // Test 5: Coordinate mapping analysis
        console.log('\n5️⃣ COORDINATE MAPPING ANALYSIS:');
        Object.keys(travelData.countries).forEach(country => {
            const posts = travelData.countries[country].posts;
            const withCountryCoords = posts.filter(p => 
                p.location && p.location.countryCoordinates && 
                p.location.countryCoordinates.lat && p.location.countryCoordinates.lng
            );
            const withCityCoords = posts.filter(p => 
                p.location && p.location.coordinates && 
                p.location.coordinates.lat && p.location.coordinates.lng
            );
            
            const coordRate = ((withCountryCoords.length / posts.length) * 100).toFixed(1);
            
            if (withCountryCoords.length === 0) {
                console.log(`   ❌ ${country}: 0/${posts.length} posts have country coordinates (${coordRate}%)`);
            } else if (coordRate < 100) {
                console.log(`   ⚠️ ${country}: ${withCountryCoords.length}/${posts.length} posts have country coordinates (${coordRate}%)`);
            } else {
                console.log(`   ✅ ${country}: ${withCountryCoords.length}/${posts.length} posts have country coordinates (${coordRate}%)`);
            }
        });
        
        // Test 6: Location pattern validation
        console.log('\n6️⃣ LOCATION PATTERN VALIDATION:');
        console.log(`   📋 Total patterns: ${locationPatterns.length}`);
        console.log(`   🌍 Countries in pattern list: ${countryList.length}`);
        
        // Check if Malaysia and UAE are in patterns
        const malaysiaInPatterns = countryList.includes('Malaysia');
        const uaeInPatterns = countryList.includes('UAE') || countryList.includes('United Arab Emirates');
        
        console.log(`   🇲🇾 Malaysia in patterns: ${malaysiaInPatterns ? '✅' : '❌'}`);
        console.log(`   🇦🇪 UAE in patterns: ${uaeInPatterns ? '✅' : '❌'}`);
        
        // Test some specific patterns
        const testCaptions = [
            "Malaysia • Kapailai 馬來西亞 • 卡帕萊",
            "UAE • Dubai 阿聯酋 • 杜拜",
            "Mexico • Cancun 墨西哥 • 坎昆",
            "France • Paris 法國 • 巴黎"
        ];
        
        console.log('\n   🧪 Testing specific patterns:');
        testCaptions.forEach(caption => {
            let matched = false;
            locationPatterns.forEach(pattern => {
                if (pattern.regex.test(caption)) {
                    matched = true;
                    console.log(`      ✅ "${caption}" matches ${pattern.type}`);
                }
            });
            if (!matched) {
                console.log(`      ❌ "${caption}" doesn't match any pattern`);
            }
        });
        
        console.log('\n🎯 NEXT STEPS NEEDED:');
        
        if (!travelData.countries.Malaysia) {
            console.log('   1. Re-run Instagram data fetch to capture Malaysia posts');
        }
        if (!uaeFound) {
            console.log('   2. Re-run Instagram data fetch to capture UAE/Dubai posts');
        }
        
        const coordlessCountries = Object.keys(travelData.countries).filter(country => {
            const posts = travelData.countries[country].posts;
            const withCoords = posts.filter(p => p.location && p.location.countryCoordinates);
            return withCoords.length === 0;
        });
        
        if (coordlessCountries.length > 0) {
            console.log(`   3. Fix missing coordinates for: ${coordlessCountries.join(', ')}`);
        }
        
        console.log('\n✅ Analysis complete!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testAllFixes();
