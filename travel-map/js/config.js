// config.js - Instagram API 配置文件（僅前端安全配置）
const INSTAGRAM_CONFIG = {
    // Instagram 應用 ID（公開 ID，可以暴露在前端）
    clientId: '1056166989953102',
    
    // 重定向 URI（必須與 Facebook Developer Console 中配置的完全一致）
    redirectUri: window.location.origin + '/vera-landing-page/travel-map/auth-callback.html',
    
    // API 權限範圍
    scope: 'user_profile,user_media',
    
    // Instagram 授權 URL（公開 URL）
    authURL: 'https://api.instagram.com/oauth/authorize',
    
    // ⚠️ 注意：以下 URL 需要伺服器端處理，不應在前端直接調用
    // Instagram Graph API 基礎 URL
    baseURL: 'https://graph.instagram.com',
    
    // 🔒 後端 API 端點（用於安全的令牌交換）
    // 部署時請更新為實際的 API 端點 URL
    backendAPI: {
        tokenExchange: '/api/instagram/token-exchange',      // 令牌交換端點
        longLivedToken: '/api/instagram/long-lived-token',   // 長期令牌端點
        refreshToken: '/api/instagram/refresh-token'         // 令牌刷新端點
    }
    
    // ❌ 已永久移除 clientSecret - 絕不應該在前端暴露
    // 🔒 clientSecret 現在安全地存儲在後端環境變量中
};

// 🔒 安全的本地儲存鍵名（使用 sessionStorage 而非 localStorage）
const STORAGE_KEYS = {
    accessToken: 'instagram_access_token',
    tokenExpiry: 'instagram_token_expiry',
    userId: 'instagram_user_id',
    travelData: 'travel_data',
    dataUpdated: 'travel_data_updated',
    userProfile: 'instagram_user_profile'
};

// 🔒 安全工具函數
const SecurityUtils = {
    // 使用 sessionStorage 而非 localStorage（更安全）
    setSecureItem: (key, value) => {
        try {
            sessionStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
        } catch (error) {
            console.warn('Failed to store item securely:', error);
        }
    },
    
    getSecureItem: (key) => {
        try {
            const item = sessionStorage.getItem(key);
            if (!item) return null;
            
            // 嘗試解析 JSON，如果失敗則返回原始字符串
            try {
                return JSON.parse(item);
            } catch {
                return item;
            }
        } catch (error) {
            console.warn('Failed to retrieve item securely:', error);
            return null;
        }
    },
    
    removeSecureItem: (key) => {
        try {
            sessionStorage.removeItem(key);
        } catch (error) {
            console.warn('Failed to remove item securely:', error);
        }
    },
    
    // 清除所有敏感數據
    clearAllSecureData: () => {
        Object.values(STORAGE_KEYS).forEach(key => {
            SecurityUtils.removeSecureItem(key);
        });
    },
    
    // 檢查令牌是否過期
    isTokenExpired: () => {
        const expiry = SecurityUtils.getSecureItem(STORAGE_KEYS.tokenExpiry);
        if (!expiry) return true;
        
        const expiryDate = new Date(expiry);
        return expiryDate <= new Date();
    }
};

// 在瀏覽器環境中提供全域訪問
if (typeof window !== 'undefined') {
    window.INSTAGRAM_CONFIG = INSTAGRAM_CONFIG;
    window.STORAGE_KEYS = STORAGE_KEYS;
    window.SecurityUtils = SecurityUtils;
    
    // 🔒 安全初始化：頁面載入時清理過期令牌
    if (SecurityUtils.isTokenExpired()) {
        SecurityUtils.clearAllSecureData();
        console.warn('🔒 已清除過期的認證令牌');
    }
    
    // 🔒 安全監聽器：標籤頁關閉時自動清理
    window.addEventListener('beforeunload', () => {
        // 清除敏感數據，但保留用戶偏好設置
        SecurityUtils.removeSecureItem(STORAGE_KEYS.accessToken);
        SecurityUtils.removeSecureItem(STORAGE_KEYS.tokenExpiry);
        SecurityUtils.removeSecureItem(STORAGE_KEYS.userId);
    });
    
    // 🔒 安全檢查：定期驗證令牌狀態
    setInterval(() => {
        if (SecurityUtils.isTokenExpired()) {
            SecurityUtils.clearAllSecureData();
            console.warn('🔒 令牌已過期，已自動清理');
        }
    }, 60000); // 每分鐘檢查一次
    
    console.log('✅ Instagram API 配置載入完成');
    console.log('📍 重定向 URI:', INSTAGRAM_CONFIG.redirectUri);
    console.log('🔒 安全模式已啟用 - 使用 sessionStorage');
}
