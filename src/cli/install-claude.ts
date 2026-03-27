import { join } from 'path';
import { homedir } from 'os';
import fs from 'fs-extra';
import { confirm } from '@inquirer/prompts';
import { logger } from '../utils/logger.js';
import { isInsideMcpProject, findMcpRoot } from '../utils/detect.js';

interface ManifestEnv {
  key: string;
  description: string;
  required: boolean;
}

interface Manifest {
  name: string;
  transport: string;
  language: string;
  env?: ManifestEnv[];
}

export async function installClaude(): Promise<void> {
  const root = findMcpRoot();
  if (!root) {
    logger.error('No MCP project found. Run this from inside a generated mcpinnit project.');
    process.exit(1);
  }

  const manifest = await fs.readJson(join(root, '.mcp', 'manifest.json')) as Manifest;
  const serverName = manifest.name;

  const envVars: Record<string, string> = {};
  if (manifest.env) {
    for (const e of manifest.env) {
      envVars[e.key] = e.required ? `your-${e.key.toLowerCase().replace(/_/g, '-')}` : '';
    }
  }

  const entry = manifest.language === 'typescript'
    ? { command: 'node', args: ['./dist/index.js'] }
    : { command: 'python', args: ['-m', 'src.main'] };

  const config = {
    mcpServers: {
      [serverName]: {
        command: entry.command,
        args: entry.args,
        ...(Object.keys(envVars).length > 0 ? { env: envVars } : {}),
      },
    },
  };

  const configJson = JSON.stringify(config, null, 2);
  console.log('\nGenerated Claude Desktop config:\n');
  console.log(configJson);

  const claudeConfigPath = join(
    homedir(),
    'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'
  );

  const shouldWrite = await confirm({
    message: `Write to ${claudeConfigPath}?`,
    default: false,
  });

  if (shouldWrite) {
    let existing: { mcpServers?: Record<string, unknown> } = {};
    if (await fs.pathExists(claudeConfigPath)) {
      existing = await fs.readJson(claudeConfigPath) as typeof existing;
    }
    existing.mcpServers = { ...(existing.mcpServers ?? {}), ...config.mcpServers };
    await fs.ensureDir(join(homedir(), 'Library', 'Application Support', 'Claude'));
    await fs.writeJson(claudeConfigPath, existing, { spaces: 2 });
    logger.success(`Written to ${claudeConfigPath}`);
    logger.info('Restart Claude Desktop to pick up the changes.');
  }
}
