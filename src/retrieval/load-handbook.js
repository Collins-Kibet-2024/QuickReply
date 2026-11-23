import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

function makeSection(fileTitle, heading, lines, source) {
  return {
    title: heading ? `${fileTitle} › ${heading}` : fileTitle,
    content: lines.join('\n').trim(),
    source,
  };
}

/** Split one handbook markdown file into sections, one per "##" heading. */
export function parseHandbookFile(markdown, source) {
  const lines = markdown.split('\n');
  const fileTitle = (lines.find((line) => line.startsWith('# ')) ?? `# ${source}`).slice(2).trim();

  const sections = [];
  let heading = null;
  let body = [];
  const flush = () => {
    const section = makeSection(fileTitle, heading, body, source);
    if (section.content) sections.push(section);
  };

  for (const line of lines) {
    if (line.startsWith('# ')) continue;
    if (line.startsWith('## ')) {
      flush();
      heading = line.slice(3).trim();
      body = [];
    } else {
      body.push(line);
    }
  }
  flush();
  return sections;
}

/** Read every .md file in `dir` and return all their sections. Sources are cwd-relative. */
export async function loadHandbook(dir) {
  const files = (await readdir(dir)).filter((name) => name.endsWith('.md')).sort();
  const perFile = await Promise.all(
    files.map(async (name) => {
      const filePath = path.join(dir, name);
      const source = path.relative(process.cwd(), filePath).split(path.sep).join('/');
      return parseHandbookFile(await readFile(filePath, 'utf8'), source);
    }),
  );
  return perFile.flat();
}
