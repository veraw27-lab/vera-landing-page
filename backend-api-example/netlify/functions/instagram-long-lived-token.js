// 🔒 安全的 Instagram 長期令牌交換 API - Netlify Functions 示例
// 文件路径: netlify/functions/instagram-long-lived-token.js

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
        const { access_token } = JSON.parse(event.body);

        if (!access_token) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*'
                },
                body: JSON.stringify({ 
                    error: 'Missing required parameter: access_token' 
                })
            };
        }

        // 🔒 使用環境變量中的客戶端密鑰
        const clientSecret = process.env.INSTAGRAM_CLIENT_SECRET;

        if (!clientSecret) {
            console.error('Missing Instagram client secret in environment variables');
            return {
                statusCode: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*'
                },
                body: JSON.stringify({ error: 'Server configuration error' })
            };
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
            return {
                statusCode: response.status,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*'
                },
                body: JSON.stringify({ 
                    error: 'Instagram Graph API error',
                    details: response.statusText
                })
            };
        }

        const tokenData = await response.json();

        // 🔒 只返回必要的數據給前端
        const secureTokenData = {
            access_token: tokenData.access_token,
            token_type: tokenData.token_type || 'bearer',
            expires_in: tokenData.expires_in
        };

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
                // 🔒 安全標頭
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY',
                'Referrer-Policy': 'strict-origin-when-cross-origin',
                'Cache-Control': 'no-store, no-cache, must-revalidate'
            },
            body: JSON.stringify(secureTokenData)
        };

    } catch (error) {
        console.error('Long-lived token exchange error:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*'
            },
            body: JSON.stringify({ 
                error: 'Internal server error',
                message: 'Failed to process long-lived token exchange'
            })
        };
    }
};
