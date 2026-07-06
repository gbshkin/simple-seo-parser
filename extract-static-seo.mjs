import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url));
const INPUT_PATH = path.join(ROOT_DIR, 'input-urls.json');
const OUTPUT_PATH = path.join(ROOT_DIR, 'output-seo.json');

const decodeHtml = (value) =>
  value
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');

const normalizeText = (value) =>
  decodeHtml(value).replace(/\s+/g, ' ').trim();

const getTitle = (html) => {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match?.[1] ? normalizeText(match[1]) : '';
};

const getDescription = (html) => {
  const patterns = [
    /<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["'][^>]*>/i,
    /<meta[^>]+content=["']([\s\S]*?)["'][^>]+name=["']description["'][^>]*>/i
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);

    if (match?.[1]) {
      return normalizeText(match[1]);
    }
  }

  return '';
};

const main = async () => {
  const rawInput = await readFile(INPUT_PATH, 'utf8');
  const items = JSON.parse(rawInput);

  if (!Array.isArray(items)) {
    throw new Error('input-urls.json должен быть массивом');
  }

  const result = [];

  for (const item of items) {
    const itemId = String(item?.id || item?.path || '').trim();
    const url = String(item?.url || '').trim();

    if (!itemId) {
      continue;
    }

    if (!url) {
      result.push({
        id: itemId,
        url: '',
        status: 'skipped',
        reason: 'empty-url',
        title: '',
        description: ''
      });
      continue;
    }

    process.stdout.write(`Fetching ${url}\n`);

    try {
      const response = await fetch(url, {
        headers: {
          'user-agent': 'Mozilla/5.0 (compatible; seo-parser/1.0)'
        }
      });

      if (!response.ok) {
        result.push({
          id: itemId,
          url,
          status: 'error',
          reason: `http-${response.status}`,
          title: '',
          description: ''
        });
        continue;
      }

      const html = await response.text();

      result.push({
        id: itemId,
        url,
        status: 'ok',
        title: getTitle(html),
        description: getDescription(html)
      });
    } catch (error) {
      result.push({
        id: itemId,
        url,
        status: 'error',
        reason: error instanceof Error ? error.message : 'unknown-error',
        title: '',
        description: ''
      });
    }
  }

  await writeFile(OUTPUT_PATH, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  process.stdout.write(`\nSaved to ${OUTPUT_PATH}\n`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
