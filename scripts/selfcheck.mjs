import { readFile } from 'node:fs/promises';

const SHARED = [
	'react',
	'react/jsx-runtime',
	'react-dom',
	'react-dom/client',
	'@deepseek-ai/cordis',
	'zod',
	'@tanstack/react-virtual',
	'@deepseek-ai/dsh-client-store',
	'@deepseek-ai/dsh-client-ui-slots',
	'@deepseek-ai/dsh-client-ui-primitives',
	'@deepseek-ai/dsh-client-ui-dockkit',
];

const reactStub = {
	createElement: (...args) => ({ args }),
	Fragment: 'fragment',
	Component: class Component {},
	useState: (v) => [typeof v === 'function' ? v() : v, () => {}],
	useRef: (v) => ({ current: v }),
	useEffect: () => {},
	useCallback: (fn) => fn,
	useMemo: (fn) => fn(),
};

const fakeRequire = (spec) => {
	if (!SHARED.includes(spec)) throw new Error('unexpected require: ' + spec);
	if (spec === 'react' || spec === 'react/jsx-runtime') return reactStub;
	return {};
};

let registered = null;
const fakeLoader = {
	load: (entry) => {
		registered = entry;
	},
};
const window = { __ModuleLoader__: fakeLoader };

const source = await readFile('dist/client.js', 'utf8');
const run = new Function('window', 'require', `"use strict";\n${source}`);
run(window, fakeRequire);

const failures = [];

// 校验 1: 读取 meta.json 严查 external 依赖泄漏
try {
	const metaRaw = await readFile('dist/meta.json', 'utf8');
	const meta = JSON.parse(metaRaw);
	const leakedInputs = Object.keys(meta.inputs || {}).filter(
		(key) => key.includes('node_modules/react/') || key.includes('node_modules/react-dom/')
	);
	if (leakedInputs.length > 0) {
		failures.push(`React 依赖意外打入 bundle (泄漏 inputs: ${leakedInputs.join(', ')})`);
	}
} catch (e) {
	failures.push(`无法读取 dist/meta.json: ${e.message}`);
}

// 校验 2: 验证 ModuleLoader 工厂包装与返回
if (!registered || registered.id !== '@supertiny99/dsh-changelog-viewer') {
	failures.push(`注册 id 异常: ${registered?.id}`);
}
if (typeof registered?.factory !== 'function') {
	failures.push('factory 必须为函数');
}

const mod = registered?.factory(fakeRequire);
if (!mod || typeof mod.apply !== 'function') {
	failures.push('factory 执行必须导出 apply(ctx) 函数');
}
if (!mod || !Array.isArray(mod.inject) || !mod.inject.includes('slots')) {
	failures.push('必须导出 inject 数组并显式包含 "slots"，否则 Cordis 会抛出 "cannot get property slots without inject" 异常');
}

if (failures.length > 0) {
	console.error('Selfcheck 失败:');
	for (const f of failures) console.error('  ✕', f);
	process.exit(1);
}

console.log('Selfcheck 通过: 外部单例无泄漏，ModuleLoader 契约符合规范，apply 导出正常。');
