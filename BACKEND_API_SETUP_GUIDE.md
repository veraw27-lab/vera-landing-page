# 🔒 安全後端 API 實現指南

## 快速部署指南

### 方法 1：Netlify Functions

1. **創建 Netlify 配置文件**
```toml
# netlify.toml
[build]
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "18"

[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' https://d3js.org https://unpkg.com; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; connect-src 'self' https://graph.instagram.com https://api.instagram.com;"
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

2. **設置環境變量**
在 Netlify 控制面板中設置：
- `INSTAGRAM_CLIENT_ID`: 您的 Instagram 客戶端 ID
- `INSTAGRAM_CLIENT_SECRET`: 您的 Instagram 客戶端密鑰
- `FRONTEND_URL`: 您的前端域名 (例如 https://yoursite.netlify.app)

3. **部署 Functions**
將 `backend-api-example/netlify/functions/` 文件夾複製到您的項目根目錄。

### 方法 2：Vercel API Routes

1. **創建 API 路由**
```javascript
// api/instagram/token-exchange.js
import { tokenExchangeHandler } from '../../backend-api-example/vercel/token-exchange';
export default tokenExchangeHandler;

// api/instagram/long-lived-token.js  
import { longLivedTokenHandler } from '../../backend-api-example/vercel/long-lived-token';
export default longLivedTokenHandler;
```

2. **設置環境變量**
在 Vercel 控制面板中設置相同的環境變量。

### 方法 3：自主託管 Node.js 服務器

1. **創建 Express 服務器**
```javascript
// server.js
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// 導入 API 處理器
const { tokenExchange } = require('./api/token-exchange');
const { longLivedToken } = require('./api/long-lived-token');

app.post('/api/instagram/token-exchange', tokenExchange);
app.post('/api/instagram/long-lived-token', longLivedToken);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`安全 API 服務器運行在端口 ${PORT}`);
});
```

## 🔐 環境變量安全設置

### GitHub Actions Secrets vs Runtime Environment

**GitHub Actions Secrets 的限制：**
- ❌ 只在構建時可用，不在運行時可用
- ❌ 無法保護前端代碼中的敏感信息
- ❌ 不適合需要實時 API 調用的場景

**運行時環境變量的優勢：**
- ✅ 在伺服器運行時安全可用
- ✅ 絕不暴露給前端用戶
- ✅ 支持動態令牌交換
- ✅ 符合 OAuth 2.0 安全標準

### 配置示例

```bash
# 在部署平台設置這些環境變量
INSTAGRAM_CLIENT_ID=1056166989953102
INSTAGRAM_CLIENT_SECRET=your_actual_secret_here
FRONTEND_URL=https://vera-travel-map.netlify.app
NODE_ENV=production
```

## 🛡️ 安全檢查清單

### ✅ 已完成的安全修復

1. **移除前端敏感信息**
   - ✅ 從 `config.js` 中移除 `clientSecret`
   - ✅ 從 `auth-callback.html` 中移除 `clientSecret`
   - ✅ 添加安全配置註釋

2. **改進令牌存儲**
   - ✅ 使用 `sessionStorage` 替代 `localStorage`
   - ✅ 添加自動清理機制
   - ✅ 實現令牌過期檢查

3. **後端 API 架構**
   - ✅ 創建安全的令牌交換 API
   - ✅ 實現長期令牌獲取 API
   - ✅ 添加適當的錯誤處理

### 🔄 待完成的步驟

1. **部署後端 API**
   - [ ] 選擇部署平台 (Netlify/Vercel/AWS)
   - [ ] 設置環境變量
   - [ ] 測試 API 端點

2. **更新前端配置**
   - [ ] 配置正確的 API 端點 URL
   - [ ] 測試完整的授權流程

3. **安全加固**
   - [ ] 添加速率限制
   - [ ] 實現 CSRF 保護
   - [ ] 添加日誌記錄

## 📞 需要幫助？

如果您需要協助部署或配置，請提供：
1. 您偏好的部署平台
2. 您的 Instagram 應用配置
3. 任何遇到的具體錯誤信息

## 🔍 測試您的安全配置

### 1. 檢查前端代碼
```bash
# 搜索是否還有暴露的敏感信息
grep -r "clientSecret\|client_secret" travel-map/
```

### 2. 驗證 API 端點
```bash
# 測試令牌交換端點
curl -X POST https://your-api-endpoint.com/api/instagram/token-exchange \
  -H "Content-Type: application/json" \
  -d '{"code":"test_code","redirect_uri":"https://your-site.com"}'
```

### 3. 監控網絡請求
在瀏覽器開發者工具中檢查：
- 是否有敏感信息在網絡請求中暴露
- API 請求是否正確路由到後端
- 令牌是否正確存儲在 sessionStorage 中
