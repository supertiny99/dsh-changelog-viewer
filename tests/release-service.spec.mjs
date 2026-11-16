import assert from 'node:assert/strict';
import {
	ReleaseService,
	normalizeVersion,
	parseReleaseBody,
	compareSemver,
	detectHostVersion,
} from '../src/release-service.js';

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

// 4. 测试 detectHostVersion
const mockEnvVersion = detectHostVersion({ env: { DSH_CLIENT_VERSION: 'v0.9.9' } });
assert.equal(mockEnvVersion, '0.9.9', '环境变量 DSH_CLIENT_VERSION 必须优先被提取且归一化');

const detectedRealVersion = detectHostVersion();
assert.ok(detectedRealVersion, '必须探测出非空宿主版本');
assert.match(detectedRealVersion, /^\d+\.\d+\.\d+/, '探测版本必须符合 semver 格式');
console.log(`  ✓ detectHostVersion 动态探针正常 (探测到真实宿主版本: ${detectedRealVersion})`);

// 5. 测试 ReleaseService 种子加载与离线兜底
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

// 6. 测试 getReleaseByTag
const single = await testService.getReleaseByTag(result.releases[0].version);
assert.ok(single);
assert.equal(single.version, result.releases[0].version);
console.log('  ✓ getReleaseByTag 查找正常');

// 7. 测试核心场景：模拟用户确认升级并重启后，当前安装版本实时切换且 hasUpdate/isCurrent 自动自愈
console.log('🧪 开始测试升级重启前后版本即时自愈场景...');
let currentSimulatedVersion = '0.2.1-rc.5'; // 升级前
const dynamicService = new ReleaseService({
	apiUrl: 'https://invalid.upstream.for.testing.local',
	cacheFile: '/tmp/test-dynamic-cache.json',
	detectVersionFn: () => currentSimulatedVersion,
});

// 7.1 升级前请求
const beforeUpgrade = await dynamicService.getReleases(true);
assert.equal(beforeUpgrade.currentVersion, '0.2.1-rc.5');
assert.equal(beforeUpgrade.hasUpdate, true, '旧版本必须提示有新版本');
const latestVer = beforeUpgrade.latestVersion;
const latestReleaseItemBefore = beforeUpgrade.releases.find((r) => r.version === latestVer);
assert.equal(latestReleaseItemBefore.isCurrent, false, '最新版本在升级前不应是当前版本');

// 7.2 模拟升级完成并重启应用：宿主环境版本晋升为 latestVer
currentSimulatedVersion = latestVer;
// 不使用 force，直接命中内部缓存或磁盘缓存
const afterUpgrade = await dynamicService.getReleases(false);
assert.equal(afterUpgrade.currentVersion, latestVer, '升级重启后，即便命中缓存，当前版本必须即时变为新版本');
assert.equal(afterUpgrade.hasUpdate, false, '升级重启后，已是最新版本，hasUpdate 必须变为 false');
const latestReleaseItemAfter = afterUpgrade.releases.find((r) => r.version === latestVer);
assert.equal(latestReleaseItemAfter.isCurrent, true, '升级重启后，最新版本项必须标记为 isCurrent: true');
console.log('  ✓ 升级重启前后版本即时自愈验证完全通过 (0.2.1-rc.5 -> ' + latestVer + ')');

console.log('🎉 ReleaseService 全部单测通过！');
