import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import { writeRenderedTemplate, getTemplatesDir } from '../../utils/files.js';
import { logger } from '../../utils/logger.js';
import type { MCPManifest } from '../../types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function toPascalCase(str: string): string {
  return str.replace(/(^|-)([a-z])/g, (_, __, c: string) => c.toUpperCase());
}

export interface AddToolOptions {
  name: string;
  description: string;
  template: string;
}

export async function addToolToProject(root: string, opts: AddToolOptions): Promise<void> {
  const { name, description, template } = opts;
  const namePascal = toPascalCase(name);
  const TEMPLATES = getTemplatesDir();

  const spinner = logger.spinner(`Adding tool "${name}"...`);
  spinner.start();

  const ctx = { toolName: name, toolNamePascal: namePascal };

  // 1. Generate src/tools/<name>.ts
  const toolTemplate = join(TEMPLATES, 'tools', `${template}.ts.hbs`);
  await writeRenderedTemplate(toolTemplate, join(root, 'src', 'tools', `${name}.ts`), ctx);

  // 2. Generate tests/<name>.test.ts
  await writeRenderedTemplate(
    join(TEMPLATES, 'tool.test.ts.hbs'),
    join(root, 'tests', `${name}.test.ts`),
    ctx
  );

  // 3. Patch src/tools/index.ts — append export
  const indexPath = join(root, 'src', 'tools', 'index.ts');
  const indexContent = await fs.readFile(indexPath, 'utf-8');
  const exportLine = `export { ${namePascal}Tool } from './${name}.js';\n`;
  await fs.writeFile(indexPath, indexContent.trimEnd() + '\n' + exportLine);

  // 4. Patch src/server.ts — add import + registration
  const serverPath = join(root, 'src', 'server.ts');
  let serverContent = await fs.readFile(serverPath, 'utf-8');

  // Insert import after the last existing import line
  const importLine = `import { ${namePascal}Tool } from './tools/${name}.js';`;
  const lines = serverContent.split('\n');
  let lastImportIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^import\s/.test(lines[i])) lastImportIdx = i;
  }
  lines.splice(lastImportIdx + 1, 0, importLine);

  // Insert server.tool() registration before `return server;`
  const registration = [
    '',
    `  server.tool(`,
    `    ${namePascal}Tool.name,`,
    `    ${namePascal}Tool.description,`,
    `    ${namePascal}Tool.schema,`,
    `    (args, _extra) => ${namePascal}Tool.handler(args)`,
    `  );`,
  ].join('\n');

  const returnIdx = lines.findIndex((l) => l.trim() === 'return server;');
  lines.splice(returnIdx, 0, registration);

  await fs.writeFile(serverPath, lines.join('\n'));

  // 5. Patch .mcp/manifest.json — add tool entry
  const manifestPath = join(root, '.mcp', 'manifest.json');
  const manifest = (await fs.readJson(manifestPath)) as MCPManifest;
  manifest.tools.push({ name, description, inputs: [], outputs: [] });
  await fs.writeJson(manifestPath, manifest, { spaces: 2 });

  spinner.succeed(`Tool "${name}" added`);

  console.log('');
  console.log(`  Files created:`);
  console.log(`    src/tools/${name}.ts`);
  console.log(`    tests/${name}.test.ts`);
  console.log('');
  console.log('  Next steps:');
  console.log(`    1. Fill in your logic in src/tools/${name}.ts`);
  console.log('    2. npm run build');
  console.log(`    3. npx mcpinnit test --tool ${name} --input '{}'`);
  console.log('');
}
