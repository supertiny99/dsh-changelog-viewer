import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * 官方更新源（download.deepseek.com feed）只读探针
 *
 * 机制实证（2026-11-23，宿主 DeepSeek Harness 0.2.2-rc.5 asar 三级证据链）：
 * - GitHub Releases 是公告渠道，真实安装包走 `<base>/<channel>-mac.yml` 清单（electron-updater generic provider）
 * - `getChannelFilename(channel)` = `${channel}.yml`；darwin 后缀恒定 `-mac`，win32 为 ''；arch 在 URL 目录、不进文件名
 * - `AppUpdater.channel` setter 原样存储无归一化 → stable 通道清单即 `stable-mac.yml`
 * - CDN 对缺失清单回落 200 的 SPA HTML 页，必须做结构校验而非只看 HTTP 状态码
 * - 宿主判定口径：`gt(feed.version, 当前版本)` + `allowPrerelease=true` + `allowDowngrade=false`
 */

const DEFAULT_FEED_BASE_URL = 'https://download.deepseek.com/dsh-desk/feeds/mac-arm64/';
const DEFAULT_TTL_MS = 30 * 60 * 1000; // 与 ReleaseService 同款 30 分钟
const FETCH_TIMEOUT_MS = 8000; // 与 ReleaseService 同款 8 秒超时
const VALID_CHANNELS = ['nightly', 'stable'];

/**
 * 解析生效更新通道，与宿主 desktopUpdateChannel(manifest) 同口径：
 * manifest 的 dshDesktopUpdateChannel 优先（宿主实际生效值）> app-update.yml 的 channel 键 > 缺省 nightly；
 * 显式非法值与宿主同款判错（调用方降级 unknown）
 */
export function resolveUpdateChannel({ manifest, appUpdateYml } = {}) {
	const fromManifest = manifest && typeof manifest === 'object' ? manifest.dshDesktopUpdateChannel : undefined;
	if (fromManifest !== undefined) {
		if (!VALID_CHANNELS.includes(fromManifest)) {
			throw new Error(`desktop update: invalid packaged channel: ${fromManifest}`);
		}
		return fromManifest;
	}
	const fromYml = appUpdateYml && typeof appUpdateYml === 'object' ? appUpdateYml.channel : undefined;
	if (fromYml !== undefined && fromYml !== null && String(fromYml).trim() !== '') {
		const channel = String(fromYml).trim();
		if (!VALID_CHANNELS.includes(channel)) {
			throw new Error(`desktop update: invalid packaged channel: ${channel}`);
		}
		return channel;
	}
	return 'nightly';
}

/**
 * 拼装通道清单 URL（electron-updater 命名规则，WP0 已钉死）
 */
export function buildChannelFileUrl(baseUrl, channel = 'nightly', platform = process.platform) {
	const prefix = platform === 'darwin' ? '-mac' : '';
	const base = String(baseUrl || DEFAULT_FEED_BASE_URL).replace(/\/+$/, '');
	return `${base}/${channel}${prefix}.yml`;
}

/**
 * 解析通道清单 YAML（零依赖，只取 version / stagingPercentage 两键）
 * CDN 404 回落的 SPA HTML 页 / 坏 YAML / 缺 version 一律返回 null（判「清单缺失」）
 */
