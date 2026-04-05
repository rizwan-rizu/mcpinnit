import { input, select } from '@inquirer/prompts';
import { isInsideMcpProject, findMcpRoot } from '../utils/detect.js';
import { addToolToProject } from '../generator/typescript/add-tool.js';
import { logger } from '../utils/logger.js';
import fs from 'fs-extra';
import { join } from 'path';

const TOOL_TEMPLATES = ['fetch', 'search', 'crud', 'notify', 'transform', 'blank'] as const;
type ToolTemplate = (typeof TOOL_TEMPLATES)[number];

export async function runAddTool(): Promise<void> {
  if (!isInsideMcpProject()) {
    logger.error('Not inside an mcpinnit project. Run this from a scaffolded MCP server directory.');
    process.exit(1);
  }

  const root = findMcpRoot()!;

  const toolName = await input({
    message: 'Tool name (kebab-case):',
    validate: (v) => {
      if (!/^[a-z][a-z0-9-]*$/.test(v)) return 'Must be kebab-case (e.g. my-tool)';
      if (v.length < 2) return 'Must be at least 2 characters';
      if (fs.existsSync(join(root, 'src', 'tools', `${v}.ts`))) return `Tool "${v}" already exists`;
      return true;
    },
  });

  const toolDescription = await input({
    message: 'Tool description:',
    validate: (v) => (v.trim().length > 0 ? true : 'Description is required'),
  });

  const template = await select<ToolTemplate>({
    message: 'Which template pattern?',
    choices: [
      { value: 'fetch', name: 'fetch    — HTTP request to an external URL' },
      { value: 'search', name: 'search   — Search and return results' },
      { value: 'crud', name: 'crud     — Create, read, update, delete' },
      { value: 'notify', name: 'notify   — Send notifications' },
      { value: 'transform', name: 'transform — Transform or process data' },
      { value: 'blank', name: 'blank    — Empty template to fill in' },
    ],
  });

  await addToolToProject(root, { name: toolName, description: toolDescription, template });
}
