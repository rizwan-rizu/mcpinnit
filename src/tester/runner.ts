import { spawn } from 'child_process';
import { join } from 'path';
import fs from 'fs-extra';
import { validateToolResponse } from './validator.js';
import { reportToolResult, reportSummary } from './reporter.js';
import { logger } from '../utils/logger.js';
import { isInsideMcpProject, findMcpRoot } from '../utils/detect.js';
import type { ToolCallResult } from '../types.js';

interface TestOptions {
  tool?: string;
  input: string;
  all?: boolean;
  watch?: boolean;
  verbose?: boolean;
}

interface MCPMessage {
  jsonrpc: string;
  id: number;
  method?: string;
  result?: unknown;
  error?: { message: string };
  params?: unknown;
}

const TIMEOUT_MS = 10_000;

async function callTool(
  serverEntryPath: string,
  toolName: string,
  input: Record<string, unknown>,
  verbose = false
): Promise<ToolCallResult> {
  const start = Date.now();

  return new Promise((resolve) => {
    const child = spawn('node', [serverEntryPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    let buffer = '';
    let settled = false;
    let initSent = false;

    const finish = (result: Omit<ToolCallResult, 'toolName' | 'input'>) => {
      if (settled) return;
      settled = true;
      child.kill();
      resolve({ toolName, input, ...result });
    };

    const timeout = setTimeout(() => {
      finish({
        error: `Timeout after ${TIMEOUT_MS}ms`,
        latencyMs: Date.now() - start,
        schemaValid: false,
        sizeBytes: 0,
        passed: false,
      });
    }, TIMEOUT_MS);

    child.stdout.on('data', (chunk: Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line) as MCPMessage;

          // Server sends initialize result — now send tools/call
          if (msg.id === 1 && msg.result !== undefined && !initSent) {
            initSent = true;
            const callMsg = {
              jsonrpc: '2.0',
              id: 2,
              method: 'tools/call',
              params: { name: toolName, arguments: input },
            };
            child.stdin.write(JSON.stringify(callMsg) + '\n');
          }

          // tools/call result
          if (msg.id === 2) {
            clearTimeout(timeout);
            const latencyMs = Date.now() - start;

            if (msg.error) {
              finish({
                error: msg.error.message,
                latencyMs,
                schemaValid: false,
                sizeBytes: Buffer.byteLength(JSON.stringify(msg.error)),
                passed: false,
              });
              return;
            }

            const validation = validateToolResponse(msg.result, latencyMs);
            finish({
              output: msg.result,
              latencyMs,
              schemaValid: validation.schemaValid,
              sizeBytes: validation.sizeBytes,
              passed: validation.schemaValid && validation.withinSizeLimit && validation.withinLatencyLimit,
            });
          }
        } catch {
          // not JSON, ignore
        }
      }
    });

    child.stderr.on('data', (chunk: Buffer) => {
      if (verbose) process.stderr.write(chunk);
    });

    child.on('error', (err) => {
      clearTimeout(timeout);
      finish({
        error: `Failed to start server: ${err.message}`,
        latencyMs: Date.now() - start,
        schemaValid: false,
        sizeBytes: 0,
        passed: false,
      });
    });

    // Send MCP initialize
    const initMsg = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'mcpinnit-tester', version: '0.1.0' },
      },
    };
    child.stdin.write(JSON.stringify(initMsg) + '\n');
  });
}

export async function runTest(opts: TestOptions): Promise<void> {
  const root = findMcpRoot();
  if (!root) {
    logger.error('No MCP project found. Run this from inside a generated mcpinnit project.');
    process.exit(1);
  }

  const serverEntry = join(root, 'dist', 'index.js');
  if (!await fs.pathExists(serverEntry)) {
    logger.error(`Server entry not found: ${serverEntry}\nRun "npm run build" first.`);
    process.exit(1);
  }

  let input: Record<string, unknown> = {};
  try {
    input = JSON.parse(opts.input) as Record<string, unknown>;
  } catch {
    logger.error(`Invalid JSON input: ${opts.input}`);
    process.exit(1);
  }

  const results: ToolCallResult[] = [];

  if (opts.all) {
    // Discover tools from manifest
    const manifest = await fs.readJson(join(root, '.mcp', 'manifest.json')) as { tools: Array<{ name: string }> };
    const toolNames = manifest.tools.map((t) => t.name);

    if (toolNames.length === 0) {
      logger.warn('No tools found in .mcp/manifest.json');
      return;
    }

    for (const name of toolNames) {
      const result = await callTool(serverEntry, name, input, opts.verbose);
      reportToolResult(result, opts.verbose);
      results.push(result);
    }
  } else if (opts.tool) {
    const result = await callTool(serverEntry, opts.tool, input, opts.verbose);
    reportToolResult(result, opts.verbose);
    results.push(result);
  } else {
    logger.error('Specify --tool <name> or --all');
    process.exit(1);
  }

  reportSummary(results);

  const failed = results.some((r) => !r.passed);
  if (failed) process.exit(1);
}
