# mcpinnit

> Init your MCP server in 60 seconds.

**mcpinnit** is a scaffolding CLI for building **custom MCP (Model Context Protocol) servers** — for your own product, internal API, or any system that doesn't have an MCP server yet.

```bash
npx mcpinnit
```

MCP lets AI assistants like Claude, Cursor, and others call your tools directly. mcpinnit handles all the infrastructure so you can focus on writing your actual tool logic.

> **Not what you need?** If you're looking to connect Claude to GitHub, Stripe, Slack, Notion etc. — those platforms already publish official MCP servers. mcpinnit is for when you're building your own.

## What it does

1. **Scaffold** — `npx mcpinnit` generates a complete, working MCP server with tool definitions, Zod schemas, tests, Dockerfile, and README
2. **Test** — `npx mcpinnit test` lets you test tools locally without opening Claude Desktop
3. **Connect** — `npx mcpinnit install-claude` writes your Claude Desktop config automatically

## Quick Start

```bash
npx mcpinnit
```

Answer 5 questions, get a production-ready MCP server:

```
? What is your server name? › weather-tools
? Choose transport layer: › stdio (recommended)
? Choose language: › TypeScript
? Add authentication? › None
? Which tool templates to include? › fetch, search
```

Then:

```bash
cd weather-tools
npm run build
npx mcpinnit test --tool fetch --input '{"url": "https://example.com"}'
```

## Commands

| Command | Description |
|---------|-------------|
| `npx mcpinnit` | Scaffold a new MCP server interactively |
| `npx mcpinnit test --tool <name> --input '<json>'` | Test a specific tool |
| `npx mcpinnit test --all` | Test all tools |
| `npx mcpinnit test --watch` | Watch mode |
| `npx mcpinnit install-claude` | Write Claude Desktop config |

## Tool Templates

These are **pattern starters** — not finished integrations. Each gives you a working skeleton with the right Zod schema shape and handler structure. You fill in your own logic.

| Template | Pattern | Example use case |
|----------|---------|-----------------|
| `fetch` | HTTP request/response | Call your internal REST API |
| `search` | Query and return a list | Search your product's database |
| `crud` | Create, read, update, delete | Manage resources in your system |
| `notify` | Trigger a notification | Send alerts via your own service |
| `transform` | Input → processed output | Run a calculation or data pipeline |
| `blank` | Empty starting point | Anything that doesn't fit above |

## Generated Project Structure

```
weather-tools/
├── src/
│   ├── index.ts          ← entry point
│   ├── server.ts         ← MCP server + tool registration
│   ├── tools/
│   │   ├── fetch.ts
│   │   └── index.ts
│   └── types.ts
├── tests/
│   ├── fetch.test.ts
│   └── server.test.ts
├── .mcp/
│   └── manifest.json     ← discovery manifest
├── .env.example
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

## Tech Stack

- **CLI:** commander, @inquirer/prompts, chalk, ora, handlebars
- **Generated servers:** @modelcontextprotocol/sdk, zod, dotenv, vitest

---

## Local Development

### Prerequisites

- Node.js >= 18
- npm

### Setup

```bash
git clone https://github.com/rizwan-rizu/mcpinnit.git
cd mcpinnit
npm install
```

### Build

```bash
npm run build        # compile TypeScript → dist/
npm run lint         # type-check only (no emit)
```

### Run the CLI locally

```bash
# Option A — run directly via tsx (no build needed)
npm run dev

# Option B — run the compiled output
node dist/cli/index.js

# Option C — link globally so `mcpinnit` works anywhere
npm link
mcpinnit --help
```

### End-to-end test

The best way to verify everything works is to scaffold a server and test a tool:

```bash
# 1. Scaffold a test server
node dist/cli/index.js
#    → answer prompts: name=my-test-server, stdio, TypeScript, None, fetch

# 2. Build the generated server
cd my-test-server
npm run build

# 3. Test a tool
node ../dist/cli/index.js test --tool fetch --input '{"url": "https://example.com"}'

# 4. Test all tools
node ../dist/cli/index.js test --all

# 5. Generate Claude Desktop config (optional)
node ../dist/cli/index.js install-claude
```

Expected output from step 3:

```
✅ Tool: fetch
  ⏱  Latency: 312ms
  📤 Input:  {"url":"https://example.com"}
  📥 Output: {"status":200,"statusText":"OK",...}
  ✅ Schema valid
  ✅ Response within size limit (4.2kb / 25kb max)
```

### Run unit tests

```bash
npm test             # run vitest once
npm run test:watch   # watch mode
```

### Project structure

```
mcpinnit/
├── src/
│   ├── cli/
│   │   ├── index.ts          ← commander entry point + subcommands
│   │   ├── scaffold.ts       ← 5-question interactive flow
│   │   └── install-claude.ts ← Claude Desktop config writer
│   ├── generator/
│   │   └── typescript/
│   │       ├── index.ts      ← orchestrates file generation
│   │       └── templates/    ← Handlebars .hbs templates
│   │           └── tools/    ← one template per tool type
│   ├── tester/
│   │   ├── runner.ts         ← spawns MCP server, sends tool calls via stdio
│   │   ├── validator.ts      ← schema + size + latency checks
│   │   └── reporter.ts       ← formatted terminal output
│   ├── utils/
│   │   ├── logger.ts         ← chalk + ora helpers
│   │   ├── files.ts          ← fs-extra + Handlebars render
│   │   └── detect.ts         ← detect MCP project root / language
│   └── types.ts              ← shared TypeScript interfaces
├── package.json
└── tsconfig.json
```

### Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Keep each feature in its own commit
4. Open a pull request against `main`

## Roadmap

- **v0.1** ✅ TypeScript scaffold + test runner
- **v0.2** Python support, `add-tool`, `lint`, deploy templates, Inspector UI
- **v0.3** Registry at [mcpinnit.com](https://mcpinnit.com) — publish & discover MCP servers

## License

MIT
