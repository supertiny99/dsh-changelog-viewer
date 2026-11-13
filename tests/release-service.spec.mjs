import assert from 'node:assert/strict';
import { ReleaseService, normalizeVersion, parseReleaseBody, compareSemver } from '../src/release-service.js';

console.log('🧪 开始 ReleaseService 单元测试...');

// 1. 测试 normalizeVersion
assert.equal(normalizeVersion('dsh-v0.2.2-rc.2'), '0.2.2-rc.2');
assert.equal(normalizeVersion('v0.2.1-rc.5'), '0.2.1-rc.5');
assert.equal(normalizeVersion('0.1.0'), '0.1.0');
console.log('  ✓ normalizeVersion 正常');

// 2. 测试 compareSemver
assert.equal(compareSemver('0.2.2', '0.2.1'), 1);
assert.equal(compareSemver('0.2.1', '0.2.2'), -1);
assert.equal(compareSemver('0.2.2-rc.2', '0.2.2-rc.1'), 1);
assert.equal(compareSemver('0.2.2', '0.2.2-rc.2'), 1);
assert.equal(compareSemver('0.2.1-rc.5', '0.2.1-rc.5'), 0);
console.log('  ✓ compareSemver 正常');

// 3. 测试 parseReleaseBody
const sampleBody = `
[中文](#cn-test) | [English](#en-test)

<h3 id="cn-test">新增功能</h3>

- 支持全新工作台面板 @dev1
- 优化更新确认体验 @dev2

### 体验优化

- 修复样式 token 偶发缺失

<h3 id="en-test">Features</h3>

- Support new workbench panel
`;

const parsed = parseReleaseBody(sampleBody);
assert.ok(parsed.bodyCn.includes('新增功能'));
assert.ok(parsed.bodyCn.includes('支持全新工作台面板'));
assert.ok(parsed.bodyEn.includes('Features'));
assert.ok(parsed.highlights.length >= 2);
assert.equal(parsed.highlights[0], '支持全新工作台面板 @dev1');
console.log('  ✓ parseReleaseBody 中英文与高亮提取正常');

// 4. 测试 ReleaseService 种子加载与离线兜底
const testService = new ReleaseService({
	apiUrl: 'https://invalid.upstream.for.testing.local', // 故意无效，触发兜底
	cacheFile: '/tmp/test-releases-cache.json',
});

const result = await testService.getReleases(true);
assert.equal(result.ok, true);
assert.ok(Array.isArray(result.releases));
assert.ok(result.releases.length > 0);
assert.ok(result.releases[0].version);
assert.ok(['seed', 'disk', 'fallback-disk'].includes(result.source));
console.log(`  ✓ ReleaseService 兜底生效，成功获取 ${result.releases.length} 条记录 (source: ${result.source})`);

// 5. 测试 getReleaseByTag
const single = await testService.getReleaseByTag(result.releases[0].version);
assert.ok(single);
assert.equal(single.version, result.releases[0].version);
console.log('  ✓ getReleaseByTag 查找正常');

console.log('🎉 ReleaseService 全部单测通过！');
