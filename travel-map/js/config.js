// config.js - Instagram API 配置文件
// 這個文件包含您的 Instagram API 配置

const INSTAGRAM_CONFIG = {
    // Instagram 應用 ID（從 Facebook Developer Console 獲取）
    clientId: 'YOUR_INSTAGRAM_APP_ID', // 替換為您的實際 App ID
    
    // Instagram 應用密鑰（僅在後端使用，前端請留空）
    clientSecret: '', // 生產環境中不要在前端暴露
    
    // 重定向 URI（必須與 Facebook Developer Console 中配置的完全一致）
    redirectUri: window.location.origin + '/travel-map/auth-callback.html',
    
    // API 權限範圍
    scope: 'user_profile,user_media',
    
    // Instagram Graph API 基礎 URL
    baseURL: 'https://graph.instagram.com',
    
    // Instagram 授權 URL
    authURL: 'https://api.instagram.com/oauth/authorize',
    
    // 令牌交換 URL
    tokenURL: 'https://api.instagram.com/oauth/access_token',
    
    // API 調用間隔（毫秒）
    rateLimitDelay: 1000,
    
    // 緩存設置
    cache: {
        // 數據緩存時間（天）
        dataExpiryDays: 7,
        // 令牌緩存時間（天）
        tokenExpiryDays: 60
    },
    
    // 地理編碼設置
    geocoding: {
        // 主要地理編碼服務
        primary: 'nominatim',
        // 備用服務
        fallback: 'internal',
        // 請求延遲
        delay: 500
    }
};

// 已知地點的座標數據庫（備用地理編碼）
const KNOWN_LOCATIONS = {
    // 尼泊爾
    'everest base camp': {
        lat: 28.0026,
        lng: 86.8528,
        city: 'Everest Base Camp',
        country: 'Nepal',
        region: 'Khumbu'
    },
    'annapurna base camp': {
        lat: 28.5314,
        lng: 83.8731,
        city: 'Annapurna Base Camp',
        country: 'Nepal',
        region: 'Annapurna'
    },
    'annapurna circuit': {
        lat: 28.5969,
        lng: 83.9294,
        city: 'Manang',
        country: 'Nepal',
        region: 'Annapurna'
    },
    'kathmandu': {
        lat: 27.7172,
        lng: 85.3240,
        city: 'Kathmandu',
        country: 'Nepal',
        region: 'Bagmati'
    },
    'pokhara': {
        lat: 28.2096,
        lng: 83.9856,
        city: 'Pokhara',
        country: 'Nepal',
        region: 'Gandaki'
    },
    
    // 日本
    'tokyo': {
        lat: 35.6762,
        lng: 139.6503,
        city: 'Tokyo',
        country: 'Japan',
        region: 'Kanto'
    },
    'kyoto': {
        lat: 35.0116,
        lng: 135.7681,
        city: 'Kyoto',
        country: 'Japan',
        region: 'Kansai'
    },
    'osaka': {
        lat: 34.6937,
        lng: 135.5023,
        city: 'Osaka',
        country: 'Japan',
        region: 'Kansai'
    },
    'hokkaido': {
        lat: 43.0642,
        lng: 141.3469,
        city: 'Sapporo',
        country: 'Japan',
        region: 'Hokkaido'
    },
    'hiroshima': {
        lat: 34.3853,
        lng: 132.4553,
        city: 'Hiroshima',
        country: 'Japan',
        region: 'Chugoku'
    },
    'mount fuji': {
        lat: 35.3606,
        lng: 138.7274,
        city: 'Mount Fuji',
        country: 'Japan',
        region: 'Chubu'
    },
    
    // 其他熱門旅遊地點
    'paris': {
        lat: 48.8566,
        lng: 2.3522,
        city: 'Paris',
        country: 'France',
        region: 'Île-de-France'
    },
    'london': {
        lat: 51.5074,
        lng: -0.1278,
        city: 'London',
        country: 'United Kingdom',
        region: 'England'
    },
    'new york': {
        lat: 40.7128,
        lng: -74.0060,
        city: 'New York',
        country: 'United States',
        region: 'New York'
    },
    'bali': {
        lat: -8.3405,
        lng: 115.0920,
        city: 'Denpasar',
        country: 'Indonesia',
        region: 'Bali'
    },
    'thailand': {
        lat: 13.7563,
        lng: 100.5018,
        city: 'Bangkok',
        country: 'Thailand',
        region: 'Central Thailand'
    }
};

