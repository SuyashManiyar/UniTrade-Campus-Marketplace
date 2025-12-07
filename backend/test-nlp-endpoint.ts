import axios from 'axios';

async function testNLPEndpoint() {
  const baseURL = 'http://localhost:8080/api';
  
  console.log('Testing NLP Search Endpoint...\n');
  
  try {
    // Test 1: Simple query
    console.log('Test 1: "I want a powerbank in fair condition"');
    const response1 = await axios.post(`${baseURL}/listings/nlp-search`, {
      query: 'I want a powerbank in fair condition'
    });
    
    console.log('Extracted Filters:', JSON.stringify(response1.data.extractedFilters, null, 2));
    console.log('Found listings:', response1.data.listings.length);
    console.log('Fallback used:', response1.data.fallbackUsed);
    console.log('\n---\n');
    
    // Test 2: Price range query
    console.log('Test 2: "laptop under $500"');
    const response2 = await axios.post(`${baseURL}/listings/nlp-search`, {
      query: 'laptop under $500'
    });
    
    console.log('Extracted Filters:', JSON.stringify(response2.data.extractedFilters, null, 2));
    console.log('Found listings:', response2.data.listings.length);
    console.log('\n---\n');
    
    // Test 3: Category query
    console.log('Test 3: "textbooks in good condition"');
    const response3 = await axios.post(`${baseURL}/listings/nlp-search`, {
      query: 'textbooks in good condition'
    });
    
    console.log('Extracted Filters:', JSON.stringify(response3.data.extractedFilters, null, 2));
    console.log('Found listings:', response3.data.listings.length);
    
  } catch (error: any) {
    if (error.response) {
      console.error('Error:', error.response.status, error.response.data);
    } else {
      console.error('Error:', error.message);
      console.log('\nMake sure the backend server is running on port 8080');
    }
  }
}

testNLPEndpoint();
