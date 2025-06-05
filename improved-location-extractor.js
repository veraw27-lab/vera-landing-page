// 新的location extraction系統 - 根據用戶要求重新設計
// 1. 優先GPS座標 
// 2. 第一句英文、第二句中文包含都市國家
// 3. 專注地名提取，不做語意判斷
// 4. 修正現有的錯誤分配

const { countryList, locationPatterns } = require('./scripts/location-patterns.js');

class ImprovedLocationExtractor {
    constructor() {
        // 擴展的城市到國家映射
        this.cityToCountry = {
            // 明確的城市映射
            'Amsterdam': 'Netherlands',
            'Seoul': 'South Korea',
            'Tokyo': 'Japan',
            'Milan': 'Italy',
            'NYC': 'United States',
            'New York': 'United States',
            'San Francisco': 'United States',
            'Taipei': 'Taiwan',
            'YiIlan': 'Taiwan',
            'Ilan': 'Taiwan',
            'Yilan': 'Taiwan',
            
            // 馬來西亞城市
            'Kuala Lumpur': 'Malaysia',
            'KL': 'Malaysia',
            'Penang': 'Malaysia',
            'Langkawi': 'Malaysia',
            'Kapailai': 'Malaysia',
            'Melaka': 'Malaysia',
            'Johor Bahru': 'Malaysia',
            'Kota Kinabalu': 'Malaysia',
            'George Town': 'Malaysia'
        };
        
        // 國家名稱標準化
        this.countryNormalization = {
            'Holland': 'Netherlands',
            'Korean': 'South Korea',
            'Korea': 'South Korea',
            'USA': 'United States',
            'UK': 'United Kingdom',
            'Swiss': 'Switzerland',
            'NZ': 'New Zealand',
            'Taiwán': 'Taiwan'
        };
    }
    
    // 主要extraction方法 - 按優先級順序
    extractLocationFromCaption(caption) {
        if (!caption) return null;
        
        const lines = caption.split('\\n');
        const firstLine = (lines[0] || '').trim();
        const secondLine = (lines[1] || '').trim();
        
        console.log('🔍 Extracting from:', firstLine);
        
        // 1. 優先處理GPS標記
        const gpsResult = this.extractFromGPS(firstLine);
        if (gpsResult) {
            console.log('📍 GPS extracted:', gpsResult);
            return gpsResult;
        }
        
        // 2. 處理 Country • City 格式
        const bulletResult = this.extractFromBulletPattern(firstLine, secondLine);
        if (bulletResult) {
            console.log('🟢 Bullet extracted:', bulletResult);
            return bulletResult;
        }
        
        // 3. 處理 City 開頭的格式
        const cityFirstResult = this.extractFromCityFirst(firstLine, secondLine);
        if (cityFirstResult) {
            console.log('🏙️ City-first extracted:', cityFirstResult);
            return cityFirstResult;
        }
        
        // 4. 處理直接國家名稱
        const countryResult = this.extractFromCountryName(firstLine);
        if (countryResult) {
            console.log('🌍 Country extracted:', countryResult);
            return countryResult;
        }
        
        console.log('❌ No location extracted from:', firstLine);
        return null;
    }
    
