import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GITHUB_RELEASES_URL = 'https://api.github.com/repos/deepseek-ai/deepseek-harness/releases?per_page=30';
const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 分钟缓存

/**
 * 从 tag 或 name 中提取规范语义版本号，如 'dsh-v0.2.2-rc.2' -> '0.2.2-rc.2'
 */
export function normalizeVersion(tagOrName = '') {
	return tagOrName.replace(/^dsh-v?/i, '').replace(/^v/i, '').trim();
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

export class ReleaseService {
	constructor(options = {}) {
		this.apiUrl = options.apiUrl || GITHUB_RELEASES_URL;
		this.ttlMs = options.ttlMs || DEFAULT_TTL_MS;
		this.cacheFile = options.cacheFile || join(__dirname, '../.releases-cache.json');
		this.seedFile = options.seedFile || join(__dirname, 'seed-releases.json');
		this.cachedPayload = null;
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
	 * 读取本地磁盘缓存
	 */
	readDiskCache() {
		try {
			if (existsSync(this.cacheFile)) {
				const raw = readFileSync(this.cacheFile, 'utf8');
				return JSON.parse(raw);
			}
		} catch (err) {
			console.warn('[ReleaseService] Failed to read disk cache:', err.message);
		}
		return null;
	}

	/**
	 * 写入本地磁盘缓存
	 */
	writeDiskCache(data) {
		try {
			const dir = dirname(this.cacheFile);
			if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
			writeFileSync(this.cacheFile, JSON.stringify(data, null, 2), 'utf8');
		} catch (err) {
			console.warn('[ReleaseService] Failed to write disk cache:', err.message);
		}
	}

	/**
	 * 格式化输出 releases 列表与元数据
	 */
	formatPayload(rawReleases = [], source = 'network', etag = null, lastModified = null) {
		const currentVersion = process.env.DSH_CLIENT_VERSION || '0.2.1-rc.5';

		const releases = rawReleases.map((item) => {
			const version = normalizeVersion(item.tag_name || item.name);
			const { bodyCn, bodyEn, highlights } = parseReleaseBody(item.body);
			const isCurrent = normalizeVersion(currentVersion) === version;

			return {
				id: item.id || item.tag_name,
				tag: item.tag_name,
				version,
				name: item.name || item.tag_name,
				publishedAt: item.published_at || new Date().toISOString(),
				isPrerelease: !!item.prerelease,
				htmlUrl: item.html_url || `https://github.com/deepseek-ai/deepseek-harness/releases/tag/${item.tag_name}`,
				bodyCn,
				bodyEn,
				rawBody: item.body || '',
				highlights,
				isCurrent,
			};
		});

		const latestRelease = releases[0] || null;
		const latestVersion = latestRelease ? latestRelease.version : currentVersion;
		const hasUpdate = latestRelease ? compareSemver(latestVersion, currentVersion) > 0 : false;

		return {
			ok: true,
			currentVersion,
			latestVersion,
			hasUpdate,
			source,
			etag,
			lastModified,
			lastFetchedAt: Date.now(),
			releases,
		};
	}

	/**
	 * 获取 Release 列表数据（带缓存、条件请求与离线兜底）
	 */
	async getReleases(force = false) {
		const now = Date.now();

		// 1. 若内存中有有效未过期缓存且未要求强制刷新，直接返回
		if (!force && this.cachedPayload && now - this.cachedPayload.lastFetchedAt < this.ttlMs) {
			return { ...this.cachedPayload, source: 'memory' };
		}

		// 2. 检查磁盘缓存
		const diskCache = this.readDiskCache();
		if (!force && diskCache && now - (diskCache.lastFetchedAt || 0) < this.ttlMs) {
			this.cachedPayload = diskCache;
			return { ...diskCache, source: 'disk' };
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

			// 304 未更改：直接续期现有缓存并返回
			if (response.status === 304 && diskCache) {
				diskCache.lastFetchedAt = now;
				this.writeDiskCache(diskCache);
				this.cachedPayload = diskCache;
				return { ...diskCache, source: 'network-304' };
			}

			// 200 成功：解析并写入缓存
			if (response.status === 200) {
				const json = await response.json();
				if (Array.isArray(json) && json.length > 0) {
					const etag = response.headers.get('etag');
					const lastModified = response.headers.get('last-modified');
					const payload = this.formatPayload(json, 'network', etag, lastModified);

					this.cachedPayload = payload;
					this.writeDiskCache(payload);
					return payload;
				}
			}

			console.warn(`[ReleaseService] Upstream status ${response.status}, falling back to cache/seed.`);
		} catch (err) {
			console.warn('[ReleaseService] Network fetch failed:', err.message);
		}

		// 4. 网络失败或被限流：回退到磁盘缓存
		if (diskCache) {
			return { ...diskCache, source: 'fallback-disk', isStale: true };
		}

		// 5. 极端首次断网：回退到静态内置种子数据
		const seedData = this.loadSeedData();
		const fallbackPayload = this.formatPayload(seedData, 'seed');
		this.cachedPayload = fallbackPayload;
		return fallbackPayload;
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
