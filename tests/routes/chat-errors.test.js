import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

const HANDBOOK = [
  {
    title: 'Company Holidays › Paid holidays',
    content: 'Lumen Systems observes 11 paid holidays each year.',
    source: 'data/handbook/holidays.md',
  },
];

function setup({ answer = vi.fn().mockResolvedValue({ text: '11 holidays.' }) } = {}) {
  const llmClient = { answer };
  const logs = [];
  const app = createApp({ llmClient, handbook: HANDBOOK, logger: (entry) => logs.push(entry) });
  return { app, llmClient, logs };
}

describe('POST /api/chat input validation', () => {
  it.each([
    ['a missing message', {}],
    ['a non-string message', { message: 42 }],
    ['an object message', { message: { text: 'hi' } }],
    ['a message over 1,000 characters', { message: 'holiday '.repeat(200) }],
  ])('rejects %s with 400 and no LLM call', async (_label, body) => {
    const { app, llmClient } = setup();

    const res = await request(app).post('/api/chat').send(body);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: expect.any(String) });
    expect(llmClient.answer).not.toHaveBeenCalled();
  });

  it('rejects malformed JSON with a 400 JSON error, not a stack trace', async () => {
    const { app } = setup();

    const res = await request(app)
      .post('/api/chat')
      .set('Content-Type', 'application/json')
      .send('{"message": ');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: expect.any(String) });
  });
});

describe('POST /api/chat LLM failures', () => {
  it('returns 502 with a generic message when the LLM call fails', async () => {
    const { app } = setup({ answer: vi.fn().mockRejectedValue(new Error('secret upstream detail')) });

    const res = await request(app).post('/api/chat').send({ message: 'How many paid holidays do we get?' });

    expect(res.status).toBe(502);
    expect(res.body).toEqual({ error: expect.any(String) });
    expect(JSON.stringify(res.body)).not.toContain('secret upstream detail');
  });
});

describe('POST /api/chat logging', () => {
  const QUESTIONS = [
    'Why is Zelda on leave?',
    'How many PTO days do I have left?',
    'How many paid holidays do we get?',
  ];

  it.each(QUESTIONS)('logs request ID, tier, and reasons, never the text of %j', async (message) => {
    const { app, logs } = setup();

    const res = await request(app).post('/api/chat').send({ message });

    expect(logs).toHaveLength(1);
    expect(Object.keys(logs[0]).sort()).toEqual(['reasons', 'requestId', 'tier']);
    expect(logs[0].requestId).toBe(res.headers['x-request-id']);
    expect(JSON.stringify(logs)).not.toContain(message);
  });

  it('logs the error name, not the raw text, when the LLM fails', async () => {
    const { app, logs } = setup({ answer: vi.fn().mockRejectedValue(new TypeError('boom')) });

    await request(app).post('/api/chat').send({ message: 'How many paid holidays do we get?' });

    expect(logs).toEqual([
      expect.objectContaining({ tier: 'PUBLIC', error: 'TypeError' }),
    ]);
    expect(JSON.stringify(logs)).not.toContain('paid holidays');
  });
});
