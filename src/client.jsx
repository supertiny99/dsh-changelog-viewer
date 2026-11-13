import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import cssText from './style.css';

// 注入样式单例
let styleInjected = false;
function ensureStyles() {
	if (styleInjected || typeof document === 'undefined') return;
	const style = document.createElement('style');
	style.textContent = cssText;
	document.head.appendChild(style);
	styleInjected = true;
}

/**
 * 轻量 Markdown 渲染器
 */
function MarkdownView({ content = '' }) {
	const rendered = useMemo(() => {
		if (!content) return null;

		const lines = content.split('\n');
		const elements = [];
		let currentList = [];
		let keyIdx = 0;

		const flushList = () => {
			if (currentList.length > 0) {
				elements.push(
					<ul key={`ul-${keyIdx++}`} className="cl-md-list">
						{currentList.map((item, i) => (
							<li key={i} className="cl-md-list-item">
								{renderInline(item)}
							</li>
						))}
					</ul>
				);
				currentList = [];
			}
		};

		// 行内解析器: 处理加粗、代码、@贡献者
		const renderInline = (text) => {
			const parts = [];
			let cursor = 0;
			const regex = /(\*\*.*?\*\*|`.*?`|@[a-zA-Z0-9_-]+)/g;
			let match;

			while ((match = regex.exec(text)) !== null) {
				if (match.index > cursor) {
					parts.push(text.slice(cursor, match.index));
				}
				const token = match[0];
				if (token.startsWith('**') && token.endsWith('**')) {
					parts.push(<strong key={cursor}>{token.slice(2, -2)}</strong>);
				} else if (token.startsWith('`') && token.endsWith('`')) {
					parts.push(<code key={cursor} className="cl-md-code">{token.slice(1, -1)}</code>);
				} else if (token.startsWith('@')) {
					parts.push(<span key={cursor} className="cl-md-author">{token}</span>);
				}
				cursor = regex.lastIndex;
			}
			if (cursor < text.length) {
				parts.push(text.slice(cursor));
			}
			return parts.length > 0 ? parts : text;
		};

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i].trim();
			if (!line) {
				flushList();
				continue;
			}

			if (line.startsWith('### ') || line.startsWith('<h3')) {
				flushList();
				const text = line.replace(/<[^>]+>/g, '').replace(/^###\s*/, '');
				elements.push(
					<h3 key={`h3-${keyIdx++}`} className="cl-md-h3">
						{text}
					</h3>
				);
			} else if (line.startsWith('## ') || line.startsWith('<h2')) {
				flushList();
				const text = line.replace(/<[^>]+>/g, '').replace(/^##\s*/, '');
				elements.push(
					<h2 key={`h2-${keyIdx++}`} className="cl-md-h2">
						{text}
					</h2>
				);
			} else if (line.startsWith('- ') || line.startsWith('* ')) {
				currentList.push(line.replace(/^[-*]\s+/, ''));
			} else if (line.startsWith('> ')) {
				flushList();
				elements.push(
					<blockquote key={`bq-${keyIdx++}`} className="cl-md-blockquote">
						{renderInline(line.replace(/^>\s*/, ''))}
					</blockquote>
				);
			} else {
				flushList();
				if (!line.startsWith('[中文]') && !line.startsWith('<p')) {
					elements.push(
						<p key={`p-${keyIdx++}`} style={{ margin: '6px 0' }}>
							{renderInline(line)}
						</p>
					);
				}
			}
		}
		flushList();
		return elements;
	}, [content]);

	return <div>{rendered}</div>;
}

/**
 * 新版本更新前置确认弹窗
 */
