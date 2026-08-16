# SYSTEM DESIGN — Openbentt (SecuredChatCogerphere)

**Product:** Openbentt · **package.json name:** `openbentt` · **productName:** Openbentt · **Version:** 2.2.5 · **License:** MIT · **Remotes:** `COGERPHEREAILABS/Cobentt` + fork `yuvrajpandey77/Openbentt` (legacy `cogerphere-*` storage keys migrated to `openbentt-*` on boot).

---

## 1. Executive Summary

Openbentt is a **desktop-first, local-first AI workspace** built as a single React/Vite web app that runs identically in the browser and inside an **Electron** shell. Core value propositions:

1. **Bring-your-own-key chat** against OpenRouter, OpenAI, Anthropic, Google Gemini, or any OpenAI-compatible endpoint (Ollama, LM Studio, vLLM), with **SSE streaming** and **per-model latency/token metrics**.
2. **Tiled multi-model comparison** — one prompt fans out in parallel to 2–4 cloud models into a grid with independent metrics.
3. **Two fully local runtimes** — an in-renderer **WebGPU/WASM Qwen/Gemma** path (Transformers.js) and a native **`llama-server`** child process for GGUF models.
4. **A research-grade workspace** — Notebook Studio (LaTeX→PDF), PDF reading/annotation, papers library, RAG over the corpus (MiniLM embeddings + TF-IDF hybrid retrieval), Zotero sync, citation management (CSL), drafting, revisions, and submission tooling.
5. **Privacy-first** — no account system; keys live in browser `localStorage` or Electron OS keychains (`safeStorage`); chat history is local.

Two deployment surfaces share one codebase: a **static web build** (Vercel/nginx/Docker) and an **Electron desktop app** (AppImage/deb/dmg/NSIS) whose main process adds native capability (SQLite, secret vault, llama-server, Zotero, auto-update).

---

## 2. High-Level Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                      Deployment surfaces (one codebase)                │
│  Static web (Vercel/nginx)  ·  Docker (nginx + research proxy)        │
│  Electron desktop (AppImage/deb/dmg/exe) — app:// protocol            │
└───────────────────────────┬────────────────────────────────────────────┘
                            │ Vite build (dist/)
┌───────────────────────────▼────────────────────────────────────────────┐
│  RENDERER — React 18 SPA (src/)                                        │
│  React Router · TanStack Query · React Markdown · shadcn/ui · Tailwind │
│                                                                        │
│  ChatContext (single chat state machine + provider dispatch)           │
│   ├─ streamChatForConfig  → OpenRouter/OpenAI/Anthropic/Gemini (SSE)   │
│   ├─ streamLocalGemmaChat → Transformers.js WebGPU/WASM (in-process)   │
│   └─ streamLocalGgufChat  → IPC → llama-server (HTTP loopback)         │
│  ResearchProjectContext → RAG corpus → hybrid retrieval → prompts      │
│  Notebook Studio → CodeMirror LaTeX → BusyTeX WASM / pdflatex → PDF    │
│  localStorage · IndexedDB · Web Worker (researchEmbedding)             │
└──────────────┬─────────────────────────────────────────────────────────┘
               │ contextBridge (preload.cjs — 5 surfaces, sandboxed)
┌──────────────▼─────────────────────────────────────────────────────────┐
│  ELECTRON MAIN (Node, electron/main.mjs)                               │
│  IPC: desktop:* localGguf:* hfSecret:* secretVault:* zotero:*          │
│        zoteroSecret:* research:*                                       │
│  SQLite (node:sqlite) research.db — projects/embeddings/jobs/chat_logs │
│  job queue + worker_threads (chunkWorker/embedWorker)                  │
│  llama-server child process · Zotero Web API/BBT sync · safeStorage     │
│  electron-updater · GPU safe-mode & crash auto-relaunch                │
└──────────────┬─────────────────────────────────────────────────────────┘
               │ HTTP (outbound, user-driven)
┌──────────────▼─────────────────────────────────────────────────────────┐
│  SERVERS: server/research-proxy.mjs (8787) · server/latex-compile.mjs  │
│           (8788, pdflatex) · optional Vercel edge api/latex-compile.ts │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack (complete inventory)

### 3.1 Core frameworks

