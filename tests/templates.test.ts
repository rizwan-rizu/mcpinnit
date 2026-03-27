import { describe, it, expect } from 'vitest';
import { renderTemplate } from '../src/utils/files.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES = join(__dirname, '..', 'src', 'generator', 'typescript', 'templates');

const baseCtx = {
  serverName: 'test-server',
  serverNamePascal: 'TestServer',
  serverDescription: 'A test server',
  transport: 'stdio',
  transportStdio: true,
  transportHttp: false,
  auth: 'none',
  authNone: true,
  authApiKey: false,
  authOAuth: false,
  tools: [
    { name: 'fetch', namePascal: 'Fetch', isLast: true },
  ],
  version: '1.0.0',
  year: 2026,
};

describe('Handlebars templates render without errors', () => {
  const rootTemplates = [
    'package.json.hbs',
    'tsconfig.json.hbs',
    'env.example.hbs',
    'gitignore.hbs',
    'dockerfile.hbs',
    'docker-compose.yml.hbs',
    'manifest.json.hbs',
    'index.ts.hbs',
    'server.ts.hbs',
    'types.ts.hbs',
    'tools-index.ts.hbs',
    'readme.md.hbs',
  ];

  for (const tpl of rootTemplates) {
    it(`renders ${tpl}`, async () => {
      const output = await renderTemplate(join(TEMPLATES, tpl), baseCtx);
      expect(output).toBeTruthy();
      expect(typeof output).toBe('string');
    });
  }

  const toolTemplates = ['fetch', 'search', 'crud', 'notify', 'transform', 'blank'];

  for (const tool of toolTemplates) {
    it(`renders tools/${tool}.ts.hbs`, async () => {
      const ctx = { ...baseCtx, toolName: tool, toolNamePascal: tool.charAt(0).toUpperCase() + tool.slice(1) };
      const output = await renderTemplate(join(TEMPLATES, 'tools', `${tool}.ts.hbs`), ctx);
      expect(output).toBeTruthy();
    });
  }

  it('renders server.ts with multiple tools', async () => {
    const ctx = {
      ...baseCtx,
      tools: [
        { name: 'fetch', namePascal: 'Fetch', isLast: false },
        { name: 'search', namePascal: 'Search', isLast: true },
      ],
    };
    const output = await renderTemplate(join(TEMPLATES, 'server.ts.hbs'), ctx);
    expect(output).toContain('FetchTool');
    expect(output).toContain('SearchTool');
  });

  it('renders index.ts.hbs with http transport', async () => {
    const ctx = { ...baseCtx, transportStdio: false, transportHttp: true };
    const output = await renderTemplate(join(TEMPLATES, 'index.ts.hbs'), ctx);
    expect(output).toContain('StreamableHTTPServerTransport');
  });

  it('renders env.example.hbs with api-key auth', async () => {
    const ctx = { ...baseCtx, authNone: false, authApiKey: true };
    const output = await renderTemplate(join(TEMPLATES, 'env.example.hbs'), ctx);
    expect(output).toContain('API_KEY');
  });

  it('renders manifest.json.hbs and produces valid JSON', async () => {
    const output = await renderTemplate(join(TEMPLATES, 'manifest.json.hbs'), baseCtx);
    expect(() => JSON.parse(output)).not.toThrow();
    const parsed = JSON.parse(output) as { name: string; transport: string };
    expect(parsed.name).toBe('test-server');
    expect(parsed.transport).toBe('stdio');
  });
});
