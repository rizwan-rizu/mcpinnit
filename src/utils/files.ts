import fs from 'fs-extra';
import Handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Register helpers
Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);

export async function renderTemplate(templatePath: string, context: Record<string, unknown>): Promise<string> {
  const raw = readFileSync(templatePath, 'utf-8');
  const compiled = Handlebars.compile(raw, { noEscape: true });
  return compiled(context);
}

export async function writeRenderedTemplate(
  templatePath: string,
  outputPath: string,
  context: Record<string, unknown>
): Promise<void> {
  const content = await renderTemplate(templatePath, context);
  await fs.ensureDir(dirname(outputPath));
  await fs.writeFile(outputPath, content, 'utf-8');
}

export async function ensureDir(path: string): Promise<void> {
  await fs.ensureDir(path);
}

export async function writeFile(path: string, content: string): Promise<void> {
  await fs.ensureDir(dirname(path));
  await fs.writeFile(path, content, 'utf-8');
}

export function getTemplatesDir(): string {
  return join(__dirname, '..', 'generator', 'typescript', 'templates');
}
