import { build, context } from 'esbuild';
import { writeFile } from 'node:fs/promises';

const HOST_SHARED = [
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

const options = {
	entryPoints: ['src/client.jsx'],
	outfile: 'dist/client.js',
	bundle: true,
	format: 'cjs',
	platform: 'browser',
	target: 'chrome120',
	jsx: 'transform',
	jsxFactory: 'React.createElement',
	jsxFragment: 'React.Fragment',
	external: HOST_SHARED,
	loader: { '.css': 'text' },
	minify: !process.argv.includes('--watch'),
	legalComments: 'none',
	metafile: true,
	banner: {
		js: 'window.__ModuleLoader__.load({id:"@supertiny99/dsh-changelog-viewer",factory:(require)=>{const module={exports:{}};const exports=module.exports;',
	},
	footer: {
		js: 'return module.exports}})',
	},
};

if (process.argv.includes('--watch')) {
	const ctx = await context(options);
	await ctx.watch();
	console.log('watching src/');
} else {
	const result = await build(options);
	await writeFile('dist/meta.json', JSON.stringify(result.metafile, null, '\t'));
	const size = Object.values(result.metafile.outputs).find((o) => o.bytes != null);
	const bundled = Object.entries(result.metafile.inputs).filter(
		([path]) => HOST_SHARED.some((spec) => path.startsWith(spec)) || path === 'react' || path.startsWith('react-dom')
	);
	if (bundled.length > 0) {
		console.error('ERROR: React/Host shared modules were bundled instead of externalized:');
		for (const [p] of bundled) console.error('  ', p);
		process.exit(1);
	}
	console.log(`Built dist/client.js: ${(size.bytes / 1024).toFixed(1)} KB (clean external)`);
}
