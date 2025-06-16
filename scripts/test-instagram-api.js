// 測試 Instagram API 的簡單腳本
const fetch = require('node-fetch');

async function testInstagramAPI() {
    console.log('🔍 測試 Instagram API 連接...');
    
    // 使用你說是有效的 token，但我們需要從環境變量獲取
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const businessAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || '29758989733746447';
    
    if (!accessToken) {
        console.error('❌ INSTAGRAM_ACCESS_TOKEN 環境變量未設置');
        console.log('請設置環境變量後重試：');
        console.log('export INSTAGRAM_ACCESS_TOKEN="your_token"');
        return;
    }
    
    console.log('📱 Business Account ID:', businessAccountId);
    console.log('🔑 Token 前10個字符:', accessToken.substring(0, 10) + '...');
    
    try {
        // 1. 測試 token 有效性
        console.log('\n1️⃣ 測試 Access Token...');
        const tokenTest = await fetch(`https://graph.instagram.com/v18.0/me?fields=id,username&access_token=${accessToken}`);
        const tokenData = await tokenTest.json();
        
        if (tokenData.error) {
            console.error('❌ Token 錯誤:', tokenData.error);
            return;
        } else {
            console.log('✅ Token 有效，用戶:', tokenData.username);
        }
        
        // 2. 測試媒體獲取
        console.log('\n2️⃣ 測試媒體獲取...');
        const mediaUrl = `https://graph.instagram.com/v18.0/${businessAccountId}/media?fields=id,caption,media_type,media_url,permalink,timestamp&limit=5&access_token=${accessToken}`;
        console.log('📡 API URL:', mediaUrl);
        
        const mediaResponse = await fetch(mediaUrl);
        const mediaData = await mediaResponse.json();
        
        if (mediaData.error) {
            console.error('❌ 媒體獲取錯誤:', mediaData.error);
            return;
        }
        
        console.log('✅ 成功獲取媒體數據');
        console.log('📊 媒體數量:', mediaData.data?.length || 0);
        
        if (mediaData.data && mediaData.data.length > 0) {
            console.log('\n📸 最新的 5 個貼文:');
            mediaData.data.forEach((post, index) => {
                console.log(`${index + 1}. ID: ${post.id}`);
                console.log(`   時間: ${post.timestamp}`);
                console.log(`   標題: ${post.caption?.substring(0, 50)}...`);
                console.log(`   URL: ${post.media_url?.substring(0, 80)}...`);
                console.log('');
            });
            
            // 檢查是否包含淡蘭古道貼文
            const danlanPost = mediaData.data.find(post => post.id === '18301973101172924');
            if (danlanPost) {
                console.log('✅ 找到淡蘭古道貼文！');
            } else {
                console.log('⚠️ 沒有找到淡蘭古道貼文 (ID: 18301973101172924)');
                console.log('可能需要獲取更多數據或檢查 Business Account 設置');
            }
        }
        
        // 3. 檢查分頁
        if (mediaData.paging?.next) {
            console.log('📄 有更多頁面數據可獲取');
        } else {
            console.log('📄 這是所有的媒體數據');
        }
        
    } catch (error) {
        console.error('❌ API 測試失敗:', error.message);
    }
}

// 運行測試
testInstagramAPI();