export function parseFeedYaml(text) {
	if (typeof text !== 'string' || !text.trim()) return null;
	const head = text.trimStart().slice(0, 64).toLowerCase();
	if (head.startsWith('<!doctype') || head.startsWith('<html') || head.startsWith('<')) return null;

	const versionMatch = text.match(/^\s*version:\s*['"]?([^\s'"]+)['"]?\s*$/m);
	if (!versionMatch) return null;
	const version = versionMatch[1];
	if (!/^\d+\.\d+\.\d+([-\w.]+)?$/.test(version)) return null;

	const stagingMatch = text.match(/^\s*stagingPercentage:\s*['"]?([\d.]+)['"]?\s*$/m);
	const staging = stagingMatch ? Number(stagingMatch[1]) : null;

	return {
		version,
		stagingPercentage: staging !== null && Number.isFinite(staging) ? staging : null,
	};
}

/**
 * 三态同步状态判定（与宿主口径对齐，复用 ReleaseService 的 compareSemver）
 * feed 缺失/非法 → 全部 unknown（静默降级，不造假数据）；
 * compare(feedVersion, release.version) >= 0 → pushed（已进源或已被更高版取代）；否则 pending（公告先行、源未同步）
 */
export function deriveSyncStates(feedVersion, releases = [], compareFn) {
	if (!feedVersion || typeof compareFn !== 'function') {
		return releases.map(() => 'unknown');
	}
	return releases.map((release) => (compareFn(feedVersion, release.version) >= 0 ? 'pushed' : 'pending'));
}

/**
 * 读取宿主更新配置（只读，缺文件逐项降级）
 * manifest = <resourcesPath>/app.asar/package.json（Electron fs 可直读 asar）；
 * appUpdateYml = <resourcesPath>/app-update.yml 的 channel / url 两键
 */
export function readHostUpdateConfig(resourcesPath = process.resourcesPath) {
	const config = { manifest: null, appUpdateYml: null, feedBaseUrl: null };
	if (!resourcesPath) return config;

	try {
		const manifestPath = join(resourcesPath, 'app.asar', 'package.json');
		if (existsSync(manifestPath)) {
			config.manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
		}
	} catch (_) {}

	try {
		const ymlPath = join(resourcesPath, 'app-update.yml');
		if (existsSync(ymlPath)) {
			const text = readFileSync(ymlPath, 'utf8');
			const pick = (key) => {
				const m = text.match(new RegExp(`^\\s*${key}:(.*)$`, 'm'));
				if (!m) return null;
				return m[1].trim().replace(/^['"]+|['"]+$/g, '') || null;
			};
			config.appUpdateYml = { channel: pick('channel'), url: pick('url') };
			if (config.appUpdateYml.url) config.feedBaseUrl = config.appUpdateYml.url;
		}
	} catch (_) {}

	if (!config.feedBaseUrl) config.feedBaseUrl = DEFAULT_FEED_BASE_URL;
	return config;
}

/**
 * feed 探针服务：TTL 缓存 + 条件请求，失败同样落缓存（TTL 窗口内不重复请求，AC5 退避）
 */
export class FeedProbeService {
	constructor(options = {}) {
		this.ttlMs = options.ttlMs || DEFAULT_TTL_MS;
		this.timeoutMs = options.timeoutMs || FETCH_TIMEOUT_MS;
		this.resourcesPath = options.resourcesPath !== undefined ? options.resourcesPath : process.resourcesPath;
		this.fetchImpl = options.fetchImpl || fetch;
		this.cached = null;
	}

	/**
	 * 从磁盘缓存恢复快照（ReleaseService readDiskCache 注入），仅恢复含时间戳的完整记录
	 */
	hydrate(snapshot) {
		if (snapshot && typeof snapshot === 'object' && snapshot.lastFetchedAt) {
			this.cached = { ...snapshot };
		}
	}

	/**
	 * 当前快照（供持久化与 API 输出）
	 */
	snapshot() {
		return this.cached ? { ...this.cached } : null;
	}

	/**
	 * 确保探针结果新鲜；force 绕过 TTL（检查与同步按钮）
	 * 返回快照：state 'ok'（version 可用）| 'unavailable'（reason 说明），探测任何异常都收敛为 unavailable
	 */
	async ensureFresh(force = false) {
		const now = Date.now();
		if (!force && this.cached && now - (this.cached.lastFetchedAt || 0) < this.ttlMs) {
			return this.snapshot();
		}

		const result = {
			version: null,
			stagingPercentage: null,
			channel: null,
			feedBaseUrl: null,
			state: 'unavailable',
			reason: null,
			lastFetchedAt: now,
			etag: null,
			lastModified: null,
		};

		try {
			const hostConfig = readHostUpdateConfig(this.resourcesPath);
			result.feedBaseUrl = hostConfig.feedBaseUrl;
			const channel = resolveUpdateChannel(hostConfig);
			result.channel = channel;
			const url = buildChannelFileUrl(result.feedBaseUrl, channel);

			const headers = { 'User-Agent': 'dsh-changelog-viewer' };
			if (!force && this.cached?.etag) headers['If-None-Match'] = this.cached.etag;
			if (!force && this.cached?.lastModified) headers['If-Modified-Since'] = this.cached.lastModified;

			const controller = new AbortController();
			const timer = setTimeout(() => controller.abort(), this.timeoutMs);
			try {
				const response = await this.fetchImpl(url, { headers, signal: controller.signal });
				if (response.status === 304 && this.cached?.version) {
					result.version = this.cached.version;
					result.stagingPercentage = this.cached.stagingPercentage ?? null;
					result.channel = this.cached.channel || channel;
					result.state = 'ok';
					result.etag = this.cached.etag;
					result.lastModified = this.cached.lastModified;
				} else if (response.status === 200) {
					const text = await response.text();
					const parsed = parseFeedYaml(text);
					if (parsed) {
						result.version = parsed.version;
						result.stagingPercentage = parsed.stagingPercentage;
						result.state = 'ok';
						result.etag = response.headers.get('etag');
						result.lastModified = response.headers.get('last-modified');
					} else {
						result.reason = 'invalid-feed-payload';
					}
				} else {
					result.reason = `http-${response.status}`;
				}
			} finally {
				clearTimeout(timer);
			}
		} catch (err) {
			result.reason = err?.name === 'AbortError' ? 'timeout' : String(err?.message ?? err);
		}

		this.cached = result;
		return this.snapshot();
	}
}