function UpdateConfirmModal({ release, onClose, onConfirm }) {
	const [confirming, setConfirming] = useState(false);

	if (!release) return null;

	const handleConfirm = async () => {
		setConfirming(true);
		try {
			await onConfirm();
		} finally {
			setConfirming(false);
			onClose();
		}
	};

	return (
		<div className="cl-modal-overlay" onClick={onClose}>
			<div className="cl-modal" onClick={(e) => e.stopPropagation()}>
				<div className="cl-modal-header">
					<h3 className="cl-modal-title">发现 DSH 官方新版本：{release.name || release.version}</h3>
					<button className="cl-refresh-btn" onClick={onClose}>✕</button>
				</div>
				<div className="cl-modal-body">
					<div className="cl-modal-notice">
						<strong>升级把控提醒：</strong> 为避免意外不兼容，请先审阅本次更新改动，确认符合预期后再开始下载升级。
					</div>

					<div className="cl-highlights-title">✨ 本次更新核心重点：</div>
					{release.highlights && release.highlights.length > 0 ? (
						<ul className="cl-highlights-list">
							{release.highlights.map((item, idx) => (
								<li key={idx}>{item}</li>
							))}
						</ul>
					) : (
						<p style={{ fontSize: 13, color: 'var(--cl-ink2, #71717a)' }}>
							官方暂未提供短摘要，可切换全屏详细阅读完整发布正文。
						</p>
					)}

					<div style={{ marginTop: 14, fontSize: 11, color: 'var(--cl-ink3, #a1a1aa)' }}>
						发布日期：{new Date(release.publishedAt).toLocaleString('zh-CN')} &nbsp;·&nbsp;
						{release.isPrerelease ? '预发布版 (Pre-release)' : '正式发布 (Stable)'}
					</div>
				</div>
				<div className="cl-modal-footer">
					<button className="cl-btn cl-btn-secondary" onClick={onClose} disabled={confirming}>
						暂不更新
					</button>
					<button className="cl-btn cl-btn-primary" onClick={handleConfirm} disabled={confirming}>
						{confirming ? '正在准备下载...' : '确认下载并更新'}
					</button>
				</div>
			</div>
		</div>
	);
}

/**
 * 全屏完整日志弹窗
 */
function FullscreenChangelogModal({ release, langTab, setLangTab, onClose }) {
	if (!release) return null;

	const content =
		langTab === 'cn'
			? release.bodyCn || release.rawBody
			: langTab === 'en'
			? release.bodyEn || release.rawBody
			: release.rawBody;

	return (
		<div className="cl-modal-overlay" onClick={onClose}>
			<div className="cl-modal" style={{ width: 720, height: '80vh' }} onClick={(e) => e.stopPropagation()}>
				<div className="cl-modal-header">
					<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
						<h3 className="cl-modal-title">{release.name || release.tag} 完整发布说明</h3>
						{release.isCurrent && <span className="cl-badge cl-badge-current">当前已装</span>}
					</div>
					<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<div className="cl-lang-tabs">
							<button className={`cl-lang-tab ${langTab === 'cn' ? 'active' : ''}`} onClick={() => setLangTab('cn')}>中文</button>
							<button className={`cl-lang-tab ${langTab === 'en' ? 'active' : ''}`} onClick={() => setLangTab('en')}>English</button>
							<button className={`cl-lang-tab ${langTab === 'all' ? 'active' : ''}`} onClick={() => setLangTab('all')}>全部</button>
						</div>
						<button className="cl-refresh-btn" onClick={onClose}>✕</button>
					</div>
				</div>
				<div className="cl-modal-body" style={{ padding: '20px 24px', flex: 1, overflowY: 'auto' }}>
					<MarkdownView content={content} />
				</div>
				<div className="cl-modal-footer">
					<a href={release.htmlUrl} target="_blank" rel="noreferrer" className="cl-refresh-btn">
						在 GitHub 查看原始网页 ↗
					</a>
					<button className="cl-btn cl-btn-secondary" onClick={onClose}>关闭</button>
				</div>
			</div>
		</div>
	);
}

/**
 * 设置页区块主组件 (Settings Section)
 */
