#!/usr/bin/env node
// Comprehensive investigation of missing/problematic posts

const fs = require('fs');

function investigateIssues() {
    console.log('🔍 INVESTIGATING SPECIFIC ISSUES\n');
    
    try {
        // Load current data
        const travelData = JSON.parse(fs.readFileSync('/workspaces/vera-landing-page/travel-map/data/travel-data.json', 'utf8'));
        
        console.log('📊 CURRENT DATA OVERVIEW:');
        console.log(`- Total countries: ${Object.keys(travelData.countries).length}`);
        
        // List all countries
        console.log('\n🌍 COUNTRIES IN DATA:');
        Object.keys(travelData.countries).sort().forEach(country => {
            const posts = travelData.countries[country].posts;
            console.log(`  ${country}: ${posts.length} posts`);
        });
        
        console.log('\n🔍 INVESTIGATING SPECIFIC ISSUES:\n');
        
        // 1. Check for Malaysia
        console.log('1. MALAYSIA STATUS:');
        if (travelData.countries.Malaysia) {
            console.log(`   ✅ Found Malaysia with ${travelData.countries.Malaysia.posts.length} posts`);
            
            // Check for Kapailai specifically
            const kapailaiPosts = travelData.countries.Malaysia.posts.filter(post => 
                post.caption && post.caption.toLowerCase().includes('kapailai')
            );
            console.log(`   📍 Kapailai posts: ${kapailaiPosts.length}`);
            if (kapailaiPosts.length > 0) {
                kapailaiPosts.forEach(post => {
                    console.log(`      - ${post.permalink}`);
                    console.log(`        Location: ${JSON.stringify(post.location)}`);
                });
            }
        } else {
            console.log('   ❌ Malaysia not found in data');
        }
        
        // 2. Check for UAE/Dubai
        console.log('\n2. UAE/DUBAI STATUS:');
        const uaeCountries = ['UAE', 'United Arab Emirates', 'Dubai'];
        let uaeFound = false;
        
        uaeCountries.forEach(countryName => {
            if (travelData.countries[countryName]) {
                console.log(`   ✅ Found ${countryName} with ${travelData.countries[countryName].posts.length} posts`);
                uaeFound = true;
            }
        });
        
        if (!uaeFound) {
            console.log('   ❌ No UAE/Dubai data found');
            
            // Search all posts for Dubai/UAE mentions
            console.log('   🔍 Searching for Dubai/UAE mentions in all posts...');
            let dubaiMentions = 0;
            Object.keys(travelData.countries).forEach(country => {
                travelData.countries[country].posts.forEach(post => {
                    if (post.caption && (
                        post.caption.toLowerCase().includes('dubai') ||
                        post.caption.toLowerCase().includes('uae') ||
                        post.caption.toLowerCase().includes('emirates')
                    )) {
                        dubaiMentions++;
                        console.log(`      - Found Dubai/UAE mention in ${country}: ${post.permalink}`);
                        console.log(`        Caption snippet: ${post.caption.substring(0, 100)}...`);
                    }
                });
            });
            console.log(`   📊 Total Dubai/UAE mentions found: ${dubaiMentions}`);
        }
        
        // 3. Check Mexico/Cancun
        console.log('\n3. MEXICO/CANCUN STATUS:');
        if (travelData.countries.Mexico) {
            console.log(`   ✅ Found Mexico with ${travelData.countries.Mexico.posts.length} posts`);
            
            const cancunPosts = travelData.countries.Mexico.posts.filter(post => 
                post.caption && post.caption.toLowerCase().includes('cancun')
            );
            console.log(`   🏖️ Cancun posts: ${cancunPosts.length}`);
            
            // Check location coordinates
            console.log('   📍 Location coordinate status:');
            travelData.countries.Mexico.posts.forEach((post, index) => {
                console.log(`      Post ${index + 1}: ${JSON.stringify(post.location)}`);
            });
        } else {
            console.log('   ❌ Mexico not found in data');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

investigateIssues();
