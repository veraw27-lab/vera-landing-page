// config.js - Instagram API 配置文件
const INSTAGRAM_CONFIG = {
    // Instagram 應用 ID（從 Facebook Developer Console 獲取）
    clientId: '1056166989953102', // 你的實際 App ID
    
    // 重定向 URI（必須與 Facebook Developer Console 中配置的完全一致）
    redirectUri: window.location.origin + '/vera-landing-page/travel-map/auth-callback.html',
    
    // API 權限範圍
    scope: 'user_profile,user_media',
    
    // Instagram Graph API 基礎 URL
    baseURL: 'https://graph.instagram.com',
    
    // Instagram 授權 URL
    authURL: 'https://api.instagram.com/oauth/authorize',
    
    // 令牌交換 URL（需要後端支持）
    tokenURL: 'https://api.instagram.com/oauth/access_token'
};

// 本地儲存鍵名
const STORAGE_KEYS = {
    accessToken: 'instagram_access_token',
    tokenExpiry: 'instagram_token_expiry',
    travelData: 'travel_data',
    dataUpdated: 'travel_data_updated',
    userProfile: 'instagram_user_profile'
};

// 在瀏覽器環境中提供全域訪問
if (typeof window !== 'undefined') {
    window.INSTAGRAM_CONFIG = INSTAGRAM_CONFIG;
    window.STORAGE_KEYS = STORAGE_KEYS;
    
    console.log('✅ Instagram API 配置載入完成');
    console.log('📍 重定向 URI:', INSTAGRAM_CONFIG.redirectUri);
}
