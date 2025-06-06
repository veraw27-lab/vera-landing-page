// 🔒 安全的 Instagram 長期令牌交換 API - Vercel API Routes 示例
// 文件路径: api/instagram/long-lived-token.js

export default async function handler(req, res) {
    // 設置 CORS 標頭
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 處理 OPTIONS 預檢請求
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // 僅允許 POST 請求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { access_token } = req.body;

        if (!access_token) {
            return res.status(400).json({ 
                error: 'Missing required parameter: access_token' 
            });
        }

        // 🔒 使用環境變量中的客戶端密鑰
        const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;

        if (!clientSecret) {
            console.error('Missing Instagram client secret in environment variables');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        // 構建 URL 參數
        const params = new URLSearchParams({
            grant_type: 'ig_exchange_token',
            client_secret: clientSecret,
            access_token: access_token
        });

        // 🔒 安全地向 Instagram Graph API 請求長期令牌
        const response = await fetch(`https://graph.instagram.com/access_token?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Instagram Graph API error:', error);
            return res.status(response.status).json({ 
                error: 'Instagram Graph API error',
                details: response.statusText
            });
        }

        const tokenData = await response.json();

        // 🔒 只返回必要的數據給前端
        const secureTokenData = {
            access_token: tokenData.access_token,
            token_type: tokenData.token_type || 'bearer',
            expires_in: tokenData.expires_in
        };

        // 🔒 設置安全標頭
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

        return res.status(200).json(secureTokenData);

    } catch (error) {
        console.error('Long-lived token exchange error:', error);
        
        return res.status(500).json({ 
            error: 'Internal server error',
            message: 'Failed to process long-lived token exchange'
        });
    }
}
