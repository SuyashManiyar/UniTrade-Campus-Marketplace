import { config } from 'dotenv';
config();

import { nlpService } from './src/services/nlpService';

async function test() {
  const queries = [
    'laptop under $100',
    'phone over $50',
    'bike between $100 and $300',
    'desk around $150'
  ];

  for (const query of queries) {
    console.log(`\nQuery: "${query}"`);
    const result = await nlpService.parseQuery(query);
    console.log('Result:', JSON.stringify(result, null, 2));
  }
}

test().catch(console.error);
