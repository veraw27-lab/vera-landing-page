// scripts/fetch-instagram-data.js
// Instagram Graph API 數據提取腳本

const fs = require('fs').promises;
const path = require('path');
const fetch = require('node-fetch');
const { countryList, locationPatterns } = require('./location-patterns');

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

    // 新增：API 請求自動重試
    async fetchWithRetry(url, retries = 3) {
        for (let i = 0; i < retries; i++) {
            const response = await fetch(url);
            if (response.ok) return response;
            await this.delay(1000 * (i + 1));
        }
        throw new Error('API 請求失敗，重試多次仍無法取得資料');
    }

    async fetchAllMedia() {
        console.log('📸 獲取所有媒體數據...');
        
        let allMedia = [];
        let nextUrl = `${this.baseURL}/${this.businessAccountId}/media?fields=id,caption,media_type,media_url,permalink,timestamp&limit=100&access_token=${this.accessToken}`;
        
        while (nextUrl) {
            console.log(`📄 正在獲取媒體數據... 已獲取: ${allMedia.length}`);
            
            const response = await this.fetchWithRetry(nextUrl);
            
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
                locationInfo = await this.extractLocationFromCaption(media.caption);
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

    // 動態讀取國家主要城市映射表
    static async getCountryCityMap() {
        const filePath = path.join(__dirname, 'country-cities.json');
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    }

    // locationMap 主要城市自動生成（async 版本）
    static async getLocationMap() {
        const base = {
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
            'Annapurna Base Camp': { city: 'Annapurna Base Camp', country: 'Nepal', coordinates: { lat: 28.5314, lng: 83.8731 }, countryCoordinates: { lat: 28.3949, lng: 84.1240 } },
            
            // 南美洲
            'Lima': { city: 'Lima', country: 'Peru', coordinates: { lat: -12.0464, lng: -77.0428 }, countryCoordinates: { lat: -9.1900, lng: -75.0152 } },
            'Cusco': { city: 'Cusco', country: 'Peru', coordinates: { lat: -13.5319, lng: -71.9675 }, countryCoordinates: { lat: -9.1900, lng: -75.0152 } },
            'Machu Picchu': { city: 'Machu Picchu', country: 'Peru', coordinates: { lat: -13.1631, lng: -72.5450 }, countryCoordinates: { lat: -9.1900, lng: -75.0152 } },
            'La Paz': { city: 'La Paz', country: 'Bolivia', coordinates: { lat: -16.5000, lng: -68.1193 }, countryCoordinates: { lat: -16.2902, lng: -63.5887 } },
            'Uyuni': { city: 'Uyuni', country: 'Bolivia', coordinates: { lat: -20.4586, lng: -66.8250 }, countryCoordinates: { lat: -16.2902, lng: -63.5887 } },
            'Santiago': { city: 'Santiago', country: 'Chile', coordinates: { lat: -33.4489, lng: -70.6693 }, countryCoordinates: { lat: -35.6751, lng: -71.5430 } },
            'Buenos Aires': { city: 'Buenos Aires', country: 'Argentina', coordinates: { lat: -34.6118, lng: -58.3960 }, countryCoordinates: { lat: -38.4161, lng: -63.6167 } },
            'Rio de Janeiro': { city: 'Rio de Janeiro', country: 'Brazil', coordinates: { lat: -22.9068, lng: -43.1729 }, countryCoordinates: { lat: -14.2350, lng: -51.9253 } },
            'São Paulo': { city: 'São Paulo', country: 'Brazil', coordinates: { lat: -23.5558, lng: -46.6396 }, countryCoordinates: { lat: -14.2350, lng: -51.9253 } },
            'Bogotá': { city: 'Bogotá', country: 'Colombia', coordinates: { lat: 4.7110, lng: -74.0721 }, countryCoordinates: { lat: 4.5709, lng: -74.2973 } },
            'Caracas': { city: 'Caracas', country: 'Venezuela', coordinates: { lat: 10.4806, lng: -66.9036 }, countryCoordinates: { lat: 6.4238, lng: -66.5897 } },
            'Quito': { city: 'Quito', country: 'Ecuador', coordinates: { lat: -0.1807, lng: -78.4678 }, countryCoordinates: { lat: -1.8312, lng: -78.1834 } },
            'Montevideo': { city: 'Montevideo', country: 'Uruguay', coordinates: { lat: -34.9011, lng: -56.1645 }, countryCoordinates: { lat: -32.5228, lng: -55.7658 } },
            'Asunción': { city: 'Asunción', country: 'Paraguay', coordinates: { lat: -25.2637, lng: -57.5759 }, countryCoordinates: { lat: -23.4425, lng: -58.4438 } }
        };
        const cityMap = await this.getCountryCityMap();
        for (const [country, cities] of Object.entries(cityMap)) {
            for (const city of cities) {
                base[city] = { city, country, coordinates: null, countryCoordinates: null };
            }
            // 新增：將國家名稱本身也加入 key
            base[country] = { city: '', country, coordinates: null, countryCoordinates: null };
        }
        return base;
    }

    // 正則表達式模式表（可擴充）
    static getLocationPatterns() {
        return locationPatterns;
    }

    async extractLocationFromCaption(caption) {
        if (!caption) return null;
        const patterns = this.constructor.getLocationPatterns();
        for (const pattern of patterns) {
            const match = caption.match(pattern.regex);
            if (match) {
                return await this.parseLocationMatch(match, pattern.type);
            }
        }
        return null;
    }

    async parseLocationMatch(match, type) {
        const locationMap = await this.constructor.getLocationMap();
        const text = match[1] ? match[1].trim() : match[0].trim();
        for (const [key, location] of Object.entries(locationMap)) {
            if (text.toLowerCase().includes(key.toLowerCase())) {
                return location;
            }
        }
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
        // 新增：直接國家名稱
        if (type === 'country') {
            const country = this.normalizeCountryName(text);
            return {
                city: '',
                country,
                coordinates: null,
                countryCoordinates: this.getCountryCoordinates(country)
            };
        }
        if (type === 'taiwan_city') {
            return {
                city: text,
                country: 'Taiwan',
                coordinates: null,
                countryCoordinates: { lat: 23.6978, lng: 120.9605 }
            };
        }
        if (type === 'japan_city') {
            return {
                city: text,
                country: 'Japan',
                coordinates: null,
                countryCoordinates: { lat: 36.2048, lng: 138.2529 }
            };
        }
        if (type === 'nepal_city') {
            return {
                city: text,
                country: 'Nepal',
                coordinates: null,
                countryCoordinates: { lat: 28.3949, lng: 84.1240 }
            };
        }
        // 新增：國家・地點格式處理
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
        return {
            city: text,
            country: null,
            coordinates: null,
            countryCoordinates: null
        };
    }

    // locationMap 主要城市自動生成
    static get locationMap() {
        const base = {
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
        const cityMap = this.getCountryCityMap();
        for (const [country, cities] of Object.entries(cityMap)) {
            for (const city of cities) {
                base[city] = { city, country, coordinates: null, countryCoordinates: null };
            }
            // 新增：將國家名稱本身也加入 key
            base[country] = { city: '', country, coordinates: null, countryCoordinates: null };
        }
        return base;
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
            'Canada': 'Canada',
            'New Zealand': 'New Zealand',
            'NZ': 'New Zealand',
            'Switzerland': 'Switzerland',
            'Swiss': 'Switzerland',
            'Norway': 'Norway',
            'Portugal': 'Portugal',
            'Sweden': 'Sweden',
            'Finland': 'Finland',
            'Denmark': 'Denmark',
            'Netherlands': 'Netherlands',
            'Belgium': 'Belgium',
            'Austria': 'Austria',
            'Greece': 'Greece',
            'Turkey': 'Turkey',
            'Czech': 'Czech Republic',
            'Czech Republic': 'Czech Republic',
            'Hungary': 'Hungary',
            'Poland': 'Poland',
            'Ireland': 'Ireland',
            'Russia': 'Russia',
            'Iceland': 'Iceland',
            'Estonia': 'Estonia',
            'Latvia': 'Latvia',
            'Lithuania': 'Lithuania',
            'Slovakia': 'Slovakia',
            'Slovenia': 'Slovenia',
            'Croatia': 'Croatia',
            'Serbia': 'Serbia',
            'Romania': 'Romania',
            'Bulgaria': 'Bulgaria',
            'Ukraine': 'Ukraine',
            'Luxembourg': 'Luxembourg',
            'Liechtenstein': 'Liechtenstein',
            'Monaco': 'Monaco',
            'San Marino': 'San Marino',
            'Andorra': 'Andorra',
            'Vatican': 'Vatican',
            'Malta': 'Malta',
            'Cyprus': 'Cyprus',
            'Monaco': 'Monaco',
            'Montenegro': 'Montenegro',
            'Bosnia': 'Herzegovina',
            'Herzegovina': 'Herzegovina',
            'Macedonia': 'North Macedonia',
            'Albania': 'Albania',
            'Moldova': 'Moldova',
            'Belarus': 'Belarus',
            'Georgia': 'Georgia',
            'Armenia': 'Armenia',
            'Azerbaijan': 'Azerbaijan',
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
            'Spain': { lat: 40.4637, lng: -3.7492 },
            'New Zealand': { lat: -40.9006, lng: 174.8860 },
            'Switzerland': { lat: 46.8182, lng: 8.2275 },
            'Norway': { lat: 60.4720, lng: 8.4689 },
            'Portugal': { lat: 39.3999, lng: -8.2245 },
            'Sweden': { lat: 60.1282, lng: 18.6435 },
            'Finland': { lat: 61.9241, lng: 25.7482 },
            'Denmark': { lat: 56.2639, lng: 9.5018 },
            'Netherlands': { lat: 52.1326, lng: 5.2913 },
            'Belgium': { lat: 50.5039, lng: 4.4699 },
            'Austria': { lat: 47.5162, lng: 14.5501 },
            'Greece': { lat: 39.0742, lng: 21.8243 },
            'Turkey': { lat: 38.9637, lng: 35.2433 },
            'Czech Republic': { lat: 49.8175, lng: 15.4730 },
            'Hungary': { lat: 47.1625, lng: 19.5033 },
            'Poland': { lat: 51.9194, lng: 19.1451 },
            'Ireland': { lat: 53.1424, lng: -7.6921 },
            'Russia': { lat: 61.5240, lng: 105.3188 },
            'Iceland': { lat: 64.9631, lng: -19.0208 },
            'Estonia': { lat: 58.5953, lng: 25.0136 },
            'Latvia': { lat: 56.8796, lng: 24.6032 },
            'Lithuania': { lat: 55.1694, lng: 23.8813 },
            'Slovakia': { lat: 48.6690, lng: 19.6990 },
            'Slovenia': { lat: 46.1512, lng: 14.9955 },
            'Croatia': { lat: 45.1000, lng: 15.2000 },
            'Serbia': { lat: 44.0165, lng: 21.0059 },
            'Romania': { lat: 45.9432, lng: 24.9668 },
            'Bulgaria': { lat: 42.7339, lng: 25.4858 },
            'Ukraine': { lat: 48.3794, lng: 31.1656 },
            'Luxembourg': { lat: 49.8153, lng: 6.1296 },
            'Liechtenstein': { lat: 47.1660, lng: 9.5554 },
            'Monaco': { lat: 43.7384, lng: 7.4246 },
            'San Marino': { lat: 43.9424, lng: 12.4578 },
            'Andorra': { lat: 42.5063, lng: 1.5218 },
            'Vatican': { lat: 41.9029, lng: 12.4534 },
            'Malta': { lat: 35.9375, lng: 14.3754 },
            'Cyprus': { lat: 35.1264, lng: 33.4299 },
            'Montenegro': { lat: 42.7087, lng: 19.3744 },
            'Bosnia and Herzegovina': { lat: 43.9159, lng: 17.6791 },
            'North Macedonia': { lat: 41.6086, lng: 21.7453 },
            'Albania': { lat: 41.1533, lng: 20.1683 },
            'Moldova': { lat: 47.4116, lng: 28.3699 },
            'Belarus': { lat: 53.7098, lng: 27.9534 },
            'Georgia': { lat: 42.3154, lng: 43.3569 },
            'Armenia': { lat: 40.0691, lng: 45.0382 },
            'Azerbaijan': { lat: 40.1431, lng: 47.5769 },
            
            // South American countries
            'Peru': { lat: -9.1900, lng: -75.0152 },
            'Bolivia': { lat: -16.2902, lng: -63.5887 },
            'Chile': { lat: -35.6751, lng: -71.5430 },
            'Argentina': { lat: -38.4161, lng: -63.6167 },
            'Brazil': { lat: -14.2350, lng: -51.9253 },
            'Colombia': { lat: 4.5709, lng: -74.2973 },
            'Venezuela': { lat: 6.4238, lng: -66.5897 },
            'Ecuador': { lat: -1.8312, lng: -78.1834 },
            'Uruguay': { lat: -32.5228, lng: -55.7658 },
            'Paraguay': { lat: -23.4425, lng: -58.4438 },
            'Guyana': { lat: 4.8604, lng: -58.9302 },
            'Suriname': { lat: 3.9193, lng: -56.0278 },
            'French Guiana': { lat: 3.9339, lng: -53.1258 }
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