| Tech | Role |
|---|---|
| **Vite 5** (`vite.config.ts`) | Bundler; SWC React plugin; dev server on `:8080` (host `::`, strictPort); proxies `/api/latex-compile` → `127.0.0.1:8788`; manual chunk splitting for transformers/busytex/pdfjs/katex/recharts/mathjs/markdown/ui-vendor; custom `openbenttSeoPlugin` injects canonical/OG/Twitter/JSON-LD/robots |
| **React 18.3** + react-dom | UI; lazy route splitting |
| **TypeScript 5.5** | Renderer typed; `.mjs` used where Electron main imports from `src/` |
| **React Router 6** (`src/App.tsx`) | Routes: `/` (marketing web / projects hub on desktop), `/download`, `/share`, `/setup`, `/projects`, `/notebook`, `/chat` (desktop only), `/labs`, `/write`, `/benchmark`, `/webgpu`; providers nested: QueryClient → Theme → Tooltip → Chat → LocalModel → ResearchProject → Zotero |
| **TanStack Query** | Model catalog caching (hooks like `useOpenRouterModels`) |
| **Tailwind CSS 3.4** + `tailwindcss-animate` + `@tailwindcss/typography` | Styling |
| **shadcn/ui** (Radix primitives) | ~60 components under `src/components/ui/` (dialog, drawer/vaul, sheet, command/cmdk, carousel/embla, resizable panels, sidebar, sonner toasts, chart, logo) |

### 3.2 AI / ML libraries

| Lib | Purpose |
|---|---|
| `@huggingface/transformers` 4.x + `@xenova/transformers` 2.x + `onnxruntime-*` | Local Qwen/Gemma inference (WebGPU/WASM) and MiniLM embeddings; bundled/asar-unpacked for Electron |
| `@google/generative-ai` | Gemini `sendMessageStream` client |
| `texlyre-busytex` (alpha) | In-browser WASM LaTeX (`BusyTexRunner`/`PdfLatex`) — ~175 MB WASM assets in `public/core/busytex`, downloaded at image build |
| `llama-server` (llama.cpp, ggml-org, tag `b9222`) | Native GGUF server, bundled per-platform via `extraResources` + `scripts/download-llama-server.mjs` |

### 3.3 Documents / PDF / LaTeX

`pdfjs-dist` (page render + worker), `katex` (math), `mathjs` (inline `[[calc:…]]`), `jsPDF` + `html2canvas` (raster PDF export), `jszip` (project export, Zotero), `citation-js` (with bibtex + csl plugins, vite aliased), `react-markdown` + `remark-gfm`, `@uiw/react-codemirror` + `@codemirror/language` + `@codemirror/legacy-modes` (stex), `diff` (revision diffs).

### 3.4 UI utilities

`lucide-react` (icons), `recharts` (chart fences + benchmark), `react-resizable-panels` (workspace layout), `cmdk` (command palette), `embla-carousel-react` (marketing carousel), `vaul` (drawer), `sonner` + `@radix-ui/react-toast` (toasts), `react-hook-form` + `zod` + `@hookform/resolvers`, `date-fns`, `clsx`/`tailwind-merge`/`cva`, `next-themes`, `@tanstack/react-virtual` (message virtualization), `lz-string`, `input-otp`, `jwt-decode`, `html-to-image`, `react-day-picker`, `uuid`.

### 3.5 Desktop

`electron` 41, `electron-builder` 26, `electron-updater` (GitHub feed), plus runtime-only deps (`fs-extra`, `semver`, `js-yaml`, `sax`, `onnxruntime-node`) explicitly allowlisted into the asar.

### 3.6 Server / infra

`node:sqlite` (built-in `DatabaseSync`, **not** better-sqlite3), `node:worker_threads`, zero-dependency `http` servers (`research-proxy.mjs`, `latex-compile.mjs`), nginx, Docker (multi-stage, `node:22-bookworm-slim`), GitHub Actions (CI + release), Vercel (edge `api/latex-compile.ts`, analytics).

### 3.7 Testing

Vitest 2 (unit/integration/stress), Node `node --test` for Electron main-process modules, Playwright (Chromium e2e), ESLint 9 + security/pack-guard scripts, `lovable-tagger` (dev-only Vite plugin).

---

## 4. Frontend Application Structure (`src/`)

- **`pages/`** — HomeLandingPage (marketing), DownloadPage, SetupPage (onboarding provider picker), ProjectsHubPage (project grid), NotebookStudioPage, ResearchLabsPage, LatexWorkspacePage, BenchmarkPage (repeated `streamChatForConfig`, CSV of ttft/totalMs/tokens), WebGpuPage (adapter/limits probe + SLM heuristics), ShareViewPage, NotFound.
- **`layouts/AppLayout.tsx`** — app chrome + sidebar; injects per-route `systemAssist` via `setWorkspaceRouteAssist(workspaceMeta.systemAssist)`.
- **`context/`** — the state heart: `ChatContext`, `LocalModelContext`, `ResearchProjectContext`, `ResearchWorkspaceContext`, `NotebookStudioContext` (+ Settings + Viewer), `ZoteroContext`, `ThemeContext`.
- **`lib/`** — ~170 modules: openrouter/aiStream clients, modelManager, modelRouting, gemmaWebGpu, localGguf, research (RAG), latex/pdf/notebook, zotero, privacy/security, chartSpec, systemPrompts, storageMigrate, media, exports.
- **`workers/researchEmbedding.worker.ts`** — web embedding Web Worker.
- **`types/chat.ts`** — all domain types (`Chat`, `Message`, `ApiKeyConfig`, `ComparisonResponse`, `StreamMetrics`, …).
- **`config/`** — `workspaceRouteMeta` (per-route system prompts), `marketingContent`, `platformSurface`, `curatedGgufModels`, `releaseDownloads`.

