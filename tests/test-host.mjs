import assert from 'node:assert/strict';
import { apply } from '../src/index.js';

console.log('🧪 开始 Host 端路由与服务集成测试 (基于真实 prefix 契约)...');

let registeredPrefixRoute = null;
const fakeServer = {
	register: (routeConfig) => {
		registeredPrefixRoute = routeConfig;
	},
};

const fakeCtx = {
	inject: (deps, callback) => {
		assert.ok(deps.includes('webServer'));
		callback({
			webServer: fakeServer,
			effect: (fn) => fn(),
		});
	},
};

apply(fakeCtx);

assert.ok(registeredPrefixRoute, '必须通过 webServer.register 注册路由');
assert.equal(registeredPrefixRoute.kind, 'prefix');
assert.equal(registeredPrefixRoute.path, '/changelog-viewer');
assert.equal(typeof registeredPrefixRoute.handler, 'function');
console.log('  ✓ webServer.register prefix 契约注册正常');

// 模拟 HTTP 请求测试函数
function simulateRequest(pathname, search = '') {
	return new Promise((resolve) => {
		const req = {
			method: 'GET',
			url: `${pathname}${search}`,
		};
		let statusCode = 200;
		let headers = {};
		let body = '';

		const res = {
			writeHead: (code, h) => {
				statusCode = code;
				headers = h;
			},
			end: (chunk) => {
				body += chunk || '';
				try {
					resolve({ statusCode, headers, data: JSON.parse(body) });
				} catch {
					resolve({ statusCode, headers, data: body });
				}
			},
		};

		registeredPrefixRoute.handler(req, res);
	});
}

// 1. 测试 GET /changelog-viewer/releases
const releasesRes = await simulateRequest('/changelog-viewer/releases');
assert.equal(releasesRes.statusCode, 200);
assert.equal(releasesRes.data.ok, true);
assert.ok(Array.isArray(releasesRes.data.releases));
assert.ok(releasesRes.data.releases.length > 0);
assert.ok(releasesRes.data.currentVersion);
console.log(`  ✓ GET /changelog-viewer/releases 正常 (获取到 ${releasesRes.data.releases.length} 个版本)`);

// 2. 测试 GET /changelog-viewer/release?version=...
const targetVersion = releasesRes.data.releases[0].version;
const singleRes = await simulateRequest('/changelog-viewer/release', `?version=${targetVersion}`);
assert.equal(singleRes.statusCode, 200);
assert.equal(singleRes.data.ok, true);
assert.equal(singleRes.data.release.version, targetVersion);
console.log(`  ✓ GET /changelog-viewer/release?version=${targetVersion} 正常`);

// 3. 测试 GET /changelog-viewer/status
const statusRes = await simulateRequest('/changelog-viewer/status');
assert.equal(statusRes.statusCode, 200);
assert.equal(statusRes.data.ok, true);
assert.ok(statusRes.data.releaseCount > 0);
console.log(`  ✓ GET /changelog-viewer/status 正常 (版本总数: ${statusRes.data.releaseCount})`);

// 4. 测试 404 分支
const notFoundRes = await simulateRequest('/changelog-viewer/non-existent');
assert.equal(notFoundRes.statusCode, 404);
console.log('  ✓ 404 未知路径响应正常');

console.log('🎉 Host 端路由与服务测试全部通过！');