function ChangelogSettingsSection() {
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [selectedTag, setSelectedTag] = useState(null);
	const [langTab, setLangTab] = useState('cn'); // 'cn' | 'en' | 'all'
	const [showUpdateModal, setShowUpdateModal] = useState(false);
	const [showFullModal, setShowFullModal] = useState(false);
	const [desktopUpdateState, setDesktopUpdateState] = useState(null);
	const [mockUpdate, setMockUpdate] = useState(false);

	ensureStyles();

	// 暴露全局便捷测试方法，绕过 Electron contextBridge 限制
	useEffect(() => {
		window.__mockDshUpdate = (enable = true) => {
			setMockUpdate(Boolean(enable));
			console.log(`%c[changelog-viewer] 模拟新版本状态已${enable ? '开启 🚀' : '关闭 ⏹'}`, 'color: #10b981; font-weight: bold;');
		};
		window.__showDshUpdateModal = () => {
			setShowUpdateModal(true);
			console.log('%c[changelog-viewer] 已打开版本更新前置确认弹窗', 'color: #6366f1; font-weight: bold;');
		};
		return () => {
			try {
				delete window.__mockDshUpdate;
				delete window.__showDshUpdateModal;
			} catch (_) {}
		};
	}, []);

	// 获取 releases 列表
	const fetchReleases = useCallback(async (force = false) => {
		setLoading(true);
		try {
			const res = await fetch(`/changelog-viewer/releases${force ? '?force=1' : ''}`);
			const json = await res.json();
			if (json.ok) {
				setData(json);
				if (!selectedTag && json.releases?.length > 0) {
					setSelectedTag(json.releases[0].tag);
				}
			}
		} catch (err) {
			console.error('[changelog-viewer] Fetch error:', err);
		} finally {
			setLoading(false);
		}
	}, [selectedTag]);

	useEffect(() => {
		fetchReleases(false);
	}, [fetchReleases]);

	// 监听 Electron 桌面端原生更新状态
	useEffect(() => {
		const carrier = window.dshDesktop?.updates;
		if (carrier?.status) {
			carrier.status().then((state) => {
				setDesktopUpdateState(state);
			}).catch(() => {});
		}
		if (carrier?.subscribe) {
			const unsubscribe = carrier.subscribe((state) => {
				setDesktopUpdateState(state);
			});
			return () => {
				if (typeof unsubscribe === 'function') unsubscribe();
			};
		}
	}, []);

	// 测试用的模拟新版本数据
	const mockReleaseData = useMemo(() => ({
		name: 'v0.2.3 (模拟新版·测试专用)',
		version: '0.2.3',
		tag: 'v0.2.3',
		publishedAt: new Date().toISOString(),
		isPrerelease: true,
		highlights: [
			'新增功能：增加新版本更新前置确认流程，杜绝意外更新。',
			'功能体验：更新日志归位至设置页「版本更新日志」，支持多语言与全屏阅读。',
			'界面优化：全自适应流式排版，彻底解决文字截断与单字折行。',
			'架构稳健：完善离线种子数据兜底与 E-Tag 本地缓存机制。'
		],
		bodyCn: '### 🚀 核心新增功能\n- 支持在官方发布新版本时，先审阅更新日志重点，再手动确认更新。\n- 优化客户端多层协作与流式输出性能。\n\n### 🛠️ 体验与稳定性优化\n- 修复设置页排版被挤压换行的问题。\n- 提升更新下载完整性校验机制。',
		rawBody: '### Release v0.2.3\n- Pre-update confirmation modal with changelog preview.\n- Layout refactor and bug fixes.',
		htmlUrl: 'https://github.com/deepseek-ai/dsh/releases'
	}), []);

	// 当前选中的 release
	const currentRelease = useMemo(() => {
		if (mockUpdate && selectedTag === 'v0.2.3') return mockReleaseData;
		if (!data?.releases) return mockUpdate ? mockReleaseData : null;
		return data.releases.find((r) => r.tag === selectedTag) || data.releases[0];
	}, [data, selectedTag, mockUpdate, mockReleaseData]);

	// 最新可用的 release
	const latestRelease = useMemo(() => {
		if (mockUpdate) return mockReleaseData;
		return data?.releases?.[0] || null;
	}, [data, mockUpdate, mockReleaseData]);

	// 是否有新版本
	const hasNewVersion = useMemo(() => {
		if (mockUpdate) return true;
		if (desktopUpdateState?.phase === 'available') return true;
		return data?.hasUpdate || false;
	}, [mockUpdate, desktopUpdateState, data]);

	// 触发更新操作 (两阶段确认后的下载执行)
	const triggerDesktopUpdate = async () => {
		if (mockUpdate) {
			console.log('%c🎉 [模拟测试成功] 用户已完成前置审阅并点击确认！放行并调用底层更新器 updates.open()', 'color: #10b981; font-weight: bold; font-size: 13px;');
			alert('🎉【测试验证成功】\n\n1. 已成功先查阅目标版本 Changelog\n2. 用户已明确点击【确认下载并更新】\n3. 已放行底层更新执行器（window.dshDesktop.updates.open）');
			return;
		}

		if (window.dshDesktop?.updates?.open) {
			await window.dshDesktop.updates.open();
		} else {
			if (latestRelease?.htmlUrl) {
				window.open(latestRelease.htmlUrl, '_blank');
			}
		}
	};

	return (
		<div className="cl-section-root">
			{/* 1. 状态栏 */}
			<div className="cl-status-bar">
				<div className="cl-status-info">
					<div className="cl-status-item">
						<span className="cl-status-label">当前安装版本:</span>
						<span className="cl-version-pill">
							{data?.currentVersion || '检测中...'}
							<span className="cl-badge cl-badge-current">已安装</span>
						</span>
					</div>
					{latestRelease && (
						<div className="cl-status-item">
							<span className="cl-status-label">官方最新:</span>
							<span className="cl-version-pill">
								{latestRelease.name || latestRelease.version}
								{hasNewVersion ? (
									<span className="cl-badge cl-badge-latest">可更新</span>
								) : (
									<span className="cl-badge cl-badge-current">已是最新</span>
								)}
							</span>
						</div>
					)}
				</div>
				<div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
					{mockUpdate && (
						<button
							className="cl-refresh-btn cl-btn-mock-active"
							onClick={() => setMockUpdate(false)}
							title="点击退出模拟测试状态"
						>
							✕ 退出模拟
						</button>
					)}
					<button className="cl-refresh-btn" onClick={() => fetchReleases(true)} title="强制重新拉取官方发布日志">
						{loading ? '正在同步...' : '↻ 检查与同步'}
					</button>
				</div>
			</div>

			{/* 2. 发现新版本高亮横幅 */}
			{hasNewVersion && latestRelease && (
				<div className="cl-update-card">
					<div>
						<div className="cl-update-card-title">
							<span>🚀</span>
							<span>发现 DSH 官方新版本：{latestRelease.name || latestRelease.version}</span>
							{latestRelease.isPrerelease && <span className="cl-badge cl-badge-rc">Pre-release</span>}
						</div>
						<div className="cl-update-card-desc">
							官方已发布新版本。建议先查阅更新重点与变动说明，再确认是否下载升级。
						</div>
					</div>
					<button className="cl-btn-primary" onClick={() => setShowUpdateModal(true)}>
						查看变更并更新
					</button>
				</div>
			)}

			{/* 3. 日志阅读卡片 */}
			<div className="cl-viewer-card">
				<div className="cl-viewer-toolbar">
					<div className="cl-toolbar-group">
						<span className="cl-status-label">选择版本:</span>
						<select
							className="cl-select-version"
							value={selectedTag || ''}
							onChange={(e) => setSelectedTag(e.target.value)}
						>
							{data?.releases?.map((r) => (
								<option key={r.tag} value={r.tag}>
									{r.name || r.version} {r.isCurrent ? '（当前版本）' : ''} {r.tag === latestRelease?.tag ? '（最新）' : ''}
								</option>
							))}
						</select>
						{currentRelease?.isCurrent && <span className="cl-badge cl-badge-current">当前已装</span>}
						{currentRelease?.isPrerelease && <span className="cl-badge cl-badge-rc">RC</span>}
					</div>

					<div className="cl-toolbar-group">
						<div className="cl-lang-tabs">
							<button className={`cl-lang-tab ${langTab === 'cn' ? 'active' : ''}`} onClick={() => setLangTab('cn')}>
								中文
							</button>
							<button className={`cl-lang-tab ${langTab === 'en' ? 'active' : ''}`} onClick={() => setLangTab('en')}>
								English
							</button>
							<button className={`cl-lang-tab ${langTab === 'all' ? 'active' : ''}`} onClick={() => setLangTab('all')}>
								全部
							</button>
						</div>
						<button className="cl-refresh-btn" onClick={() => setShowFullModal(true)} title="在大窗口中完整阅读">
							展开全文 ↗
						</button>
					</div>
				</div>

				<div className="cl-viewer-body">
					{loading && !data ? (
						<div style={{ padding: 24, textAlign: 'center', color: 'var(--cl-ink3, #a1a1aa)' }}>
							正在加载版本更新记录...
						</div>
					) : currentRelease ? (
						<MarkdownView
							content={
								langTab === 'cn'
									? currentRelease.bodyCn || currentRelease.rawBody
									: langTab === 'en'
									? currentRelease.bodyEn || currentRelease.rawBody
									: currentRelease.rawBody
							}
						/>
					) : (
						<div style={{ padding: 24, textAlign: 'center', color: 'var(--cl-ink3, #a1a1aa)' }}>
							暂无版本说明
						</div>
					)}
				</div>
			</div>

			{/* 新版本前置确认弹窗 */}
			{showUpdateModal && (
				<UpdateConfirmModal
					release={latestRelease}
					onClose={() => setShowUpdateModal(false)}
					onConfirm={triggerDesktopUpdate}
				/>
			)}

			{/* 全文阅读弹窗 */}
			{showFullModal && (
				<FullscreenChangelogModal
					release={currentRelease}
					langTab={langTab}
					setLangTab={setLangTab}
					onClose={() => setShowFullModal(false)}
				/>
			)}
		</div>
	);
}