// 地點提取的正則表達式模式
const LOCATION_PATTERNS = [
    // 明確的地點標記
    /📍\s*([^•\n\r#@]+)/i,
    /Location:\s*([^\n\r#@]+)/i,
    /地點[:：]\s*([^\n\r#@]+)/i,
    
    // 英文地點模式
    /at\s+([A-Z][a-zA-Z\s,.-]+?)(?=\s*[#@\n\r]|$)/,
    /@\s*([A-Z][a-zA-Z\s,.-]+?)(?=\s*[#@\n\r]|$)/,
    
    // 中文地點模式
    /在([^#@\n\r]+?)(?=\s*[#@\n\r]|$)/,
    
    // 特殊地點模式
    /([A-Za-z\s]+Base\s+Camp)/i,
    /(Everest|Annapurna|Manaslu)\s*([A-Za-z\s]*)/i,
    
    // 國家/城市模式
    /(Tokyo|Kyoto|Osaka|Hokkaido|Hiroshima|Paris|London|Bali)/i,
    /([^#@\n\r]+?)(?=,\s*(Japan|Nepal|France|UK|Thailand|Indonesia))/i
];

// API 錯誤處理配置
const ERROR_MESSAGES = {
    'invalid_token': '訪問令牌無效或已過期，請重新授權',
    'rate_limit_exceeded': 'API 調用頻率過高，請稍後再試',
    'user_not_found': '找不到用戶信息',
    'no_media': '沒有找到媒體內容',
    'geocoding_failed': '地理編碼失敗，使用備用位置',
    'network_error': '網絡連接錯誤，請檢查網絡狀態'
};

// 本地儲存鍵名
const STORAGE_KEYS = {
    accessToken: 'instagram_access_token',
    tokenExpiry: 'instagram_token_expiry',
    travelData: 'travel_data',
    dataUpdated: 'travel_data_updated',
    userProfile: 'instagram_user_profile'
};

// 導出配置供其他模塊使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        INSTAGRAM_CONFIG,
        KNOWN_LOCATIONS,
        LOCATION_PATTERNS,
        ERROR_MESSAGES,
        STORAGE_KEYS
    };
}

// 設置指南和說明
const SETUP_GUIDE = {
    steps: [
        {
            title: "創建 Facebook 開發者帳戶",
            description: "前往 https://developers.facebook.com 註冊開發者帳戶",
            action: "完成身份驗證和開發者協議"
        },
        {
            title: "創建應用程式",
            description: "在 Facebook 開發者控制台中創建新應用",
            action: "選擇 'Consumer' 類型並添加 Instagram Basic Display 產品"
        },
        {
            title: "配置 Instagram Basic Display",
            description: "設置重定向 URI 和其他必要配置",
            details: [
                "Instagram App ID: 從應用設置中複製",
                "Instagram App Secret: 保存在安全的後端環境",
                "OAuth Redirect URIs: " + (typeof window !== 'undefined' ? 
                    window.location.origin + '/travel-map/auth-callback.html' : 
                    'https://你的網站.com/travel-map/auth-callback.html'),
                "Deauthorize Callback URL: (可選)",
                "Data Deletion Request URL: (可選)"
            ]
        },
        {
            title: "添加測試用戶",
            description: "在開發階段添加測試用戶",
            action: "在 Instagram Basic Display > User Token Generator 添加測試用戶"
        },
        {
            title: "更新配置",
            description: "在此文件中更新您的配置",
            action: "將 YOUR_INSTAGRAM_APP_ID 替換為實際的 App ID"
        }
    ],
    
    troubleshooting: [
        {
            problem: "授權失敗",
            solutions: [
                "檢查 App ID 是否正確",
                "確認重定向 URI 完全匹配",
                "確保應用狀態為 'Live' 或正確添加了測試用戶"
            ]
        },
        {
            problem: "API 調用失敗",
            solutions: [
                "檢查訪問令牌是否有效",
                "確認請求的權限範圍正確",
                "檢查 API 調用頻率是否過高"
            ]
        },
        {
            problem: "地點信息缺失",
            solutions: [
                "確保 Instagram 貼文包含地點標記",
                "檢查貼文說明中的地點信息格式",
                "考慮手動添加地點到 KNOWN_LOCATIONS"
            ]
        }
    ]
};

// 工具函數
const ConfigUtils = {
    // 驗證配置完整性
    validateConfig() {
        const requiredFields = ['clientId', 'redirectUri', 'scope'];
        const missing = requiredFields.filter(field => 
            !INSTAGRAM_CONFIG[field] || INSTAGRAM_CONFIG[field].includes('YOUR_')
        );
        
        if (missing.length > 0) {
            console.warn('配置不完整，缺少或未更新的字段:', missing);
            return false;
        }
        
        return true;
    },
    
    // 獲取當前環境的重定向 URI
    getCurrentRedirectUri() {
        if (typeof window !== 'undefined') {
            return window.location.origin + window.location.pathname.replace('index.html', '') + 'auth-callback.html';
        }
        return INSTAGRAM_CONFIG.redirectUri;
    },
    
    // 檢查是否為開發環境
    isDevelopment() {
        return typeof window !== 'undefined' && 
               (window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1' ||
                window.location.hostname.includes('github.io'));
    },
    
    // 獲取完整的授權 URL
    getAuthorizationUrl() {
        const params = new URLSearchParams({
            client_id: INSTAGRAM_CONFIG.clientId,
            redirect_uri: this.getCurrentRedirectUri(),
            scope: INSTAGRAM_CONFIG.scope,
            response_type: 'code'
        });
        
        return `${INSTAGRAM_CONFIG.authURL}?${params.toString()}`;
    }
};

// 在瀏覽器環境中提供全域訪問
if (typeof window !== 'undefined') {
    window.INSTAGRAM_CONFIG = INSTAGRAM_CONFIG;
    window.KNOWN_LOCATIONS = KNOWN_LOCATIONS;
    window.ConfigUtils = ConfigUtils;
    
    // 開發環境下的配置驗證
    if (ConfigUtils.isDevelopment()) {
        console.log('Instagram API 配置載入完成');
        console.log('當前重定向 URI:', ConfigUtils.getCurrentRedirectUri());
        
        if (!ConfigUtils.validateConfig()) {
            console.error('❌ 配置驗證失敗！請檢查並更新您的 Instagram API 配置。');
            console.log('📋 設置指南:', SETUP_GUIDE);
        } else {
            console.log('✅ 配置驗證通過');
        }
    }
}
