#!/usr/bin/env node
import { Command } from 'commander';
import { scaffold } from './scaffold.js';
import { runTest } from '../tester/runner.js';
import { logger } from '../utils/logger.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf-8')) as { version: string };

const program = new Command();

program
  .name('mcpinnit')
  .description('Init your MCP server in 60 seconds.')
  .version(pkg.version);

// Default command — scaffold
program
  .command('scaffold', { isDefault: true, hidden: true })
  .description('Scaffold a new MCP server interactively')
  .action(async () => {
    await scaffold();
  });

// test subcommand
program
  .command('test')
  .description('Test MCP tools locally without Claude Desktop')
  .option('--tool <name>', 'Test a specific tool by name')
  .option('--input <json>', 'JSON input to pass to the tool', '{}')
  .option('--all', 'Test all tools')
  .option('--watch', 'Watch for file changes and re-run')
  .option('--verbose', 'Show full output including intermediate steps')
  .action(async (opts: { tool?: string; input: string; all?: boolean; watch?: boolean; verbose?: boolean }) => {
    await runTest(opts);
  });

// install-claude subcommand
program
  .command('install-claude')
  .description('Generate and optionally write Claude Desktop config')
  .action(async () => {
    const { installClaude } = await import('./install-claude.js');
    await installClaude();
  });

program.parse();
