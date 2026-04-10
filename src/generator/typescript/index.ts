import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import fs from 'fs-extra';
import { writeRenderedTemplate, ensureDir } from '../../utils/files.js';
import { logger } from '../../utils/logger.js';
import type { ScaffoldOptions } from '../../types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES = join(__dirname, 'templates');

function toPascalCase(str: string): string {
  return str.replace(/(^|-)([a-z])/g, (_, __, c: string) => c.toUpperCase());
}

export async function generateTypeScriptProject(opts: ScaffoldOptions): Promise<void> {
  const outDir = join(process.cwd(), opts.serverName);

  if (await fs.pathExists(outDir)) {
    logger.error(`Directory "${opts.serverName}" already exists.`);
    process.exit(1);
  }

  const spinner = logger.spinner(`Generating ${opts.serverName}...`);
  spinner.start();

  const ctx: Record<string, unknown> = {
    serverName: opts.serverName,
    serverNamePascal: toPascalCase(opts.serverName),
    serverDescription: opts.serverDescription,
    transport: opts.transport,
    auth: opts.auth,
    authNone: opts.auth === 'none',
    authApiKey: opts.auth === 'api-key',
    authOAuth: opts.auth === 'oauth2',
    transportStdio: opts.transport === 'stdio',
    transportHttp: opts.transport === 'http',
    tools: opts.tools.map((t) => ({
      name: t,
      namePascal: toPascalCase(t),
      isLast: false,
    })),
    apiBaseUrl: opts.apiBaseUrl ?? '',
    hasApiBaseUrl: !!opts.apiBaseUrl,
    defaultHttpMethod: opts.defaultHttpMethod ?? 'GET',
    envVars: (opts.envVars ?? []).map((v) => ({ name: v })),
    hasEnvVars: (opts.envVars ?? []).length > 0,
    version: '1.0.0',
    year: new Date().getFullYear(),
  };

  // Mark last tool for template conditionals
  const tools = ctx.tools as Array<{ name: string; namePascal: string; isLast: boolean }>;
  if (tools.length > 0) tools[tools.length - 1].isLast = true;

  // Root files
  await writeRenderedTemplate(join(TEMPLATES, 'package.json.hbs'), join(outDir, 'package.json'), ctx);
  await writeRenderedTemplate(join(TEMPLATES, 'tsconfig.json.hbs'), join(outDir, 'tsconfig.json'), ctx);
  await writeRenderedTemplate(join(TEMPLATES, 'readme.md.hbs'), join(outDir, 'README.md'), ctx);
  await writeRenderedTemplate(join(TEMPLATES, 'env.example.hbs'), join(outDir, '.env.example'), ctx);
  await writeRenderedTemplate(join(TEMPLATES, 'gitignore.hbs'), join(outDir, '.gitignore'), ctx);
  await writeRenderedTemplate(join(TEMPLATES, 'dockerfile.hbs'), join(outDir, 'Dockerfile'), ctx);
  await writeRenderedTemplate(join(TEMPLATES, 'docker-compose.yml.hbs'), join(outDir, 'docker-compose.yml'), ctx);

  // Manifest
  await writeRenderedTemplate(join(TEMPLATES, 'manifest.json.hbs'), join(outDir, '.mcp', 'manifest.json'), ctx);

  // Source files
  await writeRenderedTemplate(join(TEMPLATES, 'index.ts.hbs'), join(outDir, 'src', 'index.ts'), ctx);
  await writeRenderedTemplate(join(TEMPLATES, 'server.ts.hbs'), join(outDir, 'src', 'server.ts'), ctx);
  await writeRenderedTemplate(join(TEMPLATES, 'types.ts.hbs'), join(outDir, 'src', 'types.ts'), ctx);

  // Auth
  if (opts.auth === 'api-key') {
    await writeRenderedTemplate(join(TEMPLATES, 'auth-apikey.ts.hbs'), join(outDir, 'src', 'auth', 'apikey.ts'), ctx);
  }
  if (opts.auth === 'oauth2') {
    await writeRenderedTemplate(join(TEMPLATES, 'auth-oauth.ts.hbs'), join(outDir, 'src', 'auth', 'oauth.ts'), ctx);
  }

  // Tool files
  await ensureDir(join(outDir, 'src', 'tools'));
  await ensureDir(join(outDir, 'tests'));

  for (const tool of opts.tools) {
    const toolCtx = { ...ctx, toolName: tool, toolNamePascal: toPascalCase(tool) };
    const toolTemplate = join(TEMPLATES, 'tools', `${tool}.ts.hbs`);
    await writeRenderedTemplate(toolTemplate, join(outDir, 'src', 'tools', `${tool}.ts`), toolCtx);
    await writeRenderedTemplate(
      join(TEMPLATES, 'tool.test.ts.hbs'),
      join(outDir, 'tests', `${tool}.test.ts`),
      toolCtx
    );
  }

  // Barrel export for tools
  await writeRenderedTemplate(join(TEMPLATES, 'tools-index.ts.hbs'), join(outDir, 'src', 'tools', 'index.ts'), ctx);

  // Server test
  await writeRenderedTemplate(join(TEMPLATES, 'server.test.ts.hbs'), join(outDir, 'tests', 'server.test.ts'), ctx);

  spinner.succeed(`Generated ${opts.serverName}/`);

  // Install dependencies
  const installSpinner = logger.spinner('Installing dependencies...');
  installSpinner.start();
  try {
    execSync('npm install', { cwd: outDir, stdio: 'pipe' });
    installSpinner.succeed('Dependencies installed');
  } catch {
    installSpinner.warn('npm install failed — run it manually');
  }

  // Print next steps
  console.log('');
  logger.success(`Your MCP server is ready at ./${opts.serverName}/\n`);
  console.log('  Next steps:\n');
  console.log(`    cd ${opts.serverName}`);
  console.log('    npm run build');
  console.log('    npx mcpinnit test --tool <name> --input \'{}\'\n');
  console.log('  Connect to Claude Desktop:');
  console.log('    npx mcpinnit install-claude\n');
}
