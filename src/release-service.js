import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { FeedProbeService, deriveSyncStates } from './feed-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GITHUB_RELEASES_URL = 'https://api.github.com/repos/deepseek-ai/deepseek-harness/releases?per_page=30';
const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 分钟缓存

/**
 * 从 tag 或 name 中提取规范语义版本号，如 'dsh-v0.2.2-rc.2' -> '0.2.2-rc.2'
 */
export function normalizeVersion(tagOrName = '') {
	return String(tagOrName).replace(/^dsh-v?/i, '').replace(/^v/i, '').trim();
}

/**
 * 结构化解析 Release 正文（提取中文、英文、高亮特性列表）
 */
export function parseReleaseBody(rawBody = '') {
	if (!rawBody || typeof rawBody !== 'string') {
		return { bodyCn: '', bodyEn: '', highlights: [] };
	}

	// 官方 Release 特征：中英切换锚点 [中文](#cn-xxx) | [English](#en-xxx)
	let bodyCn = rawBody;
	let bodyEn = '';

	const enAnchorRegex = /\[English\]\(#en-[^)]+\)/i;
	const enHeaderRegex = /<h[1-6]\s+id=["']en-[^"']+["']>/i;

	if (enAnchorRegex.test(rawBody) || enHeaderRegex.test(rawBody)) {
		let parts = [];
		if (enHeaderRegex.test(rawBody)) {
			const idx = rawBody.search(enHeaderRegex);
			parts = [rawBody.slice(0, idx), rawBody.slice(idx)];
		} else {
			parts = rawBody.split(enAnchorRegex);
		}

		if (parts.length >= 2) {
			// 清除顶部的语言导航行
			bodyCn = parts[0]
				.replace(/^[\s\n]*\[中文\]\(#[^)]+\)\s*\|\s*\[English\]\(#[^)]+\)[\s\n]*/i, '')
				.trim();
			bodyEn = parts[1]
				.replace(/^[\s\n]*\|\s*\[English\]\(#[^)]+\)[\s\n]*/i, '')
				.trim();
		}
	}

	// 提取核心高亮条目 (以 - 开头的列表项，至多提取 5 条)
	const highlights = [];
	const lines = bodyCn.split('\n');
	for (const line of lines) {
		const trimmed = line.trim();
		if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
			const itemText = trimmed.replace(/^[-*]\s+/, '').trim();
			if (itemText && !itemText.startsWith('**') && !itemText.toLowerCase().includes('contributor')) {
				highlights.push(itemText);
				if (highlights.length >= 6) break;
			}
		}
	}

	return {
		bodyCn: bodyCn || rawBody,
		bodyEn: bodyEn,
		highlights,
	};
}

/**
 * 简易 semver 版本大小对比 (v1 > v2 返回 1, v1 < v2 返回 -1, 相等返回 0)
 */
export function compareSemver(v1, v2) {
	if (!v1 || !v2) return 0;
	const clean1 = normalizeVersion(v1);
	const clean2 = normalizeVersion(v2);
	if (clean1 === clean2) return 0;

	const parse = (v) => {
		const [main, pre] = v.split('-');
		const parts = (main || '0.0.0').split('.').map((n) => parseInt(n, 10) || 0);
		return { parts, pre: pre || '' };
	};

	const p1 = parse(clean1);
	const p2 = parse(clean2);

	for (let i = 0; i < 3; i++) {
		const n1 = p1.parts[i] || 0;
		const n2 = p2.parts[i] || 0;
		if (n1 > n2) return 1;
		if (n1 < n2) return -1;
	}

	// 主版本相同时，无 pre 胜过有 pre (例如 0.2.2 > 0.2.2-rc.2)
	if (!p1.pre && p2.pre) return 1;
	if (p1.pre && !p2.pre) return -1;
	if (p1.pre && p2.pre) {
		return p1.pre.localeCompare(p2.pre, undefined, { numeric: true });
	}

	return 0;
}

/**
 * 动态多层探测宿主 DSH 客户端实际安装并运行的版本
 */
export function detectHostVersion(options = {}) {
	const env = options.env || process.env;

	// 1. 显式环境变量覆盖（支持测试与外部配置）
	if (env.DSH_CLIENT_VERSION) {
		return normalizeVersion(env.DSH_CLIENT_VERSION);
	}
	if (env.DSH_VERSION) {
		return normalizeVersion(env.DSH_VERSION);
	}

	// 2. 原生桌面客户端 App Bundle 清单探测（macOS Info.plist / Windows 等真实安装包元数据）
	// 用户升级客户端并重启后，系统级 App Bundle 清单会被 Electron 安装器立即覆写，最具权威性
	try {
		const macPaths = [
			process.execPath ? join(dirname(dirname(process.execPath)), 'Info.plist') : null,
			'/Applications/DeepSeek Harness.app/Contents/Info.plist',
		].filter(Boolean);

		for (const p of macPaths) {
			if (existsSync(p)) {
				const content = readFileSync(p, 'utf8');
				const match = content.match(/<key>CFBundleShortVersionString<\/key>[\s\n]*<string>([^<]+)<\/string>/i);
				if (match && match[1]) {
					return normalizeVersion(match[1]);
				}
			}
		}
	} catch (_) {}

	// 3. 借由 createRequire 解析宿主官方核心包 package.json
	const candidateBasePaths = [
		__dirname,
		process.cwd(),
	];
	if (env.HOME) {
		candidateBasePaths.push(join(env.HOME, '.dsh/profiles/desktop'));
	}
	if (Array.isArray(process.argv)) {
		for (const arg of process.argv) {
			if (typeof arg === 'string' && (arg.includes('node_modules') || arg.includes('app.asar') || arg.includes('.dsh'))) {
				candidateBasePaths.push(dirname(arg));
			}
		}
	}

	const specs = [
		'@deepseek-ai/dsh',
		'@deepseek-ai/dsh-base',
		'@deepseek-ai/dsh-web-app',
		'@deepseek-ai/dsh-desktop-host',
	];

	for (const basePath of candidateBasePaths) {
		try {
			const req = createRequire(basePath.startsWith('file:') ? basePath : join(basePath, 'package.json'));
			for (const spec of specs) {
				try {
					const pkg = req(spec + '/package.json');
					if (pkg?.version) {
						return normalizeVersion(pkg.version);
					}
				} catch (_) {}
			}
		} catch (_) {}
	}

	// 4. 安全兜底版本
	return '0.2.2-rc.3';
}

export class ReleaseService {
	constructor(options = {}) {
		this.apiUrl = options.apiUrl || GITHUB_RELEASES_URL;
		this.ttlMs = options.ttlMs || DEFAULT_TTL_MS;
		this.cacheFile = options.cacheFile || join(__dirname, '../.releases-cache.json');
		this.seedFile = options.seedFile || join(__dirname, 'seed-releases.json');
		this.cachedStaticData = null;
		this.detectVersionFn = options.detectVersionFn || detectHostVersion;
		this.feedProbe = options.feedProbe || new FeedProbeService();
	}

	/**
	 * 读取种子数据作为兜底
	 */
	loadSeedData() {
		try {
			if (existsSync(this.seedFile)) {
				const raw = readFileSync(this.seedFile, 'utf8');
				return JSON.parse(raw);
			}
		} catch (err) {
			console.warn('[ReleaseService] Failed to read seed data:', err.message);
		}
		return [];
	}

	/**
	 * 读取本地磁盘缓存（兼容旧格式，并保留静态 release 列表与 etag 等）
	 */
	readDiskCache() {
		try {
			if (existsSync(this.cacheFile)) {
				const raw = readFileSync(this.cacheFile, 'utf8');
				const parsed = JSON.parse(raw);
				if (parsed && Array.isArray(parsed.releases)) {
					return parsed;
				}
			}
		} catch (err) {
			console.warn('[ReleaseService] Failed to read disk cache:', err.message);
		}
		return null;
	}

	/**
	 * 写入本地磁盘缓存（只持久化静态数据，不绑定临时运行时状态）
	 */
	writeDiskCache(data) {
		try {
			const dir = dirname(this.cacheFile);
			if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
			// 剥离运行时标记后再存盘
			const strippedReleases = (data.releases || []).map((r) => {
				const { isCurrent, ...rest } = r;
				return rest;
			});
			const payloadToSave = {
				etag: data.etag || null,
				lastModified: data.lastModified || null,
				lastFetchedAt: data.lastFetchedAt || Date.now(),
				feed: data.feed || null,
				releases: strippedReleases,
			};
			writeFileSync(this.cacheFile, JSON.stringify(payloadToSave, null, 2), 'utf8');
		} catch (err) {
			console.warn('[ReleaseService] Failed to write disk cache:', err.message);
		}
	}

	/**
	 * 将原始 release 列表格式化为标准字段
	 */
	formatRawReleases(rawReleases = []) {
		return rawReleases.map((item) => {
			const version = normalizeVersion(item.tag_name || item.name || item.version);
			const { bodyCn, bodyEn, highlights } = parseReleaseBody(item.body || item.rawBody);

			return {
				id: item.id || item.tag_name || version,
				tag: item.tag_name || item.tag || `v${version}`,
				version,
				name: item.name || item.tag_name || `v${version}`,
				publishedAt: item.published_at || item.publishedAt || new Date().toISOString(),
				isPrerelease: !!(item.prerelease || item.isPrerelease),
				htmlUrl: item.html_url || item.htmlUrl || `https://github.com/deepseek-ai/deepseek-harness/releases/tag/${item.tag_name || item.tag}`,
				bodyCn: item.bodyCn || bodyCn,
				bodyEn: item.bodyEn || bodyEn,
				rawBody: item.rawBody || item.body || '',
				highlights: item.highlights || highlights,
			};
		});
	}

	/**
	 * 动态装配模式：结合实时宿主探测版本，动态派生 isCurrent / hasUpdate
	 */
	assemblePayload(staticData = {}, source = 'network') {
		const currentVersion = this.detectVersionFn();
		const formattedReleases = this.formatRawReleases(staticData.releases || []);
		const feedState = staticData.feed || null;
		const syncStates = deriveSyncStates(
			feedState && feedState.state === 'ok' ? feedState.version : null,
			formattedReleases,
			compareSemver
		);

		const releases = formattedReleases.map((item, idx) => ({
			...item,
			isCurrent: normalizeVersion(item.version) === normalizeVersion(currentVersion),
			syncState: syncStates[idx],
		}));

		const latestRelease = releases[0] || null;
		const latestVersion = latestRelease ? latestRelease.version : currentVersion;
		const hasUpdate = latestRelease ? compareSemver(latestVersion, currentVersion) > 0 : false;

		return {
			ok: true,
			currentVersion,
			latestVersion,
			hasUpdate,
			source,
			feed: feedState
				? {
						state: feedState.state,
						version: feedState.version,
						stagingPercentage: feedState.stagingPercentage ?? null,
						channel: feedState.channel,
						reason: feedState.reason,
						lastFetchedAt: feedState.lastFetchedAt,
					}
				: null,
			etag: staticData.etag || null,
			lastModified: staticData.lastModified || null,
			lastFetchedAt: staticData.lastFetchedAt || Date.now(),
			releases,
		};
	}

	/**
	 * 获取 Release 列表数据（带缓存、条件请求与离线兜底，且始终动态装配真实当前版本）
	 */
	async getReleases(force = false) {
		const now = Date.now();

		// 1. 若内存中有有效未过期静态缓存且未要求强制刷新，动态装配后返回
		if (!force && this.cachedStaticData && now - (this.cachedStaticData.lastFetchedAt || 0) < this.ttlMs) {
			return this.assemblePayload(this.cachedStaticData, 'memory');
		}

		// 2. 检查磁盘缓存
		const diskCache = this.readDiskCache();
		if (diskCache?.feed) this.feedProbe.hydrate(diskCache.feed);
		if (!force && diskCache && now - (diskCache.lastFetchedAt || 0) < this.ttlMs) {
			this.cachedStaticData = diskCache;
			return this.assemblePayload(diskCache, 'disk');
		}

		// 2.5 feed 探针：独立于 releases 主流程，任何异常静默降级 unknown，不影响列表返回（AC4）
		let feedState = null;
		try {
			feedState = await this.feedProbe.ensureFresh(force);
		} catch (err) {
			console.warn('[ReleaseService] Feed probe failed:', err?.message ?? err);
		}

		// 3. 发起网络请求获取最新 Releases（带 ETag 条件请求）
		const headers = {
			'User-Agent': 'dsh-changelog-viewer',
			Accept: 'application/vnd.github.v3+json',
		};
		if (diskCache?.etag) headers['If-None-Match'] = diskCache.etag;
		if (diskCache?.lastModified) headers['If-Modified-Since'] = diskCache.lastModified;

		try {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 8000); // 8s 超时

			const response = await fetch(this.apiUrl, {
				headers,
				signal: controller.signal,
			});
			clearTimeout(timeout);

			// 304 未更改：直接续期现有缓存并动态装配返回
			if (response.status === 304 && diskCache) {
				diskCache.feed = feedState;
				diskCache.lastFetchedAt = now;
				this.writeDiskCache(diskCache);
				this.cachedStaticData = diskCache;
				return this.assemblePayload(diskCache, 'network-304');
			}

			// 200 成功：解析并写入缓存
			if (response.status === 200) {
				const json = await response.json();
				if (Array.isArray(json) && json.length > 0) {
					const etag = response.headers.get('etag');
					const lastModified = response.headers.get('last-modified');
					const newStaticData = {
						etag,
						lastModified,
						lastFetchedAt: now,
						feed: feedState,
						releases: this.formatRawReleases(json),
					};

					this.cachedStaticData = newStaticData;
					this.writeDiskCache(newStaticData);
					return this.assemblePayload(newStaticData, 'network');
				}
			}

			console.warn(`[ReleaseService] Upstream status ${response.status}, falling back to cache/seed.`);
		} catch (err) {
			console.warn('[ReleaseService] Network fetch failed:', err.message);
		}

		// 4. 网络失败或被限流：回退到磁盘缓存
		if (diskCache) {
			this.cachedStaticData = diskCache;
			diskCache.feed = feedState;
			const stalePayload = this.assemblePayload(diskCache, 'fallback-disk');
			stalePayload.isStale = true;
			return stalePayload;
		}

		// 5. 极端首次断网：回退到静态内置种子数据
		const seedData = this.loadSeedData();
		const fallbackStaticData = {
			lastFetchedAt: now,
			feed: feedState,
			releases: this.formatRawReleases(seedData),
		};
		this.cachedStaticData = fallbackStaticData;
		return this.assemblePayload(fallbackStaticData, 'seed');
	}

	/**
	 * 根据 tag 或 version 获取单个 release 详情
	 */
	async getReleaseByTag(tagOrVersion) {
		const payload = await this.getReleases(false);
		const targetNorm = normalizeVersion(tagOrVersion);
		const found = payload.releases.find(
			(r) => normalizeVersion(r.tag) === targetNorm || normalizeVersion(r.version) === targetNorm
		);
		return found || null;
	}
}
