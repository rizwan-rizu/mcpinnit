# mcpinnit

> Init your MCP server in 60 seconds.

**mcpinnit** is a scaffolding CLI that generates production-ready [MCP (Model Context Protocol)](https://modelcontextprotocol.io) servers from a 5-question interactive prompt — no boilerplate to write, no docs to read first.

```bash
npx mcpinnit
```

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

| Template | Description |
|----------|-------------|
| `fetch` | Fetch data from a URL |
| `search` | Search and return results |
| `crud` | Create, read, update, delete |
| `notify` | Send notifications |
| `transform` | Transform/process data |
| `blank` | Empty template to fill in |

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

## Roadmap

- **v0.1** ✅ TypeScript scaffold + test runner
- **v0.2** Python support, `add-tool`, `lint`, deploy templates, Inspector UI
- **v0.3** Registry at [mcpinnit.com](https://mcpinnit.com) — publish & discover MCP servers

## License

MIT
