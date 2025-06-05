// scripts/fetch-instagram-data.js
// Instagram Graph API 數據提取腳本

const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');

class InstagramGraphAPIFetcher {
    constructor() {
        this.accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
        this.userId = process.env.INSTAGRAM_USER_ID || '17841401489824719';
        this.businessAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || '29758989733746447';
        this.baseURL = 'https://graph.instagram.com/v18.0';
        
        if (!this.accessToken) {
            throw new Error('❌ INSTAGRAM_ACCESS_TOKEN 環境變量未設置');
        }
        
        this.outputDir = path.join(__dirname, '../travel-map/data');
        this.delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    }

    async init() {
        console.log('🚀 開始提取 Instagram Graph API 數據...');
        
        try {
            // 確保輸出目錄存在
            await fs.mkdir(this.outputDir, { recursive: true });
            
            // 獲取用戶資料
            const userProfile = await this.fetchUserProfile();
            
            // 獲取所有媒體
            const allMedia = await this.fetchAllMedia();
            
            // 處理地點數據
            const travelData = await this.processTravelData(allMedia);
            
            // 保存數據
            await this.saveData(userProfile, travelData);
            
            console.log('✅ Instagram 數據提取完成');
            
        } catch (error) {
            console.error('❌ 數據提取失敗:', error);
            process.exit(1);
        }
    }

    async fetchUserProfile() {
        console.log('👤 獲取用戶資料...');
        
        const url = `${this.baseURL}/${this.businessAccountId}?fields=id,username,media_count&access_token=${this.accessToken}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`用戶資料獲取失敗: ${response.status} ${response.statusText}`);
        }
        
        const profile = await response.json();
        console.log(`✅ 用戶: ${profile.username}, 媒體數量: ${profile.media_count}`);
        
        return profile;
    }

    async fetchAllMedia() {
        console.log('📸 獲取所有媒體數據...');
        
        let allMedia = [];
        let nextUrl = `${this.baseURL}/${this.businessAccountId}/media?fields=id,caption,media_type,media_url,permalink,timestamp&limit=100&access_token=${this.accessToken}`;
        
        while (nextUrl) {
            console.log(`📄 正在獲取媒體數據... 已獲取: ${allMedia.length}`);
            
            const response = await fetch(nextUrl);
            
            if (!response.ok) {
                throw new Error(`媒體數據獲取失敗: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            allMedia = allMedia.concat(data.data);
            
            // 檢查下一頁
            nextUrl = data.paging?.next || null;
            
            // API 速率限制保護
            if (nextUrl) {
                await this.delay(1000);
            }
        }
        