    // GPS標記提取
    extractFromGPS(line) {
        const gpsPattern = /📍\\s*([^•\\n\\r#@]+)/i;
        const match = line.match(gpsPattern);
        if (match) {
            const location = match[1].trim();
            return this.parseLocationString(location);
        }
        return null;
    }
    
    // Bullet pattern提取 (Country • City)
    extractFromBulletPattern(firstLine, secondLine) {
        const bulletPattern = /([A-Za-z\\s]+)\\s*•\\s*([A-Za-z\\s]+)/;
        const match = firstLine.match(bulletPattern);
        
        if (match) {
            const extractedCountry = match[1].trim();
            const extractedCity = match[2].trim();
            
            // 標準化國家名稱
            const normalizedCountry = this.normalizeCountryName(extractedCountry);
            
            // 檢查是否是有效的國家
            if (countryList.includes(normalizedCountry) || countryList.includes(extractedCountry)) {
                return {
                    city: extractedCity,
                    country: normalizedCountry,
                    coordinates: null,
                    countryCoordinates: this.getCountryCoordinates(normalizedCountry)
                };
            }
            
            // 如果第一部分不是國家，檢查是否是城市
            if (this.cityToCountry[extractedCountry]) {
                return {
                    city: extractedCountry,
                    country: this.cityToCountry[extractedCountry],
                    coordinates: null,
                    countryCoordinates: this.getCountryCoordinates(this.cityToCountry[extractedCountry])
                };
            }
        }
        
        return null;
    }
    
    // City開頭的格式提取
    extractFromCityFirst(firstLine, secondLine) {
        const firstWord = firstLine.split(' ')[0];
        
        // 檢查第一個字是否是已知城市
        if (this.cityToCountry[firstWord]) {
            return {
                city: firstWord,
                country: this.cityToCountry[firstWord],
                coordinates: null,
                countryCoordinates: this.getCountryCoordinates(this.cityToCountry[firstWord])
            };
        }
        
        return null;
    }
    
    // 直接國家名稱提取
    extractFromCountryName(line) {
        for (const country of countryList) {
            if (line.toLowerCase().includes(country.toLowerCase())) {
                const normalizedCountry = this.normalizeCountryName(country);
                return {
                    city: '',
                    country: normalizedCountry,
                    coordinates: null,
                    countryCoordinates: this.getCountryCoordinates(normalizedCountry)
                };
            }
        }
        return null;
    }
    
    // 解析位置字符串
    parseLocationString(location) {
        // 簡單的city, country解析
        if (location.includes(',')) {
            const parts = location.split(',').map(p => p.trim());
            if (parts.length === 2) {
                const city = parts[0];
                const country = this.normalizeCountryName(parts[1]);
                return {
                    city,
                    country,
                    coordinates: null,
                    countryCoordinates: this.getCountryCoordinates(country)
                };
            }
        }
        
        // 檢查是否是單純的國家名
        const normalizedLocation = this.normalizeCountryName(location);
        if (countryList.includes(normalizedLocation)) {
            return {
                city: '',
                country: normalizedLocation,
                coordinates: null,
                countryCoordinates: this.getCountryCoordinates(normalizedLocation)
            };
        }
        
        return null;
    }
    
    // 標準化國家名稱
    normalizeCountryName(country) {
        return this.countryNormalization[country] || country;
    }
    
    // 獲取國家座標
    getCountryCoordinates(country) {
        const coordinates = {
            'Japan': { lat: 36.2048, lng: 138.2529 },
            'Taiwan': { lat: 23.6978, lng: 120.9605 },
            'South Korea': { lat: 35.9078, lng: 127.7669 },
            'Thailand': { lat: 15.8700, lng: 100.9925 },
            'United States': { lat: 39.8283, lng: -98.5795 },
            'France': { lat: 46.2276, lng: 2.2137 },
            'Netherlands': { lat: 52.1326, lng: 5.2913 },
            'Italy': { lat: 41.8719, lng: 12.5674 },
            'Malaysia': { lat: 4.2105, lng: 101.9758 }, // 添加馬來西亞座標
            // ... 其他國家座標
        };
        
        return coordinates[country] || null;
    }
}

// 測試新的extraction系統
function testNewExtractor() {
    const extractor = new ImprovedLocationExtractor();
    
    const testCases = [
        'Holland • Amsterdam',
        'Malaysia • Kapailai', 
        'Taiwan • Taipei',
        'YiIlan • Sup',
        'Seoul • Bukchon Hanok village',
        'NYC • Brooklyn bridge & Dumbo',
        'Japan • Tokyo',
        '📍 Kuala Lumpur, Malaysia'
    ];
    
    console.log('🧪 測試新的Location Extractor:\\n');
    
    testCases.forEach((testCase, index) => {
        console.log(`測試 ${index + 1}: "${testCase}"`);
        const result = extractor.extractLocationFromCaption(testCase);
        if (result) {
            console.log(`  ✅ 結果: ${result.country} / ${result.city}`);
        } else {
            console.log(`  ❌ 無法提取`);
        }
        console.log('');
    });
}

// 如果直接執行此文件，運行測試
if (require.main === module) {
    testNewExtractor();
}

module.exports = ImprovedLocationExtractor;