// ==========================================
// 全局弹窗与左下角原生更新按钮拦截接管机制
// ==========================================

let globalModalRoot = null;
let globalModalContainer = null;

function ensureGlobalModalRoot() {
	if (typeof document === 'undefined') return null;
	if (!globalModalContainer) {
		let el = document.getElementById('cl-global-update-host');
		if (!el) {
			el = document.createElement('div');
			el.id = 'cl-global-update-host';
			document.body.appendChild(el);
		}
		globalModalContainer = el;
		globalModalRoot = createRoot(el);
	}
	return globalModalRoot;
}

/**
 * 全局打开更新确认弹窗（在任意界面、任何时机均可被调起）
 */
export function openGlobalUpdateConfirmation(targetRelease = null, customOnConfirm = null) {
	ensureStyles();
	const root = ensureGlobalModalRoot();
	if (!root) return;

	const handleClose = () => {
		root.render(null);
	};

	const executeConfirm = async () => {
		try {
			if (typeof customOnConfirm === 'function') {
				await customOnConfirm();
			} else if (window.dshDesktop?.updates?.open) {
				await window.dshDesktop.updates.open();
			} else if (targetRelease?.htmlUrl) {
				window.open(targetRelease.htmlUrl, '_blank');
			}
		} catch (err) {
			console.error('[changelog-viewer] 执行更新异常:', err);
		} finally {
			handleClose();
		}
	};

	const renderModal = (rel) => {
		root.render(
			<UpdateConfirmModal
				release={rel}
				onClose={handleClose}
				onConfirm={executeConfirm}
			/>
		);
	};

	if (targetRelease) {
		renderModal(targetRelease);
	} else {
		// 动态拉取官方最新 Release 信息
		fetch('/changelog-viewer/releases')
			.then((res) => res.json())
			.then((json) => {
				const latest = json.releases?.[0] || {
					name: 'DSH 官方新版本',
					version: '最新版',
					highlights: ['发现新版本，请确认升级以获得最新特性与稳定性修复。'],
					publishedAt: new Date().toISOString(),
				};
				renderModal(latest);
			})
			.catch(() => {
				renderModal({
					name: 'DSH 官方新版本',
					version: '最新版',
					highlights: ['正在从本地离线配置同步，请确认是否继续更新。'],
					publishedAt: new Date().toISOString(),
				});
			});
	}
}

