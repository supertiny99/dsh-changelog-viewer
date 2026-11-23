import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
	resolveUpdateChannel,
	buildChannelFileUrl,
	parseFeedYaml,
	deriveSyncStates,
	readHostUpdateConfig,
	FeedProbeService,
} from '../src/feed-service.js';
import { compareSemver } from '../src/release-service.js';

console.log('🧪 开始 FeedProbeService 单元测试...');

// 1. buildChannelFileUrl（WP0 钉死的 electron-updater 命名规则：darwin 后缀 -mac，arch 不进文件名）
assert.equal(
	buildChannelFileUrl('https://download.deepseek.com/dsh-desk/feeds/mac-arm64/', 'nightly', 'darwin'),
	'https://download.deepseek.com/dsh-desk/feeds/mac-arm64/nightly-mac.yml'
);
assert.equal(
	buildChannelFileUrl('https://download.deepseek.com/dsh-desk/feeds/mac-arm64', 'stable', 'darwin'),
	'https://download.deepseek.com/dsh-desk/feeds/mac-arm64/stable-mac.yml',
	'WP0 实证：channel setter 原样存储，stable → stable-mac.yml（非 latest-mac.yml）'
);
assert.equal(
	buildChannelFileUrl('https://feed.example.test/feeds/win64/', 'stable', 'win32'),
	'https://feed.example.test/feeds/win64/stable.yml'
);
assert.equal(
	buildChannelFileUrl(null, 'nightly', 'darwin'),
	'https://download.deepseek.com/dsh-desk/feeds/mac-arm64/nightly-mac.yml',
	'base 缺失回退内置官方地址'
);
console.log('  ✓ buildChannelFileUrl 通道清单命名规则正常');

// 2. resolveUpdateChannel 三级优先（manifest > app-update.yml > 缺省 nightly），非法值与宿主同款判错
assert.equal(resolveUpdateChannel({ manifest: { dshDesktopUpdateChannel: 'stable' } }), 'stable');
assert.equal(resolveUpdateChannel({ manifest: { dshDesktopUpdateChannel: 'nightly' }, appUpdateYml: { channel: 'stable' } }), 'nightly');
assert.equal(resolveUpdateChannel({ manifest: {}, appUpdateYml: { channel: 'stable' } }), 'stable');
assert.equal(resolveUpdateChannel({ appUpdateYml: { channel: 'nightly' } }), 'nightly');
assert.equal(resolveUpdateChannel({}), 'nightly');
assert.throws(() => resolveUpdateChannel({ manifest: { dshDesktopUpdateChannel: 'beta' } }), /invalid packaged channel/);
assert.throws(() => resolveUpdateChannel({ appUpdateYml: { channel: 'dev' } }), /invalid packaged channel/);
console.log('  ✓ resolveUpdateChannel 三级优先与非法值判错正常');

// 3. parseFeedYaml（真实清单结构样例 / HTML 回落页 / 坏输入）
const realFeedYml = `version: 0.2.2-rc.5
files:
  - url: >-
      https://download.deepseek.com/dsh-desk/bin/mac-arm64/deepseek-harness-0.2.2-rc.5-mac-arm64.zip
    size: 362852032
path: >-
  https://download.deepseek.com/dsh-desk/bin/mac-arm64/deepseek-harness-0.2.2-rc.5-mac-arm64.zip
stagingPercentage: 100
releaseDate: '2026-11-18T11:45:57.670Z'
`;
const parsedFeed = parseFeedYaml(realFeedYml);
assert.equal(parsedFeed.version, '0.2.2-rc.5');
assert.equal(parsedFeed.stagingPercentage, 100);
assert.equal(parseFeedYaml('<!doctype html><html lang="en"><title>DeepSeek App</title></html>'), null, 'CDN 404 回落 SPA HTML 页必须判清单缺失');
assert.equal(parseFeedYaml('version: not-a-semver'), null);
assert.equal(parseFeedYaml('files: []\n'), null);
assert.equal(parseFeedYaml(''), null);
const stagingFeed = parseFeedYaml("version: 0.2.3-alpha.2\nstagingPercentage: 50\n");
assert.equal(stagingFeed.version, '0.2.3-alpha.2');
assert.equal(stagingFeed.stagingPercentage, 50);
const noStagingFeed = parseFeedYaml('version: 0.2.2-rc.5\n');
assert.equal(noStagingFeed.version, '0.2.2-rc.5');
assert.equal(noStagingFeed.stagingPercentage, null, 'stagingPercentage 缺失不致命');
console.log('  ✓ parseFeedYaml 结构校验与 HTML 回落判定正常');

// 4. deriveSyncStates 三态判定矩阵（口径对齐宿主 compareSemver）
const matrixReleases = [{ version: '0.2.3-alpha.2' }, { version: '0.2.2-rc.5' }, { version: '0.2.2-rc.4' }];
assert.deepEqual(deriveSyncStates('0.2.2-rc.5', matrixReleases, compareSemver), ['pending', 'pushed', 'pushed']);
assert.deepEqual(deriveSyncStates('0.2.3-alpha.2', matrixReleases, compareSemver), ['pushed', 'pushed', 'pushed']);
assert.deepEqual(deriveSyncStates('0.2.3-alpha.1', matrixReleases, compareSemver), ['pending', 'pushed', 'pushed'], '同主版本 pre 段 alpha.1 < alpha.2');
assert.deepEqual(deriveSyncStates(null, matrixReleases, compareSemver), ['unknown', 'unknown', 'unknown']);
assert.deepEqual(deriveSyncStates('0.2.2-rc.5', matrixReleases, undefined), ['unknown', 'unknown', 'unknown']);
console.log('  ✓ deriveSyncStates 判定矩阵正常');

