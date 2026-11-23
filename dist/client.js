window.__ModuleLoader__.load({id:"@supertiny99/dsh-changelog-viewer",factory:(require)=>{const module={exports:{}};const exports=module.exports;
var H=Object.create;var C=Object.defineProperty;var A=Object.getOwnPropertyDescriptor;var F=Object.getOwnPropertyNames;var q=Object.getPrototypeOf,G=Object.prototype.hasOwnProperty;var O=(l,a)=>{for(var o in a)C(l,o,{get:a[o],enumerable:!0})},D=(l,a,o,i)=>{if(a&&typeof a=="object"||typeof a=="function")for(let r of F(a))!G.call(l,r)&&r!==o&&C(l,r,{get:()=>a[r],enumerable:!(i=A(a,r))||i.enumerable});return l};var V=(l,a,o)=>(o=l!=null?H(q(l)):{},D(a||!l||!l.__esModule?C(o,"default",{value:l,enumerable:!0}):o,l)),T=l=>D(C({},"__esModule",{value:!0}),l);var R={};O(R,{apply:()=>X,inject:()=>Q,installUpdateInterceptor:()=>B,isNativeUpdateButton:()=>j,openGlobalUpdateConfirmation:()=>S});module.exports=T(R);var e=V(require("react"),1),I=require("react-dom/client");var z=`/* DSH Changelog Viewer \u6837\u5F0F\u8868 (\u4E25\u683C\u9075\u5B88 docs/ui-style-guide.md \u5B98\u65B9\u89C4\u8303\uFF0C\u5B8C\u7F8E\u81EA\u9002\u5E94\u6DF1\u6D45\u4E3B\u9898) */

/* 1. \u8BED\u4E49\u522B\u540D\u5C42 (\u5BF9\u9F50\u5B98\u65B9 --dsw-* token\uFF0C\u660E\u6697\u4E3B\u9898\u96F6\u6210\u672C\u968F\u5BBF\u4E3B\u81EA\u9002\u5E94) */
:root, .cl-section-root, .cl-modal-overlay {
	--cl-ink: var(--dsw-alias-label-primary, #18181b);
	--cl-ink2: var(--dsw-alias-label-secondary, #52525b);
	--cl-ink3: var(--dsw-alias-label-tertiary, #71717a);
	--cl-ink4: var(--dsw-alias-label-caption, #a1a1aa);

	--cl-bg-base: var(--dsw-alias-bg-base, #ffffff);
	--cl-bg-card: var(--dsw-alias-bg-layer-2, var(--dsw-alias-surface-raised, #ffffff));
	--cl-bg-card-raised: var(--dsw-alias-bg-layer-3, var(--dsw-alias-bg-layer-2, #fafafa));
	--cl-bg-hover: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.05));
	--cl-bg-subtle: var(--dsw-alias-bg-layer-1, rgba(0, 0, 0, 0.02));

	--cl-line: var(--dsw-alias-border-l2, var(--dsw-alias-border-subtle, rgba(0, 0, 0, 0.08)));
	--cl-line-subtle: var(--dsw-alias-border-l1, rgba(0, 0, 0, 0.05));
	--cl-line-focus: var(--dsw-alias-border-l4, rgba(0, 0, 0, 0.16));

	--cl-primary: var(--dsw-alias-button-primary-fill, #4f46e5);
	--cl-on-primary: var(--dsw-alias-label-primary-inverted, #ffffff);
	--cl-shadow-modal: var(--dsw-elevation-soft, 0 16px 40px -8px rgba(0, 0, 0, 0.18));
}

.cl-section-root {
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 14px;
	color: var(--cl-ink);
	font-family: var(--dsw-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif);
	box-sizing: border-box;
}

/* \u9876\u90E8\u7248\u672C\u6982\u89C8\u6761 - \u5F7B\u5E95\u675C\u7EDD\u6587\u5B57\u622A\u65AD\u4E0E\u4E0D\u5408\u7406\u6298\u884C\uFF0C\u80CC\u666F\u4E0E\u6587\u5B57\u968F\u4E3B\u9898 */
.cl-status-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	padding: 12px 18px;
	background-color: var(--cl-bg-card);
	border: 1px solid var(--cl-line);
	border-radius: var(--dsw-radius-sm, 8px);
	flex-wrap: wrap;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.cl-status-info {
	display: flex;
	align-items: center;
	gap: 20px;
	flex-wrap: wrap;
}

.cl-status-item {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	white-space: nowrap;
	flex-shrink: 0;
	font-size: 13px;
}

.cl-status-label {
	color: var(--cl-ink2);
	white-space: nowrap;
	flex-shrink: 0;
}

.cl-version-pill {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 3px 8px;
	border-radius: 6px;
	background-color: var(--cl-bg-hover);
	color: var(--cl-ink);
	font-weight: 500;
	font-size: 12.5px;
	white-space: nowrap;
	flex-shrink: 0;
}

.cl-badge {
	font-size: 10.5px;
	padding: 2px 6px;
	border-radius: 4px;
	font-weight: 500;
	line-height: 1.2;
	white-space: nowrap;
	flex-shrink: 0;
	display: inline-block;
}

.cl-badge-current {
	background-color: rgba(16, 185, 129, 0.15);
	color: var(--dsw-alias-intent-success, #10b981);
	border: 1px solid rgba(16, 185, 129, 0.3);
}

.cl-badge-latest {
	background-color: rgba(79, 70, 229, 0.15);
	color: var(--cl-primary);
	border: 1px solid rgba(79, 70, 229, 0.3);
}

.cl-badge-rc {
	background-color: rgba(245, 158, 11, 0.15);
	color: var(--dsw-alias-intent-warning, #f59e0b);
	border: 1px solid rgba(245, 158, 11, 0.25);
}

/* \u5B98\u65B9\u66F4\u65B0\u6E90\u540C\u6B65\u72B6\u6001\u5FBD\u6807\uFF08cl-CHG-003 \u4E09\u6001\uFF1A\u5DF2\u63A8\u9001 / \u672A\u63A8\u9001 / \u672A\u77E5\uFF09 */
.cl-badge-sync-pushed {
	background-color: rgba(16, 185, 129, 0.15);
	color: var(--dsw-alias-intent-success, #10b981);
	border: 1px solid rgba(16, 185, 129, 0.3);
}

.cl-badge-sync-pending {
	background-color: rgba(245, 158, 11, 0.15);
	color: var(--dsw-alias-intent-warning, #f59e0b);
	border: 1px solid rgba(245, 158, 11, 0.25);
}

.cl-badge-sync-unknown {
	background-color: var(--cl-bg-subtle, rgba(0, 0, 0, 0.02));
	color: var(--cl-ink3, #71717a);
	border: 1px solid var(--cl-line, rgba(0, 0, 0, 0.08));
}

.cl-refresh-btn {
	background: transparent;
	border: 1px solid var(--cl-line);
	border-radius: 6px;
	color: var(--cl-ink2);
	padding: 5px 12px;
	font-size: 12px;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	gap: 5px;
	white-space: nowrap;
	flex-shrink: 0;
	transition: all 0.15s ease;
}

.cl-refresh-btn:hover {
	background-color: var(--cl-bg-hover);
	color: var(--cl-ink);
}

.cl-btn-mock-active {
	background-color: rgba(245, 158, 11, 0.15) !important;
	color: #d97706 !important;
	border-color: rgba(245, 158, 11, 0.45) !important;
	font-weight: 500;
}

/* \u53D1\u73B0\u65B0\u7248\u672C\u9192\u76EE\u5361\u7247 (\u6D45\u8272\u6DF1\u8272\u7686\u9AD8\u5BF9\u6BD4\u53EF\u8BFB) */
.cl-update-card {
	background: color-mix(in srgb, var(--cl-primary) 8%, var(--cl-bg-card));
	border: 1px solid color-mix(in srgb, var(--cl-primary) 32%, transparent);
	border-radius: var(--dsw-radius-sm, 8px);
	padding: 14px 18px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	flex-wrap: wrap;
	box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.cl-update-card-title {
	font-size: 13.5px;
	font-weight: 600;
	color: var(--cl-ink);
	margin-bottom: 4px;
	display: flex;
	align-items: center;
	gap: 8px;
	white-space: nowrap;
}

.cl-update-card-desc {
	font-size: 12px;
	color: var(--cl-ink2);
	line-height: 1.5;
}

.cl-btn-primary {
	background-color: var(--cl-primary);
	color: var(--cl-on-primary);
	border: none;
	border-radius: 6px;
	padding: 7px 16px;
	font-size: 12.5px;
	font-weight: 500;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	gap: 6px;
	transition: filter 0.15s ease;
	white-space: nowrap;
	flex-shrink: 0;
}

.cl-btn-primary:hover {
	filter: brightness(1.1);
}

/* \u4E3B\u65E5\u5FD7\u9605\u8BFB\u5668\u5361\u7247 */
.cl-viewer-card {
	background-color: var(--cl-bg-card);
	border: 1px solid var(--cl-line);
	border-radius: var(--dsw-radius-sm, 8px);
	overflow: hidden;
	display: flex;
	flex-direction: column;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.cl-viewer-toolbar {
	padding: 12px 18px;
	border-bottom: 1px solid var(--cl-line-subtle);
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: 12px;
	background-color: var(--cl-bg-subtle);
}

.cl-toolbar-group {
	display: flex;
	align-items: center;
	gap: 10px;
	white-space: nowrap;
	flex-shrink: 0;
}

.cl-select-version {
	background-color: var(--cl-bg-card);
	border: 1px solid var(--cl-line);
	color: var(--cl-ink);
	border-radius: 6px;
	padding: 5px 10px;
	font-size: 12.5px;
	outline: none;
	cursor: pointer;
	white-space: nowrap;
}

.cl-lang-tabs {
	display: inline-flex;
	background-color: var(--cl-bg-hover);
	border: 1px solid var(--cl-line-subtle);
	border-radius: 6px;
	padding: 2px;
	white-space: nowrap;
	flex-shrink: 0;
}

.cl-lang-tab {
	background: transparent;
	border: none;
	border-radius: 4px;
	padding: 4px 10px;
	font-size: 12px;
	color: var(--cl-ink2);
	cursor: pointer;
	white-space: nowrap;
	flex-shrink: 0;
	transition: all 0.12s ease;
}

.cl-lang-tab.active {
	background-color: var(--cl-bg-card);
	color: var(--cl-ink);
	font-weight: 500;
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.cl-viewer-body {
	padding: 18px 22px;
	max-height: 420px;
	overflow-y: auto;
	font-size: 13px;
	line-height: 1.65;
	color: var(--cl-ink);
}

.cl-md-h2 {
	font-size: 15px;
	font-weight: 600;
	margin: 18px 0 10px;
	padding-bottom: 5px;
	border-bottom: 1px solid var(--cl-line-subtle);
	color: var(--cl-ink);
}

.cl-md-h3 {
	font-size: 14px;
	font-weight: 600;
	margin: 14px 0 8px;
	color: var(--cl-ink);
}

.cl-md-list {
	margin: 4px 0 12px 20px;
	padding: 0;
}

.cl-md-list-item {
	margin-bottom: 6px;
	color: var(--cl-ink);
}

.cl-md-code {
	font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	background-color: var(--cl-bg-hover);
	padding: 2px 5px;
	border-radius: 4px;
	font-size: 12px;
	color: var(--cl-primary);
	border: 1px solid var(--cl-line-subtle);
}

.cl-md-author {
	color: var(--cl-primary);
	font-weight: 500;
}

.cl-md-blockquote {
	margin: 8px 0;
	padding: 8px 14px;
	background-color: var(--cl-bg-hover);
	border-left: 3px solid var(--cl-primary);
	border-radius: 0 4px 4px 0;
	color: var(--cl-ink2);
	font-style: italic;
}

/* \u6A21\u6001\u5F39\u7A97 (UpdateConfirmModal / FullscreenChangelogModal) - \u968F DSH \u4E3B\u9898\u5207\u6362\u81EA\u9002\u5E94 */
.cl-modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.45);
	backdrop-filter: blur(6px);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 9999;
}

.cl-modal {
	background-color: var(--cl-bg-card);
	color: var(--cl-ink);
	border: 1px solid var(--cl-line);
	border-radius: var(--dsw-radius-md, 12px);
	width: 580px;
	max-width: 90vw;
	max-height: 85vh;
	display: flex;
	flex-direction: column;
	box-shadow: var(--cl-shadow-modal);
	overflow: hidden;
}

.cl-modal-header {
	padding: 16px 22px;
	border-bottom: 1px solid var(--cl-line-subtle);
	display: flex;
	align-items: center;
	justify-content: space-between;
	background-color: var(--cl-bg-subtle);
}

.cl-modal-title {
	font-size: 15px;
	font-weight: 600;
	margin: 0;
	color: var(--cl-ink);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.cl-modal-body {
	padding: 20px 24px;
	overflow-y: auto;
	flex: 1;
	color: var(--cl-ink);
}

.cl-modal-notice {
	background-color: color-mix(in srgb, var(--cl-primary) 8%, var(--cl-bg-card));
	border: 1px solid color-mix(in srgb, var(--cl-primary) 25%, transparent);
	border-radius: 8px;
	padding: 10px 14px;
	margin-bottom: 14px;
	font-size: 12.5px;
	color: var(--cl-ink);
	line-height: 1.5;
}

/* \u5F39\u7A97\u53CC\u63D0\u793A\u5757\u7D27\u6392\uFF08\u5347\u7EA7\u628A\u63A7\u63D0\u9192 + \u5B98\u65B9\u66F4\u65B0\u6E90\u72B6\u6001\uFF09 */
.cl-modal-notice + .cl-modal-notice {
	margin-top: -4px;
}

.cl-highlights-title {
	font-size: 13px;
	font-weight: 600;
	margin-bottom: 8px;
	color: var(--cl-ink);
}

.cl-highlights-list {
	margin: 0;
	padding-left: 18px;
	font-size: 12.5px;
	line-height: 1.6;
	color: var(--cl-ink);
}

.cl-modal-footer {
	padding: 14px 22px;
	border-top: 1px solid var(--cl-line-subtle);
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 10px;
	background-color: var(--cl-bg-subtle);
}

.cl-btn {
	padding: 7px 15px;
	border-radius: 6px;
	font-size: 12.5px;
	font-weight: 500;
	cursor: pointer;
	border: 1px solid transparent;
	transition: all 0.15s ease;
	white-space: nowrap;
}

.cl-btn-secondary {
	background-color: transparent;
	border-color: var(--cl-line);
	color: var(--cl-ink2);
}

.cl-btn-secondary:hover {
	background-color: var(--cl-bg-hover);
	color: var(--cl-ink);
}
`;var M=!1;function W(){if(M||typeof document>"u")return;let l=document.createElement("style");l.textContent=z,document.head.appendChild(l),M=!0}function E({content:l=""}){let a=(0,e.useMemo)(()=>{if(!l)return null;let o=l.split(`
`),i=[],r=[],p=0,s=()=>{r.length>0&&(i.push(e.default.createElement("ul",{key:`ul-${p++}`,className:"cl-md-list"},r.map((c,n)=>e.default.createElement("li",{key:n,className:"cl-md-list-item"},g(c))))),r=[])},g=c=>{let n=[],b=0,u=/(\*\*.*?\*\*|`.*?`|@[a-zA-Z0-9_-]+)/g,h;for(;(h=u.exec(c))!==null;){h.index>b&&n.push(c.slice(b,h.index));let f=h[0];f.startsWith("**")&&f.endsWith("**")?n.push(e.default.createElement("strong",{key:b},f.slice(2,-2))):f.startsWith("`")&&f.endsWith("`")?n.push(e.default.createElement("code",{key:b,className:"cl-md-code"},f.slice(1,-1))):f.startsWith("@")&&n.push(e.default.createElement("span",{key:b,className:"cl-md-author"},f)),b=u.lastIndex}return b<c.length&&n.push(c.slice(b)),n.length>0?n:c};for(let c=0;c<o.length;c++){let n=o[c].trim();if(!n){s();continue}if(n.startsWith("### ")||n.startsWith("<h3")){s();let b=n.replace(/<[^>]+>/g,"").replace(/^###\s*/,"");i.push(e.default.createElement("h3",{key:`h3-${p++}`,className:"cl-md-h3"},b))}else if(n.startsWith("## ")||n.startsWith("<h2")){s();let b=n.replace(/<[^>]+>/g,"").replace(/^##\s*/,"");i.push(e.default.createElement("h2",{key:`h2-${p++}`,className:"cl-md-h2"},b))}else n.startsWith("- ")||n.startsWith("* ")?r.push(n.replace(/^[-*]\s+/,"")):n.startsWith("> ")?(s(),i.push(e.default.createElement("blockquote",{key:`bq-${p++}`,className:"cl-md-blockquote"},g(n.replace(/^>\s*/,""))))):(s(),!n.startsWith("[\u4E2D\u6587]")&&!n.startsWith("<p")&&i.push(e.default.createElement("p",{key:`p-${p++}`,style:{margin:"6px 0"}},g(n))))}return s(),i},[l]);return e.default.createElement("div",null,a)}function P({release:l,feed:a,onClose:o,onConfirm:i}){let[r,p]=(0,e.useState)(!1);if(!l)return null;let s=a?.version||null,g=a?.stagingPercentage,c=l.syncState||"unknown",n;if(c==="pending")n=`\u5B98\u65B9\u66F4\u65B0\u6E90\u5C1A\u672A\u63A8\u9001\u6B64\u7248\u672C\uFF08\u66F4\u65B0\u6E90\u5F53\u524D ${s?`v${s}`:"\u7248\u672C\u672A\u77E5"}\uFF09\u3002\u73B0\u5728\u786E\u8BA4\u4E0B\u8F7D\u4F1A\u63D0\u793A\u300C\u5DF2\u662F\u6700\u65B0\u7248\u672C\u300D\uFF0C\u5EFA\u8BAE\u7A0D\u540E\u5B98\u65B9\u63A8\u9001\u540C\u6B65\u540E\u518D\u6765\u66F4\u65B0\u3002`;else if(c==="pushed"){let u=[];s&&s!==l.version&&u.push(`\u66F4\u65B0\u6E90\u5F53\u524D\u63D0\u4F9B v${s}`),typeof g=="number"&&g<100&&u.push(`\u7070\u5EA6\u63A8\u9001\u4E2D\uFF08${g}%\uFF09\uFF0C\u672C\u673A\u53EF\u80FD\u6682\u4E0D\u53EF\u89C1`),n=`\u5B98\u65B9\u66F4\u65B0\u6E90\u5DF2\u63A8\u9001${u.length?`\uFF1A${u.join("\uFF0C")}`:""}\uFF0C\u786E\u8BA4\u540E\u5C06\u7531\u5B98\u65B9\u66F4\u65B0\u5668\u6267\u884C\u4E0B\u8F7D\u3002`}else n="\u6682\u672A\u80FD\u63A2\u6D4B\u5B98\u65B9\u66F4\u65B0\u6E90\u72B6\u6001\uFF08\u7F51\u7EDC\u53D7\u9650\u65F6\u5E38\u89C1\uFF09\uFF0C\u5C06\u6309\u73B0\u6709\u6D41\u7A0B\u7EE7\u7EED\u6267\u884C\u3002";let b=async()=>{p(!0);try{await i()}finally{p(!1),o()}};return e.default.createElement("div",{className:"cl-modal-overlay",onClick:o},e.default.createElement("div",{className:"cl-modal",onClick:u=>u.stopPropagation()},e.default.createElement("div",{className:"cl-modal-header"},e.default.createElement("h3",{className:"cl-modal-title"},"\u53D1\u73B0 DSH \u5B98\u65B9\u65B0\u7248\u672C\uFF1A",l.name||l.version),e.default.createElement("button",{className:"cl-refresh-btn",onClick:o},"\u2715")),e.default.createElement("div",{className:"cl-modal-body"},e.default.createElement("div",{className:"cl-modal-notice"},e.default.createElement("strong",null,"\u5347\u7EA7\u628A\u63A7\u63D0\u9192\uFF1A")," \u4E3A\u907F\u514D\u610F\u5916\u4E0D\u517C\u5BB9\uFF0C\u8BF7\u5148\u5BA1\u9605\u672C\u6B21\u66F4\u65B0\u6539\u52A8\uFF0C\u786E\u8BA4\u7B26\u5408\u9884\u671F\u540E\u518D\u5F00\u59CB\u4E0B\u8F7D\u5347\u7EA7\u3002"),e.default.createElement("div",{className:"cl-modal-notice cl-modal-notice-feed"},e.default.createElement("strong",null,"\u5B98\u65B9\u66F4\u65B0\u6E90\uFF1A"),n),e.default.createElement("div",{className:"cl-highlights-title"},"\u2728 \u672C\u6B21\u66F4\u65B0\u6838\u5FC3\u91CD\u70B9\uFF1A"),l.highlights&&l.highlights.length>0?e.default.createElement("ul",{className:"cl-highlights-list"},l.highlights.map((u,h)=>e.default.createElement("li",{key:h},u))):e.default.createElement("p",{style:{fontSize:13,color:"var(--cl-ink2, #71717a)"}},"\u5B98\u65B9\u6682\u672A\u63D0\u4F9B\u77ED\u6458\u8981\uFF0C\u53EF\u5207\u6362\u5168\u5C4F\u8BE6\u7EC6\u9605\u8BFB\u5B8C\u6574\u53D1\u5E03\u6B63\u6587\u3002"),e.default.createElement("div",{style:{marginTop:14,fontSize:11,color:"var(--cl-ink3, #a1a1aa)"}},"\u53D1\u5E03\u65E5\u671F\uFF1A",new Date(l.publishedAt).toLocaleString("zh-CN")," \xA0\xB7\xA0",l.isPrerelease?"\u9884\u53D1\u5E03\u7248 (Pre-release)":"\u6B63\u5F0F\u53D1\u5E03 (Stable)")),e.default.createElement("div",{className:"cl-modal-footer"},e.default.createElement("button",{className:"cl-btn cl-btn-secondary",onClick:o,disabled:r},"\u6682\u4E0D\u66F4\u65B0"),e.default.createElement("button",{className:"cl-btn cl-btn-primary",onClick:b,disabled:r||c==="pending"},c==="pending"?"\u5C1A\u672A\u63A8\u9001\uFF0C\u6682\u4E0D\u53EF\u66F4\u65B0":r?"\u6B63\u5728\u51C6\u5907\u4E0B\u8F7D...":"\u786E\u8BA4\u4E0B\u8F7D\u5E76\u66F4\u65B0"))))}function Y({release:l,langTab:a,setLangTab:o,onClose:i}){if(!l)return null;let r=a==="cn"?l.bodyCn||l.rawBody:a==="en"&&l.bodyEn||l.rawBody;return e.default.createElement("div",{className:"cl-modal-overlay",onClick:i},e.default.createElement("div",{className:"cl-modal",style:{width:720,height:"80vh"},onClick:p=>p.stopPropagation()},e.default.createElement("div",{className:"cl-modal-header"},e.default.createElement("div",{style:{display:"flex",alignItems:"center",gap:10}},e.default.createElement("h3",{className:"cl-modal-title"},l.name||l.tag," \u5B8C\u6574\u53D1\u5E03\u8BF4\u660E"),l.isCurrent&&e.default.createElement("span",{className:"cl-badge cl-badge-current"},"\u5F53\u524D\u5DF2\u88C5")),e.default.createElement("div",{style:{display:"flex",alignItems:"center",gap:8}},e.default.createElement("div",{className:"cl-lang-tabs"},e.default.createElement("button",{className:`cl-lang-tab ${a==="cn"?"active":""}`,onClick:()=>o("cn")},"\u4E2D\u6587"),e.default.createElement("button",{className:`cl-lang-tab ${a==="en"?"active":""}`,onClick:()=>o("en")},"English"),e.default.createElement("button",{className:`cl-lang-tab ${a==="all"?"active":""}`,onClick:()=>o("all")},"\u5168\u90E8")),e.default.createElement("button",{className:"cl-refresh-btn",onClick:i},"\u2715"))),e.default.createElement("div",{className:"cl-modal-body",style:{padding:"20px 24px",flex:1,overflowY:"auto"}},e.default.createElement(E,{content:r})),e.default.createElement("div",{className:"cl-modal-footer"},e.default.createElement("a",{href:l.htmlUrl,target:"_blank",rel:"noreferrer",className:"cl-refresh-btn"},"\u5728 GitHub \u67E5\u770B\u539F\u59CB\u7F51\u9875 \u2197"),e.default.createElement("button",{className:"cl-btn cl-btn-secondary",onClick:i},"\u5173\u95ED"))))}function Z(){let[l,a]=(0,e.useState)(null),[o,i]=(0,e.useState)(!0),[r,p]=(0,e.useState)(null),[s,g]=(0,e.useState)("cn"),[c,n]=(0,e.useState)(!1),[b,u]=(0,e.useState)(!1),[h,f]=(0,e.useState)(null),[m,U]=(0,e.useState)(!1);W(),(0,e.useEffect)(()=>(window.__mockDshUpdate=(t=!0)=>{U(!!t),console.log(`%c[changelog-viewer] \u6A21\u62DF\u65B0\u7248\u672C\u72B6\u6001\u5DF2${t?"\u5F00\u542F \u{1F680}":"\u5173\u95ED \u23F9"}`,"color: #10b981; font-weight: bold;")},window.__showDshUpdateModal=()=>{n(!0),console.log("%c[changelog-viewer] \u5DF2\u6253\u5F00\u7248\u672C\u66F4\u65B0\u524D\u7F6E\u786E\u8BA4\u5F39\u7A97","color: #6366f1; font-weight: bold;")},()=>{try{delete window.__mockDshUpdate,delete window.__showDshUpdateModal}catch{}}),[]);let y=(0,e.useCallback)(async(t=!1)=>{i(!0);try{let w=await(await fetch(`/changelog-viewer/releases${t?"?force=1":""}`)).json();w.ok&&(a(w),!r&&w.releases?.length>0&&p(w.releases[0].tag))}catch(x){console.error("[changelog-viewer] Fetch error:",x)}finally{i(!1)}},[r]);(0,e.useEffect)(()=>{y(!1)},[y]),(0,e.useEffect)(()=>{let t=()=>{typeof document<"u"&&document.visibilityState==="visible"&&y(!1)};return window.addEventListener("focus",t),document.addEventListener("visibilitychange",t),()=>{window.removeEventListener("focus",t),document.removeEventListener("visibilitychange",t)}},[y]),(0,e.useEffect)(()=>{let t=window.dshDesktop?.updates;if(t?.status&&t.status().then(x=>{f(x)}).catch(()=>{}),t?.subscribe){let x=t.subscribe(w=>{f(w)});return()=>{typeof x=="function"&&x()}}},[]);let k=(0,e.useMemo)(()=>({name:"v0.2.3 (\u6A21\u62DF\u65B0\u7248\xB7\u6D4B\u8BD5\u4E13\u7528)",version:"0.2.3",tag:"v0.2.3",publishedAt:new Date().toISOString(),isPrerelease:!0,highlights:["\u65B0\u589E\u529F\u80FD\uFF1A\u589E\u52A0\u65B0\u7248\u672C\u66F4\u65B0\u524D\u7F6E\u786E\u8BA4\u6D41\u7A0B\uFF0C\u675C\u7EDD\u610F\u5916\u66F4\u65B0\u3002","\u529F\u80FD\u4F53\u9A8C\uFF1A\u66F4\u65B0\u65E5\u5FD7\u5F52\u4F4D\u81F3\u8BBE\u7F6E\u9875\u300C\u7248\u672C\u66F4\u65B0\u65E5\u5FD7\u300D\uFF0C\u652F\u6301\u591A\u8BED\u8A00\u4E0E\u5168\u5C4F\u9605\u8BFB\u3002","\u754C\u9762\u4F18\u5316\uFF1A\u5168\u81EA\u9002\u5E94\u6D41\u5F0F\u6392\u7248\uFF0C\u5F7B\u5E95\u89E3\u51B3\u6587\u5B57\u622A\u65AD\u4E0E\u5355\u5B57\u6298\u884C\u3002","\u67B6\u6784\u7A33\u5065\uFF1A\u5B8C\u5584\u79BB\u7EBF\u79CD\u5B50\u6570\u636E\u515C\u5E95\u4E0E E-Tag \u672C\u5730\u7F13\u5B58\u673A\u5236\u3002"],bodyCn:`### \u{1F680} \u6838\u5FC3\u65B0\u589E\u529F\u80FD
- \u652F\u6301\u5728\u5B98\u65B9\u53D1\u5E03\u65B0\u7248\u672C\u65F6\uFF0C\u5148\u5BA1\u9605\u66F4\u65B0\u65E5\u5FD7\u91CD\u70B9\uFF0C\u518D\u624B\u52A8\u786E\u8BA4\u66F4\u65B0\u3002
- \u4F18\u5316\u5BA2\u6237\u7AEF\u591A\u5C42\u534F\u4F5C\u4E0E\u6D41\u5F0F\u8F93\u51FA\u6027\u80FD\u3002

### \u{1F6E0}\uFE0F \u4F53\u9A8C\u4E0E\u7A33\u5B9A\u6027\u4F18\u5316
- \u4FEE\u590D\u8BBE\u7F6E\u9875\u6392\u7248\u88AB\u6324\u538B\u6362\u884C\u7684\u95EE\u9898\u3002
- \u63D0\u5347\u66F4\u65B0\u4E0B\u8F7D\u5B8C\u6574\u6027\u6821\u9A8C\u673A\u5236\u3002`,rawBody:`### Release v0.2.3
- Pre-update confirmation modal with changelog preview.
- Layout refactor and bug fixes.`,htmlUrl:"https://github.com/deepseek-ai/dsh/releases"}),[]),v=(0,e.useMemo)(()=>m&&r==="v0.2.3"?k:l?.releases?l.releases.find(t=>t.tag===r)||l.releases[0]:m?k:null,[l,r,m,k]),d=(0,e.useMemo)(()=>m?k:l?.releases?.[0]||null,[l,m,k]),N=(0,e.useMemo)(()=>m||h?.phase==="available"?!0:l?.hasUpdate||!1,[m,h,l]),L=async()=>{if(m){console.log("%c\u{1F389} [\u6A21\u62DF\u6D4B\u8BD5\u6210\u529F] \u7528\u6237\u5DF2\u5B8C\u6210\u524D\u7F6E\u5BA1\u9605\u5E76\u70B9\u51FB\u786E\u8BA4\uFF01\u653E\u884C\u5E76\u8C03\u7528\u5E95\u5C42\u66F4\u65B0\u5668 updates.open()","color: #10b981; font-weight: bold; font-size: 13px;"),alert(`\u{1F389}\u3010\u6D4B\u8BD5\u9A8C\u8BC1\u6210\u529F\u3011

1. \u5DF2\u6210\u529F\u5148\u67E5\u9605\u76EE\u6807\u7248\u672C Changelog
2. \u7528\u6237\u5DF2\u660E\u786E\u70B9\u51FB\u3010\u786E\u8BA4\u4E0B\u8F7D\u5E76\u66F4\u65B0\u3011
3. \u5DF2\u653E\u884C\u5E95\u5C42\u66F4\u65B0\u6267\u884C\u5668\uFF08window.dshDesktop.updates.open\uFF09`);return}window.dshDesktop?.updates?.open?await window.dshDesktop.updates.open():d?.htmlUrl&&window.open(d.htmlUrl,"_blank")};return e.default.createElement("div",{className:"cl-section-root"},e.default.createElement("div",{className:"cl-status-bar"},e.default.createElement("div",{className:"cl-status-info"},e.default.createElement("div",{className:"cl-status-item"},e.default.createElement("span",{className:"cl-status-label"},"\u5F53\u524D\u5B89\u88C5\u7248\u672C:"),e.default.createElement("span",{className:"cl-version-pill"},l?.currentVersion||"\u68C0\u6D4B\u4E2D...",e.default.createElement("span",{className:"cl-badge cl-badge-current"},"\u5DF2\u5B89\u88C5"))),d&&e.default.createElement("div",{className:"cl-status-item"},e.default.createElement("span",{className:"cl-status-label"},"\u5B98\u65B9\u6700\u65B0:"),e.default.createElement("span",{className:"cl-version-pill"},d.name||d.version,N?e.default.createElement("span",{className:"cl-badge cl-badge-latest"},"\u53EF\u66F4\u65B0"):e.default.createElement("span",{className:"cl-badge cl-badge-current"},"\u5DF2\u662F\u6700\u65B0"),N&&d.syncState==="pushed"&&e.default.createElement("span",{className:"cl-badge cl-badge-sync-pushed"},"\u5DF2\u5165\u66F4\u65B0\u6E90"),N&&d.syncState==="pending"&&e.default.createElement("span",{className:"cl-badge cl-badge-sync-pending"},"\u6E90\u672A\u63A8\u9001"),N&&(!d.syncState||d.syncState==="unknown")&&e.default.createElement("span",{className:"cl-badge cl-badge-sync-unknown"},"\u6E90\u72B6\u6001\u672A\u77E5")))),e.default.createElement("div",{style:{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}},m&&e.default.createElement("button",{className:"cl-refresh-btn cl-btn-mock-active",onClick:()=>U(!1),title:"\u70B9\u51FB\u9000\u51FA\u6A21\u62DF\u6D4B\u8BD5\u72B6\u6001"},"\u2715 \u9000\u51FA\u6A21\u62DF"),e.default.createElement("button",{className:"cl-refresh-btn",onClick:()=>y(!0),title:"\u5F3A\u5236\u91CD\u65B0\u62C9\u53D6\u5B98\u65B9\u53D1\u5E03\u65E5\u5FD7"},o?"\u6B63\u5728\u540C\u6B65...":"\u21BB \u68C0\u67E5\u4E0E\u540C\u6B65"))),N&&d&&e.default.createElement("div",{className:"cl-update-card"},e.default.createElement("div",null,e.default.createElement("div",{className:"cl-update-card-title"},e.default.createElement("span",null,"\u{1F680}"),e.default.createElement("span",null,"\u53D1\u73B0 DSH \u5B98\u65B9\u65B0\u7248\u672C\uFF1A",d.name||d.version),d.isPrerelease&&e.default.createElement("span",{className:"cl-badge cl-badge-rc"},"Pre-release"),d.syncState==="pushed"&&e.default.createElement("span",{className:"cl-badge cl-badge-sync-pushed"},"\u5DF2\u5165\u66F4\u65B0\u6E90"),d.syncState==="pending"&&e.default.createElement("span",{className:"cl-badge cl-badge-sync-pending"},"\u6E90\u672A\u63A8\u9001"),(!d.syncState||d.syncState==="unknown")&&e.default.createElement("span",{className:"cl-badge cl-badge-sync-unknown"},"\u6E90\u72B6\u6001\u672A\u77E5")),e.default.createElement("div",{className:"cl-update-card-desc"},"\u5B98\u65B9\u5DF2\u53D1\u5E03\u65B0\u7248\u672C\u3002\u5EFA\u8BAE\u5148\u67E5\u9605\u66F4\u65B0\u91CD\u70B9\u4E0E\u53D8\u52A8\u8BF4\u660E\uFF0C\u518D\u786E\u8BA4\u662F\u5426\u4E0B\u8F7D\u5347\u7EA7\u3002",d.syncState==="pending"&&l?.feed?.version?`\uFF08\u5B98\u65B9\u66F4\u65B0\u6E90\u5C1A\u672A\u63A8\u9001\uFF0C\u6E90\u4E0A\u5F53\u524D v${l.feed.version}\uFF0C\u73B0\u5728\u786E\u8BA4\u66F4\u65B0\u4F1A\u63D0\u793A\u5DF2\u662F\u6700\u65B0\u3002\uFF09`:"")),e.default.createElement("button",{className:"cl-btn-primary",onClick:()=>n(!0)},"\u67E5\u770B\u53D8\u66F4\u5E76\u66F4\u65B0")),e.default.createElement("div",{className:"cl-viewer-card"},e.default.createElement("div",{className:"cl-viewer-toolbar"},e.default.createElement("div",{className:"cl-toolbar-group"},e.default.createElement("span",{className:"cl-status-label"},"\u9009\u62E9\u7248\u672C:"),e.default.createElement("select",{className:"cl-select-version",value:r||"",onChange:t=>p(t.target.value)},l?.releases?.map(t=>e.default.createElement("option",{key:t.tag,value:t.tag},t.name||t.version," ",t.isCurrent?"\uFF08\u5F53\u524D\u7248\u672C\uFF09":""," ",t.tag===d?.tag?"\uFF08\u6700\u65B0\uFF09":""))),v?.isCurrent&&e.default.createElement("span",{className:"cl-badge cl-badge-current"},"\u5F53\u524D\u5DF2\u88C5"),v?.isPrerelease&&e.default.createElement("span",{className:"cl-badge cl-badge-rc"},"RC")),e.default.createElement("div",{className:"cl-toolbar-group"},e.default.createElement("div",{className:"cl-lang-tabs"},e.default.createElement("button",{className:`cl-lang-tab ${s==="cn"?"active":""}`,onClick:()=>g("cn")},"\u4E2D\u6587"),e.default.createElement("button",{className:`cl-lang-tab ${s==="en"?"active":""}`,onClick:()=>g("en")},"English"),e.default.createElement("button",{className:`cl-lang-tab ${s==="all"?"active":""}`,onClick:()=>g("all")},"\u5168\u90E8")),e.default.createElement("button",{className:"cl-refresh-btn",onClick:()=>u(!0),title:"\u5728\u5927\u7A97\u53E3\u4E2D\u5B8C\u6574\u9605\u8BFB"},"\u5C55\u5F00\u5168\u6587 \u2197"))),e.default.createElement("div",{className:"cl-viewer-body"},o&&!l?e.default.createElement("div",{style:{padding:24,textAlign:"center",color:"var(--cl-ink3, #a1a1aa)"}},"\u6B63\u5728\u52A0\u8F7D\u7248\u672C\u66F4\u65B0\u8BB0\u5F55..."):v?e.default.createElement(E,{content:s==="cn"?v.bodyCn||v.rawBody:s==="en"&&v.bodyEn||v.rawBody}):e.default.createElement("div",{style:{padding:24,textAlign:"center",color:"var(--cl-ink3, #a1a1aa)"}},"\u6682\u65E0\u7248\u672C\u8BF4\u660E"))),c&&e.default.createElement(P,{release:d,feed:l?.feed,onClose:()=>n(!1),onConfirm:L}),b&&e.default.createElement(Y,{release:v,langTab:s,setLangTab:g,onClose:()=>u(!1)}))}var _=null,$=null;function J(){if(typeof document>"u")return null;if(!$){let l=document.getElementById("cl-global-update-host");l||(l=document.createElement("div"),l.id="cl-global-update-host",document.body.appendChild(l)),$=l,_=(0,I.createRoot)(l)}return _}function S(l=null,a=null){W();let o=J();if(!o)return;let i=()=>{o.render(null)},r=async()=>{try{typeof a=="function"?await a():window.dshDesktop?.updates?.open?await window.dshDesktop.updates.open():l?.htmlUrl&&window.open(l.htmlUrl,"_blank")}catch(s){console.error("[changelog-viewer] \u6267\u884C\u66F4\u65B0\u5F02\u5E38:",s)}finally{i()}},p=(s,g=null)=>{o.render(e.default.createElement(P,{release:s,feed:g,onClose:i,onConfirm:r}))};l?p(l):fetch("/changelog-viewer/releases").then(s=>s.json()).then(s=>{let g=s.releases?.[0]||{name:"DSH \u5B98\u65B9\u65B0\u7248\u672C",version:"\u6700\u65B0\u7248",highlights:["\u53D1\u73B0\u65B0\u7248\u672C\uFF0C\u8BF7\u786E\u8BA4\u5347\u7EA7\u4EE5\u83B7\u5F97\u6700\u65B0\u7279\u6027\u4E0E\u7A33\u5B9A\u6027\u4FEE\u590D\u3002"],publishedAt:new Date().toISOString()};p(g,s.feed||null)}).catch(()=>{p({name:"DSH \u5B98\u65B9\u65B0\u7248\u672C",version:"\u6700\u65B0\u7248",highlights:["\u6B63\u5728\u4ECE\u672C\u5730\u79BB\u7EBF\u914D\u7F6E\u540C\u6B65\uFF0C\u8BF7\u786E\u8BA4\u662F\u5426\u7EE7\u7EED\u66F4\u65B0\u3002"],publishedAt:new Date().toISOString()})})}function j(l){if(!l||typeof l.closest!="function")return!1;let a=l.closest("button");if(!a)return!1;let o=(a.getAttribute("aria-label")||"").trim(),i=(a.textContent||"").trim(),r=a.className||"",s=["\u65B0\u7248\u672C","Update","\u91CD\u8BD5\u66F4\u65B0","Retry","\u53EF\u66F4\u65B0"].some(n=>o===n||o.startsWith(n)||i===n||i.startsWith(n)),g=typeof r=="string"&&r.includes("indicator"),c=!!(a.closest('[class*="triggerRow"]')||a.closest('[class*="railRow"]'));return!!(s&&(c||g)||o==="\u65B0\u7248\u672C"||o==="Update")}function B(){if(typeof document>"u"||window.__dshUpdateInterceptorInstalled)return;window.__dshUpdateInterceptorInstalled=!0;let l=a=>{try{j(a.target)&&(console.log("%c[changelog-viewer] \u26A1 \u6210\u529F\u62E6\u622A DSH \u9ED8\u8BA4\u5DE6\u4E0B\u89D2\u66F4\u65B0\u6309\u94AE\u70B9\u51FB\uFF01\u963B\u65AD\u76F4\u63A5\u66F4\u65B0\uFF0C\u8F6C\u7531\u66F4\u65B0\u65E5\u5FD7\u5F39\u7A97\u63A5\u7BA1\u3002","color: #6366f1; font-weight: bold;"),a.preventDefault(),a.stopPropagation(),a.stopImmediatePropagation(),S())}catch(o){console.error("[changelog-viewer] \u62E6\u622A\u5904\u7406\u5F02\u5E38:",o)}};document.addEventListener("click",l,!0);try{let a=window.dshDesktop?.updates;if(a&&typeof a.open=="function"){let o=a.open.bind(a);a.__originalOpen=o,a.open=async()=>{console.log("%c[changelog-viewer] \u62E6\u622A\u5230\u5E95\u5C42 updates.open() \u8C03\u7528\uFF0C\u8F6C\u7531\u66F4\u65B0\u65E5\u5FD7\u5F39\u7A97\u63A5\u7BA1\u3002","color: #6366f1; font-weight: bold;"),S(null,o)}}}catch{}window.__testInterceptNativeUpdate=()=>{console.log("[changelog-viewer] \u6A21\u62DF\u89E6\u53D1\u5DE6\u4E0B\u89D2\u66F4\u65B0\u6309\u94AE\u88AB\u70B9\u51FB..."),S()},console.log("[changelog-viewer] \u5168\u5C40\u66F4\u65B0\u62E6\u622A\u4E0E\u63A5\u7BA1\u5668\u5DF2\u5C31\u7EEA (DOM capture + Global Portal Modal)")}var Q=["slots"];function X(l){B(),l.slots.inject("settings.section",()=>l.slots.register({name:"settings.section",id:"changelog-viewer",order:98,label:"\u7248\u672C\u66F4\u65B0\u65E5\u5FD7"},Z)),console.log("[changelog-viewer] Client slot registered on settings.section")}
return module.exports}})
