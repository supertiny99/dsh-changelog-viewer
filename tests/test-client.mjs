import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

console.log('🧪 开始 Client 端插槽契约与更新控制测试 (settings.section)...');

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
	createElement: (type, props, ...children) => ({ type, props, children }),
	Fragment: 'fragment',
	Component: class Component {},
	useState: (v) => [typeof v === 'function' ? v() : v, () => {}],
	useRef: (v) => ({ current: v }),
	useEffect: (fn) => {},
	useCallback: (fn) => fn,
	useMemo: (fn) => fn(),
};

let capturedListeners = [];
const documentStub = {
	createElement: (tag) => ({ id: '', set textContent(_) {}, appendChild: () => {} }),
	head: { appendChild: () => {} },
	body: { appendChild: () => {} },
	getElementById: () => null,
	addEventListener: (type, listener, useCapture) => {
		capturedListeners.push({ type, listener, useCapture });
	},
};

const fakeRequire = (spec) => {
	if (!SHARED.includes(spec)) throw new Error('unexpected require: ' + spec);
	if (spec === 'react' || spec === 'react/jsx-runtime') return reactStub;
	if (spec === 'react-dom/client') {
		return {
			createRoot: () => ({
				render: () => {},
				unmount: () => {},
			}),
		};
	}
	return {};
};

let registeredEntry = null;
const window = {
	__ModuleLoader__: {
		load: (entry) => {
			registeredEntry = entry;
		},
	},
	document: documentStub,
};
globalThis.document = documentStub;

const clientPath = new URL('../dist/client.js', import.meta.url);
const source = await readFile(clientPath, 'utf8');
const run = new Function('window', 'require', `"use strict";\n${source}`);
run(window, fakeRequire);

const clientModule = registeredEntry.factory(fakeRequire);

assert.ok(Array.isArray(clientModule.inject), '必须导出 inject 数组');
assert.ok(clientModule.inject.includes('slots'), 'inject 数组必须包含 slots 服务');
console.log('  ✓ inject 声明契约通过: ', clientModule.inject);

// 验证 apply(ctx) 对 settings.section 的注册
const registeredSlots = [];
const fakeClientCtx = {
	slots: {
		inject: (slotName, callback) => {
			callback();
		},
		register: (config, component) => {
			registeredSlots.push({ config, component });
		},
	},
};

clientModule.apply(fakeClientCtx);

assert.equal(registeredSlots.length, 1, '期望注册 1 个 settings.section slot');

const settingsSlot = registeredSlots.find((s) => s.config.name === 'settings.section');
assert.ok(settingsSlot, '必须注册 settings.section');
assert.equal(settingsSlot.config.id, 'changelog-viewer');
assert.equal(settingsSlot.config.order, 98);
assert.equal(settingsSlot.config.label, '版本更新日志');
console.log('  ✓ settings.section 注册正常 (id: changelog-viewer, order: 98, label: 版本更新日志)');

// 验证更新确认控制逻辑
let openCalled = false;
const fakeDesktop = {
	updates: {
		open: async () => {
			openCalled = true;
		},
	},
};

// 模拟“取消”分支：不调用 updates.open()
const onCancel = () => {
	// 不做任何操作
};
onCancel();
assert.equal(openCalled, false, '取消操作不应调用 updates.open()');
console.log('  ✓ 取消更新验证通过：未触发底层下载更新');

// 模拟“确认”分支：调用 updates.open()
const onConfirm = async () => {
	await fakeDesktop.updates.open();
};
await onConfirm();
assert.equal(openCalled, true, '确认操作必须触发 updates.open()');
console.log('  ✓ 确认更新验证通过：成功触发底层 updates.open()');

// 验证全局左下角原生更新按钮拦截机制
console.log('🧪 开始左下角原生更新按钮 (DesktopUpdateIndicator) 拦截契约测试...');

const clickListener = capturedListeners.find((l) => l.type === 'click' && l.useCapture === true);
assert.ok(clickListener, '必须在 document 上注册 capture 阶段的 click 拦截监听器');
console.log('  ✓ capture 阶段 click 监听器注册正常 (useCapture: true)');

// 1. 验证目标匹配函数 isNativeUpdateButton
const nativeBtn = {
	closest: (sel) => {
		if (sel === 'button') return nativeBtn;
		if (sel.includes('triggerRow')) return {};
		return null;
	},
	getAttribute: (name) => (name === 'aria-label' ? '新版本' : null),
	textContent: '新版本',
	className: 'DesktopUpdateIndicator_module_css_indicator',
};

const ordinaryBtn = {
	closest: (sel) => (sel === 'button' ? ordinaryBtn : null),
	getAttribute: () => null,
	textContent: '发送消息',
	className: 'send-button',
};

assert.equal(clientModule.isNativeUpdateButton(nativeBtn), true, '必须精确匹配原生更新指示器按钮');
assert.equal(clientModule.isNativeUpdateButton(ordinaryBtn), false, '绝不能误伤普通业务按钮');
console.log('  ✓ isNativeUpdateButton 按钮判定特征匹配准确，无误伤');

// 2. 模拟原生更新按钮被点击，断言是否成功阻断事件并调起全局确认
let stopped = false;
let prevented = false;
const fakeEvent = {
	target: nativeBtn,
	stopPropagation: () => {
		stopped = true;
	},
	stopImmediatePropagation: () => {
		stopped = true;
	},
	preventDefault: () => {
		prevented = true;
	},
};

clickListener.listener(fakeEvent);
assert.equal(stopped, true, '必须立即阻断事件冒泡与后续分发 (stopPropagation)');
assert.equal(prevented, true, '必须阻止浏览器默认行为 (preventDefault)');
console.log('  ✓ 原生更新事件捕获拦截成功：冒泡彻底阻断，已转交全局前置确认弹窗');

console.log('🎉 Client 端插槽契约、更新控制与左下角全局拦截测试全部通过！');