// 5. FeedProbeService：200 正常解析 + TTL 不重复请求 + force 绕过
let fetchCount = 0;
const goodYml = 'version: 0.2.2-rc.5\nstagingPercentage: 100\n';
const okService = new FeedProbeService({
	resourcesPath: '/nonexistent-resources-path-for-test',
	fetchImpl: async () => {
		fetchCount += 1;
		return { status: 200, headers: { get: () => null }, text: async () => goodYml };
	},
});
const snap1 = await okService.ensureFresh(true);
assert.equal(snap1.state, 'ok');
assert.equal(snap1.version, '0.2.2-rc.5');
assert.equal(snap1.channel, 'nightly');
assert.equal(snap1.feedBaseUrl, 'https://download.deepseek.com/dsh-desk/feeds/mac-arm64/');
await okService.ensureFresh(false);
assert.equal(fetchCount, 1, 'TTL 窗口内不得重复请求（AC5）');
await okService.ensureFresh(true);
assert.equal(fetchCount, 2, 'force 必须绕过 TTL');
console.log('  ✓ 200 解析与 TTL/force 请求纪律正常');

// 6. 失败落缓存退避（AC5：TTL 窗口内失败不重复请求）
let failCount = 0;
const failService = new FeedProbeService({
	resourcesPath: null,
	fetchImpl: async () => {
		failCount += 1;
		throw new Error('network down');
	},
});
const failSnap = await failService.ensureFresh(true);
assert.equal(failSnap.state, 'unavailable');
assert.ok(String(failSnap.reason).includes('network down'));
await failService.ensureFresh(false);
assert.equal(failCount, 1, '失败同样落缓存，TTL 窗口内不重复请求');
console.log('  ✓ 失败退避（落缓存）正常');

// 7. HTML 回落页 / 404 / 非法 YAML 均收敛 unavailable
const htmlService = new FeedProbeService({
	resourcesPath: null,
	fetchImpl: async () => ({ status: 200, headers: { get: () => null }, text: async () => '<!doctype html><html>DeepSeek App</html>' }),
});
const htmlSnap = await htmlService.ensureFresh(true);
assert.equal(htmlSnap.state, 'unavailable');
assert.equal(htmlSnap.reason, 'invalid-feed-payload');

const notFoundService = new FeedProbeService({
	resourcesPath: null,
	fetchImpl: async () => ({ status: 404, headers: { get: () => null }, text: async () => 'x' }),
});
assert.equal((await notFoundService.ensureFresh(true)).reason, 'http-404');
console.log('  ✓ 异常清单静默降级 unavailable 正常');

// 8. 304 续期
let calls304 = 0;
const svc304 = new FeedProbeService({
	resourcesPath: null,
	fetchImpl: async () => {
		calls304 += 1;
		if (calls304 === 1) {
			return { status: 200, headers: { get: (k) => (String(k).toLowerCase() === 'etag' ? 'W/"abc"' : null) }, text: async () => goodYml };
		}
		return { status: 304, headers: { get: () => null }, text: async () => '' };
	},
});
await svc304.ensureFresh(true);
const renewed = await svc304.ensureFresh(true);
assert.equal(renewed.state, 'ok');
assert.equal(renewed.version, '0.2.2-rc.5', '304 必须续期现有缓存版本');
console.log('  ✓ 304 续期正常');

// 9. readHostUpdateConfig：真实临时 app-update.yml 解析与探针 URL 装配
const tmpDir = mkdtempSync(join(tmpdir(), 'dsh-feed-test-'));
writeFileSync(
	join(tmpDir, 'app-update.yml'),
	"provider: generic\nurl: https://feed.example.test/feeds/mac-arm64/\nchannel: nightly\nupdaterCacheDirName: 'x-updater'\n"
);
const cfg = readHostUpdateConfig(tmpDir);
assert.equal(cfg.manifest, null);
assert.equal(cfg.appUpdateYml.channel, 'nightly');
assert.equal(cfg.feedBaseUrl, 'https://feed.example.test/feeds/mac-arm64/');
const tmpService = new FeedProbeService({
	resourcesPath: tmpDir,
	fetchImpl: async (url) => {
		// 平台解耦（pr-CHG-001 教训二次应用）：后缀随运行平台（darwin '-mac' / 其他 ''），
		// 期望值引产品装配函数同源计算，宿主 url 配置采纳仍以硬编码 base 断言
		assert.equal(
			url,
			buildChannelFileUrl('https://feed.example.test/feeds/mac-arm64/', 'nightly'),
			'必须按宿主配置 url + channel 拼装清单地址'
		);
		return { status: 200, headers: { get: () => null }, text: async () => goodYml };
	},
});
assert.equal((await tmpService.ensureFresh(true)).state, 'ok');
rmSync(tmpDir, { recursive: true, force: true });
console.log('  ✓ 宿主配置读取与探针 URL 装配正常');

// 10. hydrate/snapshot：磁盘缓存恢复后 TTL 内不得再发请求
const hydrateService = new FeedProbeService({
	resourcesPath: null,
	fetchImpl: async () => {
		throw new Error('hydrate 后 TTL 内不应发起请求');
	},
});
hydrateService.hydrate({ version: '0.2.2-rc.5', state: 'ok', channel: 'nightly', lastFetchedAt: Date.now() });
const hydSnap = await hydrateService.ensureFresh(false);
assert.equal(hydSnap.state, 'ok');
assert.equal(hydSnap.version, '0.2.2-rc.5');
console.log('  ✓ hydrate/snapshot 缓存恢复正常');

console.log('🎉 FeedProbeService 全部单测通过！');
