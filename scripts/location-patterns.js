// scripts/location-patterns.js
// 所有地點正則 pattern 與型別

const countryList = [
    'Japan','Nepal','France','UK','United Kingdom','Thailand','Indonesia','Taiwan','Korea','South Korea','USA','United States','Italy','Spain','Germany','Australia','Canada',
    'New Zealand','NZ','Switzerland','Swiss','Sweden','Norway','Portugal','Finland','Denmark','Netherlands','Belgium','Austria','Greece','Turkey','Czech','Czech Republic','Hungary','Poland','Ireland','Russia','Iceland','Estonia','Latvia','Lithuania','Slovakia','Slovenia','Croatia','Serbia','Romania','Bulgaria','Ukraine','Luxembourg','Liechtenstein','Monaco','San Marino','Andorra','Vatican','Malta','Cyprus','Monaco','Montenegro','Bosnia','Herzegovina','Macedonia','Albania','Moldova','Belarus','Georgia','Armenia','Azerbaijan','Portugal','Switzerland','Norway','New Zealand',
    // South American countries
    'Peru','Bolivia','Chile','Argentina','Brazil','Colombia','Venezuela','Ecuador','Uruguay','Paraguay','Guyana','Suriname','French Guiana',
    // North American countries
    'Mexico',
    // Asian countries
    'Malaysia','Singapore','Philippines','Vietnam','Cambodia','Laos','Myanmar','India','China','Hong Kong','Macau','Brunei',
    // Middle Eastern countries
    'UAE','United Arab Emirates','Dubai','Qatar','Kuwait','Bahrain','Oman','Saudi Arabia'
];

const locationPatterns = [
    // Explicit location markers (highest priority)
    { regex: /📍\s*([^•\n\r#@]+)/i, type: 'explicit' },
    { regex: /Location:\s*([^\n\r#@]+)/i, type: 'explicit' },
    { regex: /地點[:：]\s*([^\n\r#@]+)/i, type: 'explicit' },
    
    // Country•City format (high priority) - Updated to use correct bullet character
    { regex: /([A-Za-z ]+)\s*•\s*([A-Za-z ]+)/, type: 'country_dot_city' },
    
    // City, Country format (high priority)
    { regex: new RegExp(`([^#@\\n\\r,]+),\\s*(${countryList.join('|')})`, 'i'), type: 'city_country' },
    
    // Direct country names (high priority) - These should catch "Peru" first
    { regex: new RegExp(`^\\s*(${countryList.join('|')})\\s*`, 'i'), type: 'country' },
    { regex: new RegExp(`\\b(${countryList.join('|')})\\b`, 'i'), type: 'country' },
    
    // Specific city/location patterns
    { regex: /(Kathmandu|Pokhara|Lukla|Namche|Everest|Annapurna|Manaslu|Nepal|加德滿都|博卡拉|盧卡拉|南崎|聖母峰|安娜普納|馬納斯盧)/i, type: 'nepal_city' },
    { regex: /(Tokyo|Kyoto|Osaka|Hiroshima|Paris|London|New York|Bangkok|Bali|Taipei|Seoul|Rome|Barcelona|Berlin|Sydney|Vancouver|Toronto)/i, type: 'city' },
    { regex: /(Everest|Annapurna|Manaslu|富士山|玉山|阿里山)\s*(Base\s*Camp|基地營)?/i, type: 'mountain' },
    { regex: /(台北|新北|桃園|新竹|苗栗|台中|彰化|南投|雲林|嘉義|台南|高雄|屏東|宜蘭|花蓮|台東|澎湖|金門|馬祖)/i, type: 'taiwan_city' },
    { regex: /(東京|京都|大阪|名古屋|神戶|橫濱|札幌|福岡|廣島|奈良)/i, type: 'japan_city' },
    // Malaysia specific locations
    { regex: /(Kuala\s*Lumpur|吉隆坡|Penang|檳城|Malacca|馬六甲|Langkawi|蘭卡威|Kapailai|卡帕萊|Mabul|馬布島|Sipadan|詩巴丹|Sabah|沙巴|Sarawak|砂拉越)/i, type: 'malaysia_city' },
    // UAE/Dubai specific locations  
    { regex: /(Dubai|杜拜|Abu\s*Dhabi|阿布達比|Sharjah|沙迦|Ajman|阿治曼|Fujairah|富吉拉|Ras\s*Al\s*Khaimah|哈伊馬角|Umm\s*Al\s*Quwain|烏姆蓋萬)/i, type: 'uae_city' }
];

module.exports = { countryList, locationPatterns };
