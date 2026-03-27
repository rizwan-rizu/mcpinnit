import chalk from 'chalk';
import ora, { type Ora } from 'ora';

export const logger = {
  info: (msg: string) => console.log(chalk.blue('ℹ'), msg),
  success: (msg: string) => console.log(chalk.green('✅'), msg),
  error: (msg: string) => console.error(chalk.red('✗'), msg),
  warn: (msg: string) => console.warn(chalk.yellow('⚠'), msg),
  log: (msg: string) => console.log(msg),
  spinner: (text: string): Ora => ora({ text, color: 'cyan' }),
};
