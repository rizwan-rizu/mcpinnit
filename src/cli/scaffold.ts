import { input, select, checkbox, confirm } from '@inquirer/prompts';
import { logger } from '../utils/logger.js';
import { generateTypeScriptProject } from '../generator/typescript/index.js';
import type { ScaffoldOptions } from '../types.js';

function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function scaffold(): Promise<void> {
  console.log('\n' + '─'.repeat(50));
  console.log('  mcpinnit — Init your MCP server in 60 seconds');
  console.log('─'.repeat(50) + '\n');

  const serverName = await input({
    message: 'What is your server name?',
    default: 'my-mcp-server',
    validate: (val) => {
      const kebab = toKebabCase(val);
      if (!kebab) return 'Server name cannot be empty';
      if (kebab.length < 2) return 'Server name must be at least 2 characters';
      return true;
    },
    transformer: (val) => toKebabCase(val),
  });

  const serverDescription = await input({
    message: 'Short description of what this server does?',
    default: `A ${serverName} MCP server`,
  });

  const transport = await select<'stdio' | 'http'>({
    message: 'Choose transport layer:',
    default: 'stdio',
    choices: [
      { name: 'stdio (recommended — works with Claude Desktop, Cursor, Claude Code)', value: 'stdio' },
      { name: 'http (Streamable HTTP — for web deployments)', value: 'http' },
    ],
  });

  const language = await select<'typescript' | 'python'>({
    message: 'Choose language:',
    default: 'typescript',
    choices: [
      { name: 'TypeScript', value: 'typescript' },
      { name: 'Python (coming soon)', value: 'python', disabled: true },
    ],
  });

  const auth = await select<'none' | 'api-key' | 'oauth2'>({
    message: 'Add authentication?',
    default: 'none',
    choices: [
      { name: 'None', value: 'none' },
      { name: 'API Key', value: 'api-key' },
      { name: 'OAuth 2.0', value: 'oauth2' },
    ],
  });

  const selectedTools = await checkbox<string>({
    message: 'Which tool templates to include?',
    choices: [
      { name: 'fetch      — fetch data from a URL', value: 'fetch', checked: true },
      { name: 'search     — search and return results', value: 'search', checked: true },
      { name: 'crud       — create, read, update, delete', value: 'crud' },
      { name: 'notify     — send notifications', value: 'notify' },
      { name: 'transform  — transform/process data', value: 'transform' },
      { name: 'blank      — empty tool to fill in', value: 'blank' },
    ],
    validate: (choices) => {
      if (choices.length === 0) return 'Select at least one tool template';
      return true;
    },
  });

  // Contextual follow-up questions based on selected tools
  let apiBaseUrl: string | undefined;
  let defaultHttpMethod = 'GET';

  if (selectedTools.includes('fetch')) {
    const baseUrl = await input({
      message: 'API base URL? (optional — press Enter to skip)',
      default: '',
    });
    apiBaseUrl = baseUrl.trim() || undefined;

    defaultHttpMethod = await select<string>({
      message: 'Default HTTP method for fetch tool?',
      default: 'GET',
      choices: [
        { value: 'GET' },
        { value: 'POST' },
        { value: 'PUT' },
        { value: 'PATCH' },
        { value: 'DELETE' },
      ],
    });
  }

  const envVarsInput = await input({
    message: 'Environment variables your server needs? (comma-separated, e.g. API_KEY,DB_URL — press Enter to skip)',
    default: '',
  });
  const envVars = envVarsInput
    .split(',')
    .map((v) => v.trim().toUpperCase())
    .filter(Boolean);

  const options: ScaffoldOptions = {
    serverName: toKebabCase(serverName),
    serverDescription,
    transport,
    language,
    auth,
    tools: selectedTools,
    apiBaseUrl,
    defaultHttpMethod,
    envVars,
  };

  console.log('');

  if (language === 'typescript') {
    await generateTypeScriptProject(options);
  }
}
