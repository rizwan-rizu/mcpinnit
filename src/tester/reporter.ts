import chalk from 'chalk';
import type { ToolCallResult } from '../types.js';

const MAX_SIZE_BYTES = 25 * 1024;

export function reportToolResult(result: ToolCallResult, verbose = false): void {
  const icon = result.passed ? chalk.green('✅') : chalk.red('✗');
  const toolLabel = result.passed
    ? chalk.green(`Tool: ${result.toolName}`)
    : chalk.red(`Tool: ${result.toolName}`);

  console.log(`\n${icon} ${toolLabel}`);
  console.log(`  ${chalk.dim('⏱')}  Latency: ${result.latencyMs}ms`);
  console.log(`  ${chalk.dim('📤')} Input:  ${JSON.stringify(result.input)}`);

  if (result.error) {
    console.log(`  ${chalk.dim('📥')} Error:  ${chalk.red(result.error)}`);
  } else if (verbose || !result.passed) {
    console.log(`  ${chalk.dim('📥')} Output: ${JSON.stringify(result.output)}`);
  } else {
    const preview = JSON.stringify(result.output);
    const trimmed = preview.length > 120 ? preview.slice(0, 120) + '...' : preview;
    console.log(`  ${chalk.dim('📥')} Output: ${trimmed}`);
  }

  if (result.schemaValid) {
    console.log(`  ${chalk.green('✅')} Schema valid`);
  } else {
    console.log(`  ${chalk.red('✗')} Schema invalid`);
  }

  const kb = (result.sizeBytes / 1024).toFixed(1);
  const maxKb = (MAX_SIZE_BYTES / 1024).toFixed(0);
  if (result.sizeBytes <= MAX_SIZE_BYTES) {
    console.log(`  ${chalk.green('✅')} Response within size limit (${kb}kb / ${maxKb}kb max)`);
  } else {
    console.log(`  ${chalk.red('✗')} Response exceeds size limit (${kb}kb / ${maxKb}kb max)`);
  }
}

export function reportSummary(results: ToolCallResult[]): void {
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  console.log('\n' + '─'.repeat(40));
  if (passed === total) {
    console.log(chalk.green(`  All ${total} tool(s) passed`));
  } else {
    console.log(chalk.red(`  ${passed}/${total} passed, ${total - passed} failed`));
  }
  console.log('─'.repeat(40) + '\n');
}