/**
 * 精准检测目标 DOM 是否为宿主左下角的更新指示器按钮 (DesktopUpdateIndicator)
 */
export function isNativeUpdateButton(target) {
	if (!target || typeof target.closest !== 'function') return false;
	const button = target.closest('button');
	if (!button) return false;

	const ariaLabel = (button.getAttribute('aria-label') || '').trim();
	const text = (button.textContent || '').trim();
	const className = button.className || '';

	const updateKeywords = ['新版本', 'Update', '重试更新', 'Retry', '可更新'];
	const matchesKeyword = updateKeywords.some(
		(kw) => ariaLabel === kw || ariaLabel.startsWith(kw) || text === kw || text.startsWith(kw)
	);

	const matchesClass = typeof className === 'string' && className.includes('indicator');
	const inTriggerRow = Boolean(button.closest('[class*="triggerRow"]') || button.closest('[class*="railRow"]'));

	// 只要满足关键字且位于底部控制区，或具备更新指示器特征
	if (matchesKeyword && (inTriggerRow || matchesClass)) {
		return true;
	}

	// 兜底直接匹配 label
	if (ariaLabel === '新版本' || ariaLabel === 'Update') {
		return true;
	}

	return false;
}

/**
 * 安装全局左下角原生更新按钮拦截器
 */
