import { config } from 'dotenv';
config();

import { nlpService } from './src/services/nlpService';

async function test() {
  console.log('Testing NLP Service...');
  console.log('Is Ready:', nlpService.isReady());
  
  const query = 'I want a electronics';
  console.log('\nQuery:', query);
  
  const result = await nlpService.parseQuery(query);
  console.log('Result:', JSON.stringify(result, null, 2));
}

test().catch(console.error);
