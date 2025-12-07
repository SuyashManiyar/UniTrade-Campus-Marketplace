import { config } from 'dotenv';
config();

import { nlpService } from './src/services/nlpService';

async function testCache() {
  console.log('Testing NLP Service Caching...\n');
  
  const query = 'I want a powerbank in fair condition';
  
  // First call - should hit API
  console.log('First call (should hit API):');
  console.time('First call');
  const result1 = await nlpService.parseQuery(query);
  console.timeEnd('First call');
  console.log('Result:', JSON.stringify(result1, null, 2));
  console.log('Cache stats:', nlpService.getCacheStats());
  
  console.log('\n---\n');
  
  // Second call - should use cache
  console.log('Second call (should use cache):');
  console.time('Second call');
  const result2 = await nlpService.parseQuery(query);
  console.timeEnd('Second call');
  console.log('Result:', JSON.stringify(result2, null, 2));
  console.log('Cache stats:', nlpService.getCacheStats());
  
  console.log('\n---\n');
  
  // Different query
  console.log('Different query (should hit API):');
  console.time('Third call');
  const result3 = await nlpService.parseQuery('laptop under $500');
  console.timeEnd('Third call');
  console.log('Result:', JSON.stringify(result3, null, 2));
  console.log('Cache stats:', nlpService.getCacheStats());
}

testCache().catch(console.error);