---

## 5. Chat Subsystem (deep dive)

### 5.1 State machine — `src/context/ChatContext.tsx` (~1114 lines)

Single context owns **all** chat I/O. State: `chats`, `currentChatId`, `apiConfig`, `pendingComposer`, `streamingPromptTokens`, `providerQuotaSnapshot`, `webgpuModelDownloadProgress`, `workspaceAssistTokenEstimate`. Registration refs (not state): `workspaceRouteAssistRef`, `notebookAssistSyncRef`, `corpusRagProviderRef`, `chatLogPersisterRef`, `abortControllersRef`.

**Persistence keys** (exact):
- `openbentt-chats` → full `Chat[]` (dates ISO-string round-tripped)
- `openbentt-current-chat-id`
- `openbentt-api-config` → `ApiKeyConfig`; on desktop secrets are stripped (`apiConfigForBrowserStorage`) and re-injected from the OS vault (`loadDesktopSecretsIntoConfig`); legacy plaintext keys migrated via `migrateLegacySecretsFromConfig`.

**Send path** (`sendMessage`, :963): validates → merges PDF `extractedText` into the message → substitutes `[[calc:…]]` via mathjs → builds messages → `buildPipelineExtras` (auto-RAG evidence + optional live web research via `gatherResearchContext`) → `runAssistantPipeline`.

**Streaming** (`runAssistantPipeline`, :549):
1. System prompts built by `buildSystemPrompts` (workspace assist block prepended as `## Current workspace (this turn)`; optional research context block; chart hint; math/debug/red-team modes).
2. **3-way dispatch**: `detectNotebookRoutedTask` (corpus-evidence → `chat_synthesis`/`chat_drafting` routed task) → `streamLocalGgufChat` → `streamLocalGemmaChat` → `streamChatForConfig` (cloud). All return a uniform `{ text, metrics, rateLimitHeaders }`.
3. Deltas are batched through `createRafBatcher` (flush at 192 chars or 80 ms) to limit re-renders; placeholder assistant message is `streaming:true`.
4. On completion: metrics (`ttftMs`, `totalMs`, tokens), quota snapshot, title from first user message (≤50 chars), fire-and-forget chat-log persist into project DB.
5. **Abort** via `AbortController` (removes placeholder); `stopStreaming` also aborts local Gemma generation. Errors → `StreamHttpError` (carries rate-limit headers) or `formatUserFacingError` toast.

### 5.2 Multi-model tiled comparison

