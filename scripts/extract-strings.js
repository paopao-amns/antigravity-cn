/**
 * Antigravity String Extractor
 * Automatically extracts candidate UI strings from a live Antigravity web bundle.
 * Usage: node scripts/extract-strings.js [port]
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const port = process.argv[2] || 58944;
const url = `https://127.0.0.1:${port}/main.js`;

console.log(`[Extractor] 正在从 ${url} 获取前端资源 bundle...`);

const agent = new https.Agent({ rejectUnauthorized: false });

https.get(url, { agent }, (res) => {
  if (res.statusCode !== 200) {
    console.error(`❌ 获取失败: HTTP 状态码 ${res.statusCode}`);
    process.exit(1);
  }

  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`[Extractor] 成功获取前端 bundle (大小: ${(data.length / 1024 / 1024).toFixed(2)} MB)`);

    const extracted = new Set();
    const attrPatterns = [
      /title:\s*"([^"]{2,80})"/g,
      /tooltip:\s*"([^"]{2,80})"/g,
      /placeholder:\s*"([^"]{2,80})"/g,
      /label:\s*"([^"]{2,80})"/g,
      /aria-label:\s*"([^"]{2,80})"/g,
      /heading:\s*"([^"]{2,80})"/g,
      /description:\s*"([^"]{3,120})"/g,
    ];

    for (const pat of attrPatterns) {
      let match;
      while ((match = pat.exec(data)) !== null) {
        const val = match[1].trim();
        if (val.length > 2 && !val.startsWith('/') && !val.startsWith('http') && (' ' in val || /^[A-Z]/.test(val))) {
          extracted.add(val);
        }
      }
    }

    const outputPath = path.resolve(__dirname, '../locales/extracted-new-strings.json');
    const sorted = Array.from(extracted).sort();
    fs.writeFileSync(outputPath, JSON.stringify(sorted, null, 2), 'utf8');

    console.log(`✓ 已提取 ${sorted.length} 个候选文本词条，保存至: ${outputPath}`);
  });
}).on('error', (err) => {
  console.error(`❌ 网络请求失败: ${err.message}`);
});
