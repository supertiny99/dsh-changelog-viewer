import { ReleaseService } from './release-service.js';

export const name = '@supertiny99/dsh-changelog-viewer';

export function apply(ctx) {
	const releaseService = new ReleaseService();

	ctx.inject(['webServer'], (scopeCtx) => {
		scopeCtx.effect?.(() =>
			scopeCtx.webServer.register({
				kind: 'prefix',
				path: '/changelog-viewer',
				handler: async (req, res) => {
					const json = (code, value) => {
						res.writeHead(code, {
							'content-type': 'application/json; charset=utf-8',
							'cache-control': 'no-store',
						});
						res.end(JSON.stringify(value));
					};

					try {
						const url = new URL(req.url ?? '/', 'http://127.0.0.1');
						const pathname = url.pathname.replace(/^\/changelog-viewer/, '') || '/';

						// 路由 1: 获取所有版本列表与元数据
						if (pathname === '/releases' && req.method === 'GET') {
							const force = url.searchParams.get('force') === '1' || url.searchParams.get('refresh') === '1';
							const data = await releaseService.getReleases(force);
							return json(200, data);
						}

						// 路由 2: 获取指定单个版本的 Release 详情
						if (pathname === '/release' && req.method === 'GET') {
							const tag = url.searchParams.get('tag') || url.searchParams.get('version');
							if (!tag) {
								return json(400, { ok: false, error: 'Missing tag or version parameter' });
							}
							const release = await releaseService.getReleaseByTag(tag);
							if (!release) {
								return json(404, { ok: false, error: 'Release not found' });
							}
							return json(200, { ok: true, release });
						}

						// 路由 3: 状态探针
						if (pathname === '/status' && req.method === 'GET') {
							const data = await releaseService.getReleases(false);
							return json(200, {
								ok: true,
								source: data.source,
								lastFetchedAt: data.lastFetchedAt,
								releaseCount: data.releases?.length || 0,
								currentVersion: data.currentVersion,
								latestVersion: data.latestVersion,
								hasUpdate: data.hasUpdate,
							});
						}

						return json(404, { ok: false, error: 'Not found' });
					} catch (err) {
						console.error('[changelog-viewer] WebServer error:', err);
						return json(500, { ok: false, error: String(err?.message ?? err) });
					}
				},
			})
		);

		console.log('[changelog-viewer] WebServer prefix route registered on /changelog-viewer');
	});
}
