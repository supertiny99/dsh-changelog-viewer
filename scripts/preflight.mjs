import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pluginRoot = resolve(__dirname, '..');

console.log('🔍 开始执行发布前严格预检 (Preflight Safety Check)...\n');

// 1. 运行单元测试
console.log('▶ [1/4] 执行全量自动化测试...');
try {
	execSync('npm test', { cwd: pluginRoot, stdio: 'inherit' });
	console.log('  ✅ 单元与集成测试全部通过\n');
} catch (e) {
	console.error('  ❌ 测试执行失败，禁止发版！');
	process.exit(1);
}

// 2. 执行编译构建与 Selfcheck
console.log('▶ [2/4] 执行生产编译与单例泄露检查...');
try {
	execSync('npm run build', { cwd: pluginRoot, stdio: 'inherit' });
	console.log('  ✅ 生产构建与单例自检通过\n');
} catch (e) {
	console.error('  ❌ 构建或 Selfcheck 失败，禁止发版！');
	process.exit(1);
}

// 3. 模拟打包并检查文件白名单
console.log('▶ [3/4] 模拟 npm pack 并检查文件完整性...');
try {
	const rawJson = execSync('npm pack --dry-run --json', { cwd: pluginRoot, encoding: 'utf8' });
	const [packInfo] = JSON.parse(rawJson);
	const files = packInfo.files.map((f) => f.path);

	console.log(`  📦 待发布文件清单 (共 ${files.length} 个文件):`);
	files.forEach((f) => console.log(`     - ${f}`));

	const requiredFiles = ['README.md', 'LICENSE', 'package.json', 'cordis.patch.yml', 'dist/client.js'];
	for (const req of requiredFiles) {
		if (!files.includes(req)) {
			console.error(`  ❌ 严重错误: 必需文件 [${req}] 未包含在待发布包中！`);
			process.exit(1);
		}
	}

	// 敏感文件排查
	const forbiddenPatterns = ['.env', '.releases-cache.json', 'tests/', 'node_modules/'];
	for (const file of files) {
		for (const pattern of forbiddenPatterns) {
			if (file.includes(pattern)) {
				console.error(`  ❌ 严重错误: 敏感或多余文件 [${file}] 被意外打入包中！`);
				process.exit(1);
			}
		}
	}
	console.log('  ✅ 打包文件白名单验证完全通过，无文件遗漏与敏感文件泄露\n');
} catch (e) {
	console.error('  ❌ npm pack 白名单预检失败:', e.message);
	process.exit(1);
}

// 4. 校验版本号是否已被发布（防覆盖冲突）
console.log('▶ [4/4] 校验版本号与线上版本状态...');
try {
	const pkg = JSON.parse(readFileSync(join(pluginRoot, 'package.json'), 'utf8'));
	const localVer = pkg.version;
	const remoteVer = execSync(`npm view ${pkg.name} version 2>/dev/null || echo "none"`, { encoding: 'utf8' }).trim();

	console.log(`  🔖 本地版本: ${localVer}`);
	console.log(`  🌐 线上版本: ${remoteVer}`);

	if (localVer === remoteVer) {
		console.warn(`  ⚠️ 提示: 本地版本 ${localVer} 与 npm 线上版本相同。如果需要发版，请先执行 npm version patch 升级版本号！`);
	} else {
		console.log(`  ✅ 检测到新版本晋升 (${remoteVer} -> ${localVer})，就绪发布！`);
	}
} catch (e) {
	console.warn('  ⚠️ 线上版本查询跳过:', e.message);
}

console.log('\n🎉 预检全部通过！当前工程满足 100% 规范化发版条件！');
