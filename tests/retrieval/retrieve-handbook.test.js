import { describe, it, expect, beforeAll } from 'vitest';
import { retrieveHandbook } from '../../src/retrieval/retrieve-handbook.js';
import { loadHandbook } from '../../src/retrieval/load-handbook.js';

const TOP_MATCHES = [
  ['How many paid holidays do we get?', 'Company Holidays › Paid holidays'],
  ['How do I submit an expense report?', 'Expenses and Reimbursement › How to submit an expense report'],
  ['When does the 401(k) match vest?', 'Benefits › 401(k) retirement plan'],
  ['How does PTO accrual work?', 'Paid Time Off (PTO) › Accrual'],
  ['When is benefits open enrollment?', 'Benefits › Open enrollment'],
];

describe('retrieveHandbook', () => {
  let handbook;
  beforeAll(async () => {
    handbook = await loadHandbook('data/handbook');
  });

  it.each(TOP_MATCHES)('AC2.1: %j ranks %j first', (question, expectedTitle) => {
    const [top] = retrieveHandbook(question, handbook);

    expect(top.title).toBe(expectedTitle);
  });

  it('AC2.1: each result has title, content, and source file', () => {
    const results = retrieveHandbook('How many paid holidays do we get?', handbook);

    for (const result of results) {
      expect(Object.keys(result).sort()).toEqual(['content', 'source', 'title']);
    }
  });

  it('returns at most 3 results by default, or the requested limit', () => {
    expect(retrieveHandbook('holiday leave PTO benefits expense', handbook)).toHaveLength(3);
    expect(retrieveHandbook('holiday leave PTO benefits expense', handbook, { limit: 1 })).toHaveLength(1);
  });

  it('AC2.5: returns nothing when only common words match', () => {
    expect(retrieveHandbook('What is the policy for an employee at Lumen?', handbook)).toEqual([]);
  });

  it('AC2.5: returns nothing for a topic the handbook does not cover', () => {
    expect(retrieveHandbook('What is the dress code?', handbook)).toEqual([]);
  });
});
