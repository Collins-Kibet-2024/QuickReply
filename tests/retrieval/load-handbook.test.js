import { describe, it, expect } from 'vitest';
import { parseHandbookFile, loadHandbook } from '../../src/retrieval/load-handbook.js';

const SAMPLE = `# Company Holidays

## Paid holidays

Lumen observes 11 paid holidays.

- New Year's Day

## Floating holidays

Every employee receives 2 floating holidays.
`;

describe('parseHandbookFile', () => {
  it('AC2.1: splits a file into one section per "##" heading', () => {
    const sections = parseHandbookFile(SAMPLE, 'data/handbook/holidays.md');

    expect(sections).toEqual([
      {
        title: 'Company Holidays › Paid holidays',
        content: "Lumen observes 11 paid holidays.\n\n- New Year's Day",
        source: 'data/handbook/holidays.md',
      },
      {
        title: 'Company Holidays › Floating holidays',
        content: 'Every employee receives 2 floating holidays.',
        source: 'data/handbook/holidays.md',
      },
    ]);
  });

  it('keeps text before the first "##" as a section titled after the file', () => {
    const sections = parseHandbookFile('# Expenses\n\nIntro text.\n\n## Travel\n\nBook early.', 'x.md');

    expect(sections.map((s) => s.title)).toEqual(['Expenses', 'Expenses › Travel']);
  });
});

describe('loadHandbook', () => {
  it('AC2.1: loads every handbook file with title, content, and source', async () => {
    const sections = await loadHandbook('data/handbook');
    const sources = new Set(sections.map((s) => s.source));

    expect(sources).toEqual(
      new Set([
        'data/handbook/benefits.md',
        'data/handbook/expenses.md',
        'data/handbook/holidays.md',
        'data/handbook/parental-leave.md',
        'data/handbook/pto.md',
      ]),
    );
    for (const section of sections) {
      expect(section.title).toMatch(/\S › \S/);
      expect(section.content.length).toBeGreaterThan(0);
    }
  });
});