Triggered when cloud provider + `comparisonEnabled` + ≥2 deduped `comparisonModelIds` (cap 4). `Promise.all` fans out one `streamChatForConfig` per model with **separate** AbortController + RAF batcher; each tile writes to `message.comparisonResponses[i]`. Per-tile failures are recorded inline (don't fail the batch); rate-limit headers merged across tiles. Local providers are excluded by design.

### 5.3 Retry / Edit

- `regenerateLastResponse` pops the last assistant reply and re-runs the whole pipeline with the same user prompt + current workspace assist.
- `beginEditUserMessage` truncates the thread at that user message and reloads text+attachments into the composer.

### 5.4 Cloud provider clients (`src/lib/openrouter.ts`, `src/lib/aiStream.ts`)

| Provider | Endpoint / mechanism |
|---|---|
| openrouter | `https://openrouter.ai/api/v1/chat/completions`, SSE; headers `HTTP-Referer` + `X-Title`; `stream_options.include_usage`; `temperature:1` for o-series/gpt-5/deepseek-r1 |
| openai_direct | same SSE engine → `https://api.openai.com/v1/chat/completions` |
| openai_compatible | same engine → `resolveChatCompletionsUrl(baseUrl)` (Ollama/LM Studio/vLLM) |
| anthropic | `streamAnthropicChat`: POST `/v1/messages`, `x-api-key`, `anthropic-version: 2023-06-01`, `max_tokens: 8192`, SSE `content_block_delta` |
| google | `streamGeminiChat`: official SDK `chat.sendMessageStream`, `usageMetadata` → prompt/candidates token counts |
| webgpu_gemma / local_gguf | intercepted in ChatContext before reaching `streamChatForConfig` |

### 5.5 Local inference — two runtimes

**WebGPU Qwen/Gemma path** (`src/lib/gemmaWebGpu/`): single model `openbentt/local-qwen-0.5b` (HF `onnx-community/Qwen2.5-0.5B-Instruct`, 32k ctx, ~380 MB GPU / 450 MB WASM RAM). `pickLocalLlmPlan` decides WebGPU vs WASM by `navigator.gpu` caps (`shader-f16`, `maxBufferSize`), `navigator.deviceMemory ×0.6`, and auto-downgrades model/dtype (reasons: `gpu-buffer`/`cpu-ram`/`no-webgpu`) with toasts. Load uses a **dtype cascade** (WebGPU q4f16→q4→q8; WASM fp16→q8) and serializes generation through `generateSerial` to avoid ORT WASM stack corruption. ChatML/thinking/`<|tool_call|>` tokens stripped; token budgets per profile (eco ≤128, balanced ≤256, perf ≤384), prompt capped within 8192 ONNX context. Cache flag `openbentt-local-model-cached-v1`, consent `openbentt-local-weights-consent-v1`.

**GGUF path** (`src/lib/localGguf/` + `electron/localGgufService.mjs`): model id `openbentt/gguf:<uuid>`. Renderer calls `ensureServer({registryId})` over IPC; main spawns `llama-server -m <gguf> --host 127.0.0.1 --port <free> -c 8192`, polls `/v1/models` (120 s), returns `{baseUrl, chatModelId}`; streaming reuses the OpenRouter SSE engine against `http://127.0.0.1:<port>/v1/chat/completions`. Download guardrails: ≤16 B params, ≤8/14 GiB files, rejects F16/F32 of ≥3B, disk headroom `size×1.15 + 512 MB`, resumable downloads via `Range` headers.

### 5.6 Model manager & smart routing (`src/lib/modelManager`, `src/lib/modelRouting`)

`buildModelManagerSnapshot` probes in parallel: GGUF registry, llama binary resolution, disk free, and **Ollama probe** (`http://127.0.0.1:11434/v1/models`, 4 s timeout). Catalog builds descriptors for webgpu models, gguf files, Ollama models, and the MiniLM embedding model. `routeModelForTask` scores candidates by tier-delta ×10 + capability/backend bonuses; embedding always → MiniLM; `chat_general` short-circuits to cloud when allowed; falls back to tiny Qwen; errors have typed codes (`missing_model | offline_blocked | no_candidates | backend_unavailable`).

### 5.7 Rate limiting / quota (`src/lib/providerRateLimits.ts`)

`collectRateLimitHeaders` scrapes any header matching `ratelimit|rate-limit|retry-after|anthropic-ratelimit|openrouter`; `parseRequestWindow` understands OpenAI-style (`x-ratelimit-remaining-requests/limit-requests`) and generic day/daily variants; rendered by `ProviderQuotaMeter` in the chat header. OpenRouter credit check via `GET /api/v1/key`.

### 5.8 Rendering features

ReactMarkdown + GFM, fenced ` ```openbentt-chart `/` ```cogerphere-chart ` → **Recharts** bar/line/area (validated by `chartSpec.ts`), attachments (image ≤4 MB, audio ≤12 MB, video **first-frame** extraction ≤1024 px, PDF text-extraction), in-message search with `<mark>` highlights (skips code blocks), export `.md` (`buildChatMarkdownExport`) and per-message raster PDF (`html2canvas@2` + jsPDF), prompt snippets (`openbentt-prompt-snippets-v1`, 4 built-ins + custom), `ContextMeter` ring gauge (~4 chars/token, 90% warning), message virtualization above 40 messages.

### 5.9 Storage migration (`src/lib/storageMigrate.ts`)

`cogerphere-chats` → `openbentt-chats`, `-current-chat-id`, `-api-config`, `-experiment-presets`, `-sidebar-collapsed` → `openbentt-sidebar-icon-v2`; runs in `main.tsx` before first render (also force-unregisters stale service workers).

---

## 6. Research Subsystem (deep dive)

### 6.1 Project model & persistence

`ResearchProjectData` = `{ id, title, draftTex, bibliography, bibEntries, papers[], chunks[], chunkEmbeddings?, researchMemory, folders[], projectFiles[], revisionSuggestions, modelAttributions, abstractVariants, … }`.
- **Web:** `openbentt-research-projects-index` (list + activeId), `openbentt-research-project-<id>` (JSON; embeddings stripped), `openbentt-research-embeddings-<id>`.
- **Desktop:** SQLite `research.db` (schema v6) under `userData/research-projects/` + per-project `papers/`, `assets/`, `exports/` directories + `research.db.bak` (WAL checkpoint + file copy every 10 saves / 5 s debounce; auto-restore on open failure).
- Limits: 500 papers, 120 indexed chunks, 2 MB draft, 500 KB bibliography, 4.5 MB localStorage cap; soft warnings at 80/100/400k.

### 6.2 RAG / embeddings pipeline

- **Model:** `Xenova/all-MiniLM-L6-v2`, 384-dim, q8, mean pooling, L2-normalized cosine (`embedCore.mjs`, shared across renderer/Web Worker/Electron worker threads).
- **Chunking:** 480 chars, 80 overlap (`corpusChunksCore.mjs`); paper chunk ids `<paperId>-<i>`, draft chunks `<projectId>:draft-<i>`; LaTeX commands stripped for draft chunks.
- **Indexes:** TF-IDF (`corpusIndex.ts`, `idf = log((N+1)/(n+1))+1`, excludes draft) + semantic embeddings. **Hybrid retrieval V2**: RRF (k=48), weights lexical .45 / semantic .55, min fused .008, dedupe max 24.
- **Execution:** Desktop → job queue (`embed`/`rechunk` jobs, worker_threads, incremental upsert streaming, resumable checkpoints, 3 retries); Web → Web Worker + localStorage checkpoint (`openbentt-index-checkpoint-`), fingerprints for incremental indexing.
- **Semantic engine:** claim/evidence/negation extraction with STOP list, CLAIM/METHOD patterns, negation pairs.

### 6.3 Job queue (Electron, `electron/researchJobQueue.mjs`)

Per-project in-memory queues, one running job per project, serialized drain, dedup (only one pending `embed` per project), `AbortController` cancel, persistence to `research_jobs` table, resume-on-restart re-queues `running`/`pending` and only embeds missing chunk IDs (`listEmbeddedChunkIds`).

### 6.4 Research proxy (`server/research-proxy.mjs`, port 8787)

Zero-dependency HTTP. `POST /research` with `{query, urls≤2, deepResearch, approvedDomains}`. Aggregates: Wikipedia (opensearch + REST summary), Semantic Scholar (limit 2), arXiv (limit 2), **Jina reader** (`https://r.jina.ai/` for up-to-2 user URLs), **Brave search** (server-side key), plus optional deep-research recursion over ≤5 Brave URLs restricted to `approvedDomains`. Truncates to 14,000 chars, 16 sources. TLS optional via `CERT_PATH`/`KEY_PATH`. Depth budgets (quick/standard/deep): 6k/10k/16k chars, 1/2/4 URL fetches, 3/5/8 Brave results.

### 6.5 Citations

`citationTools` (cite-key lint), `crossrefClient` (DOI validation `10.\d{4,9}/…`, type mapping → bibtex), `cslEngine` (citation-js `plugin-bibtex` + `plugin-csl`; CSL styles apa/mla/ieee/chicago/acm/nature/bibtex), `citationGraphSync` (S2 graph nodes → `@misc` with `s2…` keys), `bibliographyCompile` (detects `\bibliography{`/`\addbibresource{`).

### 6.6 Zotero (`electron/zoteroService.mjs` + `src/lib/zotero/`)

- **Local detection** scans `~/.zotero`, `~/Zotero`, `%APPDATA%\Zotero` for `profiles.ini` (detection only — never opens `zotero.sqlite`).
- **Web API v3 sync** (`api.zotero.org`, `Zotero-API-Key`/`Zotero-API-Version: 3`): paginated collections (100), tags (1000), items (100, driven by `Total-Results`); captures `Last-Modified-Version`; caches to `userData/zotero/library.json` + `config.json`. Keys stored via `safeStorage` (`zoteroSecretStore`).
- **Better BibTeX mode**: reads a `.bib` export (no key needed), detects `citationKey`s, merge with conflict detection/resolution (`betterBibTeX.ts`), optional `fs.watch` (400 ms debounce) for live resync.
- Retrieval: `recommendCitations` (limit 8), `literatureReviewContext`, `searchAnnotations` (TF-cosine, limit 20). Default citekeys `${slug}${year}_${key.slice(0,6)}`.

### 6.7 Writing tooling

Autosave (800 ms debounce), draft history (depth 100, desktop SQLite `draft_history`), snapshots (project-level, restore), revisions (`parseReviewerComments` max 40 blocks, `% [REVIEW …]` injection), abstract/keywords generation, venue limits (IEEE 250 / ACM 250 / Nature 200 / arXiv 350 words), cross-paper synthesis (top-8 themes from ≥2 papers), thread-to-LaTeX (`parseOutline`/`outlineToLatexSkeleton`), writing-assist persona prompt.

### 6.8 Templates

`public/templates/catalog.json` — 12 packs (acm-sigconf, arxiv-preprint, beamer-slides, book-thesis, grant-proposal, ieee-conference, lit-review-outline, minimal-article, nature-letter, research-article, review-response, two-column-article); 5 featured. E2E asserts ≥100 catalog entries and minimal-article pack integrity.

---

## 7. Notebook / LaTeX / PDF Subsystem (deep dive)

### 7.1 Compile backends (`CompileBackend = auto|wasm|local|remote`)

Engine order for auto mode: full-TeX documents (`FULL_TEX_SIGNALS`: IEEEtran, tikz, algorithmic, cleveref, babel, fancyhdr, …) → `[local, wasm, http]`; otherwise `[wasm, http]`.
- **WASM:** `texlyre-busytex` `BusyTexRunner`/`PdfLatex` from `{BASE_URL}/core/busytex`; graceful failure hints (BusyTeX cannot load IEEEtran/TikZ).
- **Local:** Electron IPC `compileProjectLatex` → `pdflatex -interaction=nonstopmode -halt-on-error`, 1–3 passes + optional `bibtex` (requires `pdflatex` on PATH).
- **Remote HTTP:** `server/latex-compile.mjs` (:8788, CORS `*`, 64 MB maxBuffer) or Vercel edge `api/latex-compile.ts` (proxies to `LATEX_UPSTREAM_URL`, 503 hint when unset). Vite proxies `/api/latex-compile` in dev/preview.
- Compile bundle carries `{mainTex, mainPath, files[], bibtex}`; assets resolved via project store; hashed (SHA-256 over mainTex+path+bibtex+files) and **cached** — desktop files `userData/research/compile-cache/<projectId>/<hash>.pdf` or IndexedDB `openbentt-compile-cache`.
- **Autofix pipeline** (`notebookLatexAutofix.ts`): strip `:contentReference[oaicite:…]`, unicode sanitize, `\PassOptionsToPackage{draft}` graphicx, escape ampersands (preserving `__CPH_AMP_ESC__`), lmodern for WASM, `\includegraphics` → framed placeholders. AI-driven fix via `buildNotebookLatexFixPrompt` (≤48k source chars). Error UI parses 1-based `l.\d+` lines, narrows to `LOG:` section, produces typed `LatexErrorFixKind`.

### 7.2 PDF pipeline

`pdfjs-dist` (worker `pdf.worker.min.mjs`), canvas rendering with active-render cancellation, preview cap 48 pages, text layout with `LINE_Y_EPS=4` row clustering, page markers `--- PDF PAGE i / n ---`, extraction caps (chat 96k chars/64 pages; notebook 220k/100). Annotations (highlight/note/redaction) with normalized rects; search within document. For plain/text sources, jsPDF generates the PDF client-side (44/14/22 margins).

### 7.3 Editor

`@uiw/react-codemirror` with custom dark theme (VS Code Dark+ palette, hidden gutters, error-line decoration) and LaTeX/BibTeX language support (`StreamLanguage.define(stex)` + custom bib parser); JetBrains Mono.

### 7.4 Notebook "cables" UX

`NotebookStudioContext` tracks connection drag state; `NotebookConnectionCables` draws cubic Bezier paths (`cp = max(48, dx×0.45)`, violet `#8b5cf6`) between anchors (chat↔tex tab, chat↔PDF preview); snap radius 50 px; caps 50 tex-file keys / 10 PDF papers; per-file chats titled `📄 <label>`; floating chat panel 300×280–920×900.

### 7.5 Chat context injection

`buildNotebookLiveSnapshot` (source/PDF/tab/review summary, truncated at 96k) + knowledge + corpus evidence → `## Current workspace (this turn)` system prompt. LaTeX blocks can be applied back into the editor ("Apply reply → Compile → Preview" loop); `requestNotebookLatexInsert` allows the AI to insert fenced LaTeX with optional autocompile.

---

## 8. Electron Desktop Shell (deep dive)

### 8.1 Security model

`contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`; **5 contextBridge surfaces** (count CI-enforced by `check-electron-security.mjs`): `openbenttDesktop`, `openbenttLocalGguf`, `openbenttSecrets`, `openbenttZotero`, `openbenttResearch`. Custom privileged `app://` scheme (secure, standard, fetch, stream, CORS) serving `dist/` with SPA fallback; every pathname passes `resolveUnderDistRoot` (blocks `..` traversal).

### 8.2 IPC channel inventory (main)

- **desktop:**`windowMinimize/ToggleMaximize/Close/IsMaximized`, `editRole` (whitelisted undo/redo/cut/copy/paste/selectAll), `reload`, `toggleDevTools`, `quit`, `showAbout`, `openExternal` (regex-gated `^https?://`), `getAppVersion`, `checkForUpdates`, `downloadUpdate`, `installUpdate`; events `desktop:menuNavigate`, `desktop:updateStatus`.
- **localGguf:**`listRegistry`, `diskFree`, `resolveBinary`, `searchHf`, `listGgufFiles`, `addFromHf` (download+resume), `deleteEntry`, `ensureServer`, `stopServer`, `whoami`; event `localGguf:downloadProgress`.
- **hfSecret / secretVault / zoteroSecret:** `status/set/clear/load`; vault key allowlist `{provider_api_key, brave_search_api_key}`.
- **zotero:**`detectLocal`, `status`, `setCredentials`, `clearCredentials`, `setBbtExportPath`, `sync`, `getLibrarySnapshot`, `watchBetterBibTeX`, `stopWatch`; events `zotero:syncProgress`, `zotero:libraryChanged`.
- **research:** ~40 handlers — project CRUD, paper PDF store (base64 ≤48 MB; path-copy variant `storePaperPdfPath` is main-only), assets, `compileProjectLatex`, compile-artifact cache, embeddings, jobs, snapshots, draft history, chat logs, `exportFinetuneCorpus`; events `research:jobProgress`, `research:beforeQuit`.

### 8.3 Secrets (safeStorage)

All under `<userData>/.secrets/` (dir `0o700`, files `0o600`): `hf_token.{blob|secret}`, `provider-api-key.{blob|secret}`, `brave-search-api-key.*`, `zotero_api_key.*`. Encrypted `.blob` via `safeStorage.encryptString` with plaintext `.secret` fallback + console warning. Never written to localStorage on desktop.

### 8.4 llama-server lifecycle

Binary resolution: `OPENBENTT_LLAMA_SERVER_PATH` → settings → bundled `resources/llama/<platform>/` → PATH. Single global server, health-check reuse, ephemeral free port, SIGTERM on quit (`cleanupLocalGgufOnQuit`).

### 8.5 GPU safe-mode & crash recovery

`gpuSafeMode.mjs` detects: env override, `LIBGL_ALWAYS_SOFTWARE`/llvmpipe, missing `/dev/dri`, NVIDIA present but no proprietary driver (`/proc/driver/nvidia/version`, `/dev/nvidia0`, PCI 0x10de scan), NVIDIA-on-Wayland. Safe mode → `disableHardwareAcceleration` + `--disable-gpu*` + software rasterizer + native Wayland (not XWayland). Non-safe mode forces `--ozone-platform=x11` on Wayland, `--enable-unsafe-webgpu`, Linux `--ignore-gpu-blocklist`. Two GPU crashes in a 20 s window → one-shot relaunch with `OPENBENTT_DISABLE_GPU=1` (`relaunchInGpuSafeMode`). `launch.mjs` pre-injects flags before main runs.

### 8.6 Updates & menu

`electron-updater` (autoDownload=false, autoInstallOnAppQuit=true), 30 s background check, feed = GitHub release `latest*.yml` from publish config. Native menu: File (New Chat `CmdOrCtrl+N` → `/chat`, Projects `CmdOrCtrl+Shift+P`, Notebook), Edit/View/Help.

---

## 9. Persistence Summary

| Data | Web | Desktop |
|---|---|---|
| Chats / config | localStorage `openbentt-*` | same + secrets in safeStorage vault |
| Research projects | localStorage + embeddings key + IndexedDB compile cache | SQLite `research.db` (WAL) + filesystem dirs + compile-cache files |
| Index checkpoints | localStorage `openbentt-index-checkpoint-` | SQLite `research_jobs` (resumable) |
| Zotero | localStorage web creds (`openbentt-zotero-web-creds`) | `userData/zotero/{library,config}.json` + safeStorage key |
| GGUF | n/a | `userData/gguf-models/` registry.json + files/ |
| LaTeX WASM assets | served from `public/core/busytex` | bundled in dist |

---

## 10. Build / Packaging / CI-CD / Deploy

- **Web build:** `npm run build` → `dist/`; SEO injected at build time; `VITE_PUBLIC_SITE_URL` for absolute canonical/OG.
- **Electron:** electron-builder `asar:true`, `npmRebuild:false`, `asarUnpack: onnxruntime-node`; targets AppImage+deb (Linux, "Office"), dmg+zip (macOS), nsis+zip (Windows); `extraResources` bundles llama.cpp per platform; publish to GitHub Releases (`generateUpdatesFilesForAllChannels`).
- **CI (`ci.yml`):** Node 22, `npm ci`, lint (incl. electron security + pack guards), Vitest + Electron node tests, `vite build`, Playwright Chromium e2e.
- **Release (`release.yml`):** tag `v*` → 3 parallel OS jobs (`electron:pack:{linux,win,mac}`, macOS unsigned), zip web dist, `verify-release-version.mjs` ensures tag==package.json==lockfile, `softprops/action-gh-release` publishes all installers + `latest*.yml` with release notes from `docs/releases/<tag>.md`.
- **Docker:** two-stage `node:22-bookworm-slim`; builder downloads BusyTeX (~175 MB) unless cached; runtime = nginx :8080 + research proxy :8787 (via `docker/entrypoint.sh`); nginx: SPA `try_files`, gzip, immutable hashed-asset caching, `no-store` index, security headers, `location /api/research` → proxy. **No CSP** (deliberate — WASM/dynamic imports), documented as the top hardening gap.
- **Vercel:** static SPA + optional edge `api/latex-compile.ts` + Vercel Analytics component (opt-in).

---

## 11. Testing Strategy

| Suite | Coverage |
|---|---|
| Vitest unit/integration (~90 test files) | openrouter, chartSpec, latex fixes, citation tools, projectStore, storageMigrate, webGpuCaps, guardrails, retrieval, submission rules, model routing, Zotero mocks, PDF text, stress tests |
| Node `--test` (Electron main) | researchDb (schema v6, .bak corruption recovery, legacy import), vector store Float32 round-trip, job queue rechunk/cancel, chunkWorker, compileArtifactStore, gpuSafeMode matrix, llama binary resolution |
| Playwright e2e | research-workspace (branding + route gating), notebook-studio-beta (template catalog ≥100, pack integrity, hub routes) |
| Smoke | `electron/smokeTest.mjs` — launch Electron software-rendered, wait 12 s, assert alive |
| `npm run verify:release` | lint + tests + build + e2e |

Documented gaps (TEST_COVERAGE.md): no live MiniLM build test, no packaged-app `_electron` e2e, no real Zotero API/safeStorage round-trip tests, SQLite `.bak` restore can still throw on severely corrupted WAL.

---

## 12. Security Posture

- Renderer is **untrusted**; main process holds secrets + SQLite (per `docs/THREAT_MODEL.md`).
- BrowserWindow hardened (contextIsolation/sandbox/no-node); IPC validated (ID regex `^[a-zA-Z0-9_-]{1,128}$`, 48 MB base64 PDF cap, path allowlists, llama-binary allowlist); main-only sensitive channels.
- Secrets via `safeStorage`; never in localStorage on desktop; `openExternal` regex-gated; single-instance lock; GPU crash relaunch once.
- **Prompt-injection defense**: PDF/extracted text wrapped in `[UNTRUSTED_DOCUMENT_*]` boundaries; `documentPromptGuard`.
- **Egress is user-driven only** (BYOK providers, HF Hub, research proxy, GitHub updates). No telemetry by default; Vercel Analytics opt-in.
- **Key gaps:** no CSP anywhere; unsigned macOS/Windows installers (SmartScreen/Gatekeeper warnings); Brave search key is client-side (server proxy needed for privacy); `chat_links` table defined but unused; Zotero "local" mode is detection-only.

---

## 13. Notable Findings & Observations

1. **Impressive engineering density** — ~170 `src/lib` modules, a real RAG pipeline, two local inference runtimes, a full LaTeX/PDF studio, and a defensible Electron security model, all in one repo with 90+ test files and full CI/release automation.
2. **Web vs desktop asymmetry is deliberate and well-managed** — the renderer abstracts storage behind `window.openbentt*` bridges; web degrades gracefully (localStorage, Web Worker embeddings, WASM compile) while desktop adds SQLite/worker-threads/native llama-server.
3. **Streaming contract is uniform** (`{text, metrics, rateLimitHeaders}`) across 7 providers + 2 local runtimes, enabling the tiled comparison feature cleanly.
4. **Version pinning & release hygiene** are strong (tag↔version↔lockfile assertion, template catalog targeting, `latest*.yml` presence warnings).
5. **Top improvement candidates** (if continued development): add CSP, ship signed/notarized installers, implement a real ANN vector index (embeddings are BLOBs queried client-side), expand packaged-app e2e, and expose `chat_links`/deep-linking.

---

*Document generated from repository analysis; aligns with Openbentt sources under `src/`, `electron/`, `server/`, `docs/` (v2.2.5).*