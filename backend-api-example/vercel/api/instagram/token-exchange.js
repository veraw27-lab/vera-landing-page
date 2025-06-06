// 🔒 安全的 Instagram 令牌交換 API - Vercel API Routes 示例
// 文件路径: api/instagram/token-exchange.js

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
        const { code, redirect_uri } = req.body;

        if (!code || !redirect_uri) {
            return res.status(400).json({ 
                error: 'Missing required parameters: code and redirect_uri' 
            });
        }

        // 🔒 使用環境變量中的客戶端密鑰（絕不暴露在前端）
        const clientId = process.env.INSTAGRAM_CLIENT_ID;
        const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            console.error('Missing Instagram credentials in environment variables');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        // 創建表單數據
        const formData = new URLSearchParams();
        formData.append('client_id', clientId);
        formData.append('client_secret', clientSecret);
        formData.append('grant_type', 'authorization_code');
        formData.append('redirect_uri', redirect_uri);
        formData.append('code', code);

        // 🔒 安全地向 Instagram API 請求令牌
        const response = await fetch('https://api.instagram.com/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData.toString()
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Instagram API error:', error);
            return res.status(response.status).json({ 
                error: 'Instagram API error',
                details: response.statusText
            });
        }

        const tokenData = await response.json();

        // 🔒 只返回必要的數據給前端
        const secureTokenData = {
            access_token: tokenData.access_token,
            user_id: tokenData.user_id,
            // 不返回敏感信息如 client_secret
        };

        // 🔒 設置安全標頭
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

        return res.status(200).json(secureTokenData);

    } catch (error) {
        console.error('Token exchange error:', error);
        
        return res.status(500).json({ 
            error: 'Internal server error',
            message: 'Failed to process token exchange'
        });
    }
}
