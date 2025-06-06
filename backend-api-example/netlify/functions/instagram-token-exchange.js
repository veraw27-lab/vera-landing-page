// 🔒 安全的 Instagram 令牌交換 API - Netlify Functions 示例
// 文件路径: netlify/functions/instagram-token-exchange.js

exports.handler = async (event, context) => {
    // 僅允許 POST 請求
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST'
            },
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { code, redirect_uri } = JSON.parse(event.body);

        if (!code || !redirect_uri) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*'
                },
                body: JSON.stringify({ 
                    error: 'Missing required parameters: code and redirect_uri' 
                })
            };
        }

        // 🔒 使用環境變量中的客戶端密鑰（絕不暴露在前端）
        const clientId = process.env.INSTAGRAM_CLIENT_ID;
        const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            console.error('Missing Instagram credentials in environment variables');
            return {
                statusCode: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*'
                },
                body: JSON.stringify({ error: 'Server configuration error' })
            };
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
            return {
                statusCode: response.status,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*'
                },
                body: JSON.stringify({ 
                    error: 'Instagram API error',
                    details: response.statusText
                })
            };
        }

        const tokenData = await response.json();

        // 🔒 只返回必要的數據給前端
        const secureTokenData = {
            access_token: tokenData.access_token,
            user_id: tokenData.user_id,
            // 不返回敏感信息如 client_secret
        };

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
                // 🔒 安全標頭
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY',
                'Referrer-Policy': 'strict-origin-when-cross-origin'
            },
            body: JSON.stringify(secureTokenData)
        };

    } catch (error) {
        console.error('Token exchange error:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*'
            },
            body: JSON.stringify({ 
                error: 'Internal server error',
                message: 'Failed to process token exchange'
            })
        };
    }
};