        console.log(`✅ 總共獲取 ${allMedia.length} 個媒體項目`);
        return allMedia;
    }

    async processTravelData(mediaArray) {
        console.log('🗺️ 處理旅行數據...');
        const travelData = {
            countries: {},
            cities: new Set(),
            posts: [],
            lastUpdated: new Date().toISOString(),
            totalPosts: mediaArray.length,
            postsWithLocation: 0
        };

        for (const media of mediaArray) {
            // 新增：優先用 media.location（若有），否則用 caption 判斷
            let locationInfo = null;
            if (media.location && (media.location.name || media.location.city || media.location.country)) {
                // IG API location 欄位（需權限）
                locationInfo = {
                    city: media.location.city || '',
                    country: media.location.country || '',
                    coordinates: media.location.latitude && media.location.longitude ? { lat: media.location.latitude, lng: media.location.longitude } : null,
                    countryCoordinates: null
                };
            } else {
                locationInfo = this.extractLocationFromCaption(media.caption);
            }

            if (locationInfo && (locationInfo.city || locationInfo.country)) {
                travelData.postsWithLocation++;
                const post = {
                    id: media.id,
                    caption: media.caption || '',
                    mediaUrl: media.media_url,
                    permalink: media.permalink,
                    timestamp: media.timestamp,
                    location: locationInfo,
                    mediaType: media.media_type
                };
                travelData.posts.push(post);
                const country = locationInfo.country;
                if (country) {
                    if (!travelData.countries[country]) {
                        travelData.countries[country] = {
                            name: country,
                            posts: [],
                            cities: new Set(),
                            coordinates: locationInfo.countryCoordinates || null
                        };
                    }
                    travelData.countries[country].posts.push(post);
                    if (locationInfo.city) {
                        travelData.countries[country].cities.add(locationInfo.city);
                        travelData.cities.add(locationInfo.city);
                    }
                }
            }
        }
        // 轉換 Set 為 Array
        Object.keys(travelData.countries).forEach(country => {
            travelData.countries[country].cities = Array.from(travelData.countries[country].cities);
        });
        travelData.cities = Array.from(travelData.cities);
        console.log(`✅ 處理完成: ${Object.keys(travelData.countries).length} 個國家, ${travelData.cities.length} 個城市, ${travelData.postsWithLocation} 個有地點的貼文`);
        return travelData;
    }

    extractLocationFromCaption(caption) {
        if (!caption) return null;

        // 地點提取模式（針對中文和英文）
        const patterns = [
            // 明確的地點標記
            { regex: /📍\s*([^•\n\r#@]+)/i, type: 'explicit' },
            { regex: /Location:\s*([^\n\r#@]+)/i, type: 'explicit' },
            { regex: /地點[:：]\s*([^\n\r#@]+)/i, type: 'explicit' },
            { regex: /在([^#@\n\r]+?)(?=\s*[#@\n\r]|$)/i, type: 'chinese_location' },
            
            // 城市, 國家 模式
            { regex: /([^#@\n\r,]+),\s*(Japan|Nepal|France|UK|United Kingdom|Thailand|Indonesia|Taiwan|Korea|South Korea|USA|United States|Italy|Spain|Germany|Australia|Canada)/i, type: 'city_country' },
            // 尼泊爾地點
            { regex: /(Kathmandu|Pokhara|Lukla|Namche|Everest|Annapurna|Manaslu|Nepal|加德滿都|博卡拉|盧卡拉|南崎|聖母峰|安娜普納|馬納斯盧)/i, type: 'nepal_city' },
            
            // 直接的城市名稱
            { regex: /(Tokyo|Kyoto|Osaka|Hiroshima|Paris|London|New York|Bangkok|Bali|Taipei|Seoul|Rome|Barcelona|Berlin|Sydney|Vancouver|Toronto)/i, type: 'city' },
            
            // 登山/健行相關地點
            { regex: /(Everest|Annapurna|Manaslu|富士山|玉山|阿里山)\s*(Base\s*Camp|基地營)?/i, type: 'mountain' },
            
            // 台灣地點
            { regex: /(台北|新北|桃園|新竹|苗栗|台中|彰化|南投|雲林|嘉義|台南|高雄|屏東|宜蘭|花蓮|台東|澎湖|金門|馬祖)/i, type: 'taiwan_city' },
            
            // 日本地點
            { regex: /(東京|京都|大阪|名古屋|神戶|橫濱|札幌|福岡|廣島|奈良)/i, type: 'japan_city' }
        ];

        for (const pattern of patterns) {
            const match = caption.match(pattern.regex);
            if (match) {
                return this.parseLocationMatch(match, pattern.type);
            }
        }

        return null;
    }

    parseLocationMatch(match, type) {
        // 完整的地點映射數據庫
        const locationMap = {
            // 日本
            'Tokyo': { city: 'Tokyo', country: 'Japan', coordinates: { lat: 35.6762, lng: 139.6503 }, countryCoordinates: { lat: 36.2048, lng: 138.2529 } },
            '東京': { city: 'Tokyo', country: 'Japan', coordinates: { lat: 35.6762, lng: 139.6503 }, countryCoordinates: { lat: 36.2048, lng: 138.2529 } },
            'Kyoto': { city: 'Kyoto', country: 'Japan', coordinates: { lat: 35.0116, lng: 135.7681 }, countryCoordinates: { lat: 36.2048, lng: 138.2529 } },
            '京都': { city: 'Kyoto', country: 'Japan', coordinates: { lat: 35.0116, lng: 135.7681 }, countryCoordinates: { lat: 36.2048, lng: 138.2529 } },
            'Osaka': { city: 'Osaka', country: 'Japan', coordinates: { lat: 34.6937, lng: 135.5023 }, countryCoordinates: { lat: 36.2048, lng: 138.2529 } },
            '大阪': { city: 'Osaka', country: 'Japan', coordinates: { lat: 34.6937, lng: 135.5023 }, countryCoordinates: { lat: 36.2048, lng: 138.2529 } },
            
            // 台灣
            'Taipei': { city: 'Taipei', country: 'Taiwan', coordinates: { lat: 25.0330, lng: 121.5654 }, countryCoordinates: { lat: 23.6978, lng: 120.9605 } },
            '台北': { city: 'Taipei', country: 'Taiwan', coordinates: { lat: 25.0330, lng: 121.5654 }, countryCoordinates: { lat: 23.6978, lng: 120.9605 } },
            '台中': { city: 'Taichung', country: 'Taiwan', coordinates: { lat: 24.1477, lng: 120.6736 }, countryCoordinates: { lat: 23.6978, lng: 120.9605 } },
            '高雄': { city: 'Kaohsiung', country: 'Taiwan', coordinates: { lat: 22.6273, lng: 120.3014 }, countryCoordinates: { lat: 23.6978, lng: 120.9605 } },
            
            // 韓國
            'Seoul': { city: 'Seoul', country: 'South Korea', coordinates: { lat: 37.5665, lng: 126.9780 }, countryCoordinates: { lat: 35.9078, lng: 127.7669 } },
            
            // 歐洲
            'Paris': { city: 'Paris', country: 'France', coordinates: { lat: 48.8566, lng: 2.3522 }, countryCoordinates: { lat: 46.2276, lng: 2.2137 } },
            'London': { city: 'London', country: 'United Kingdom', coordinates: { lat: 51.5074, lng: -0.1278 }, countryCoordinates: { lat: 55.3781, lng: -3.4360 } },
            'Rome': { city: 'Rome', country: 'Italy', coordinates: { lat: 41.9028, lng: 12.4964 }, countryCoordinates: { lat: 41.8719, lng: 12.5674 } },
            'Barcelona': { city: 'Barcelona', country: 'Spain', coordinates: { lat: 41.3851, lng: 2.1734 }, countryCoordinates: { lat: 40.4637, lng: -3.7492 } },
            
            // 美洲
            'New York': { city: 'New York', country: 'United States', coordinates: { lat: 40.7128, lng: -74.0060 }, countryCoordinates: { lat: 37.0902, lng: -95.7129 } },
            
            // 東南亞
            'Bangkok': { city: 'Bangkok', country: 'Thailand', coordinates: { lat: 13.7563, lng: 100.5018 }, countryCoordinates: { lat: 15.8700, lng: 100.9925 } },
            'Bali': { city: 'Denpasar', country: 'Indonesia', coordinates: { lat: -8.3405, lng: 115.0920 }, countryCoordinates: { lat: -0.7893, lng: 113.9213 } },
            
            // 尼泊爾
            'Everest Base Camp': { city: 'Everest Base Camp', country: 'Nepal', coordinates: { lat: 28.0026, lng: 86.8528 }, countryCoordinates: { lat: 28.3949, lng: 84.1240 } },
            'Annapurna Base Camp': { city: 'Annapurna Base Camp', country: 'Nepal', coordinates: { lat: 28.5314, lng: 83.8731 }, countryCoordinates: { lat: 28.3949, lng: 84.1240 } }
        };

        const text = match[1] ? match[1].trim() : match[0].trim();
        
        // 先檢查預定義映射
        for (const [key, location] of Object.entries(locationMap)) {
            if (text.toLowerCase().includes(key.toLowerCase())) {
                return location;
            }
        }

        // 解析城市,國家格式
        if (type === 'city_country') {
            const city = match[1] ? match[1].trim() : '';
            const country = match[2] ? match[2].trim() : '';
            
            return {
                city: city,
                country: this.normalizeCountryName(country),
                coordinates: null,
                countryCoordinates: this.getCountryCoordinates(country)
            };
        }

        // 台灣城市處理
        if (type === 'taiwan_city') {
            return {
                city: text,
                country: 'Taiwan',
                coordinates: null,
                countryCoordinates: { lat: 23.6978, lng: 120.9605 }
            };
        }

        // 日本城市處理
        if (type === 'japan_city') {
            return {
                city: text,
                country: 'Japan',
                coordinates: null,
                countryCoordinates: { lat: 36.2048, lng: 138.2529 }
            };
        }

        // 尼泊爾城市處理
        if (type === 'nepal_city') {
            return {
                city: text,
                country: 'Nepal',
                coordinates: null,
                countryCoordinates: { lat: 28.3949, lng: 84.1240 }
            };
        }

        return {
            city: text,
            country: null,
            coordinates: null,
            countryCoordinates: null
        };
    }

    normalizeCountryName(country) {
        const countryMap = {
            'Japan': 'Japan',
            'Nepal': 'Nepal',
            'France': 'France',
            'UK': 'United Kingdom',
            'United Kingdom': 'United Kingdom',
            'Thailand': 'Thailand',
            'Indonesia': 'Indonesia',
            'Taiwan': 'Taiwan',
            'Korea': 'South Korea',
            'South Korea': 'South Korea',
            'USA': 'United States',
            'United States': 'United States',
            'Italy': 'Italy',
            'Spain': 'Spain',
            'Germany': 'Germany',
            'Australia': 'Australia',
            'Canada': 'Canada'
        };
        
        return countryMap[country] || country;
    }

    getCountryCoordinates(country) {
        const countryCoords = {
            'Japan': { lat: 36.2048, lng: 138.2529 },
            'Taiwan': { lat: 23.6978, lng: 120.9605 },
            'South Korea': { lat: 35.9078, lng: 127.7669 },
            'France': { lat: 46.2276, lng: 2.2137 },
            'United Kingdom': { lat: 55.3781, lng: -3.4360 },
            'Thailand': { lat: 15.8700, lng: 100.9925 },
            'Indonesia': { lat: -0.7893, lng: 113.9213 },
            'Nepal': { lat: 28.3949, lng: 84.1240 },
            'United States': { lat: 37.0902, lng: -95.7129 },
            'Italy': { lat: 41.8719, lng: 12.5674 },
            'Spain': { lat: 40.4637, lng: -3.7492 }
        };
        
        return countryCoords[this.normalizeCountryName(country)] || null;
    }

    async saveData(userProfile, travelData) {
        console.log('💾 保存數據...');
        
        // 保存用戶資料
        await fs.writeFile(
            path.join(this.outputDir, 'user-profile.json'),
            JSON.stringify(userProfile, null, 2)
        );
        
        // 保存旅行數據
        await fs.writeFile(
            path.join(this.outputDir, 'travel-data.json'),
            JSON.stringify(travelData, null, 2)
        );
        
        // 生成統計摘要
        const summary = {
            lastUpdated: travelData.lastUpdated,
            totalCountries: Object.keys(travelData.countries).length,
            totalCities: travelData.cities.length,
            totalPosts: travelData.totalPosts,
            postsWithLocation: travelData.postsWithLocation,
            username: userProfile.username,
            mediaCount: userProfile.media_count
        };
        
        await fs.writeFile(
            path.join(this.outputDir, 'summary.json'),
            JSON.stringify(summary, null, 2)
        );
        
        console.log('✅ 數據保存完成');
        console.log(`📊 統計: ${summary.totalCountries} 國家, ${summary.totalCities} 城市, ${summary.postsWithLocation}/${summary.totalPosts} 個有地點的貼文`);
    }
}

// 運行腳本
if (require.main === module) {
    const fetcher = new InstagramGraphAPIFetcher();
    fetcher.init().catch(console.error);
}

module.exports = InstagramGraphAPIFetcher;