export function installUpdateInterceptor() {
	if (typeof document === 'undefined' || window.__dshUpdateInterceptorInstalled) return;
	window.__dshUpdateInterceptorInstalled = true;

	const handleCaptureClick = (event) => {
		try {
			if (isNativeUpdateButton(event.target)) {
				console.log('%c[changelog-viewer] ⚡ 成功拦截 DSH 默认左下角更新按钮点击！阻断直接更新，转由更新日志弹窗接管。', 'color: #6366f1; font-weight: bold;');
				// 立即阻断原生 onClick 冒泡与默认直推下载
				event.preventDefault();
				event.stopPropagation();
				event.stopImmediatePropagation();

				// 弹出全局 Changelog 确认审阅弹窗
				openGlobalUpdateConfirmation();
			}
		} catch (err) {
			console.error('[changelog-viewer] 拦截处理异常:', err);
		}
	};

	// 关键：useCapture 必须为 true，在冒泡前阻断
	document.addEventListener('click', handleCaptureClick, true);

	// 双重保险：若 updates.open 可代理则安全代理
	try {
		const carrierUpdates = window.dshDesktop?.updates;
		if (carrierUpdates && typeof carrierUpdates.open === 'function') {
			const rawOpen = carrierUpdates.open.bind(carrierUpdates);
			carrierUpdates.__originalOpen = rawOpen;
			carrierUpdates.open = async () => {
				console.log('%c[changelog-viewer] 拦截到底层 updates.open() 调用，转由更新日志弹窗接管。', 'color: #6366f1; font-weight: bold;');
				openGlobalUpdateConfirmation(null, rawOpen);
			};
		}
	} catch (_) {
		// Electron contextBridge 只读保护下忽略
	}

	// 暴露测试辅助函数
	window.__testInterceptNativeUpdate = () => {
		console.log('[changelog-viewer] 模拟触发左下角更新按钮被点击...');
		openGlobalUpdateConfirmation();
	};

	console.log('[changelog-viewer] 全局更新拦截与接管器已就绪 (DOM capture + Global Portal Modal)');
}

// 声明依赖的 Cordis 服务
export const inject = ['slots'];

// 注册 Cordis 客户端 slots
export function apply(ctx) {
	// 1. 激活左下角默认更新按钮全局拦截接管机制
	installUpdateInterceptor();

	// 2. 注册设置页面区块 (Settings Section)，order 98 优雅置于常规设置靠后位置
	ctx.slots.inject('settings.section', () =>
		ctx.slots.register(
			{
				name: 'settings.section',
				id: 'changelog-viewer',
				order: 98,
				label: '版本更新日志',
			},
			ChangelogSettingsSection
		)
	);

	console.log('[changelog-viewer] Client slot registered on settings.section');
}
