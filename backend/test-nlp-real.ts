import axios from 'axios';

async function testWithRealData() {
  const baseURL = 'http://localhost:8080/api';
  
  console.log('Testing NLP Search with Real Database Data...\n');
  
  try {
    // Test: Search for laptop
    console.log('Query: "I want a laptop in good condition"');
    const response = await axios.post(`${baseURL}/listings/nlp-search`, {
      query: 'I want a laptop in good condition'
    });
    
    console.log('\nExtracted Filters:');
    console.log(JSON.stringify(response.data.extractedFilters, null, 2));
    
    console.log(`\nFound ${response.data.listings.length} listings:`);
    response.data.listings.forEach((listing: any) => {
      console.log(`- ${listing.title} ($${listing.price}) - ${listing.condition}`);
    });
    
    console.log(`\nFallback used: ${response.data.fallbackUsed}`);
    console.log(`Confidence: ${response.data.extractedFilters.confidence}`);
    
  } catch (error: any) {
    if (error.response) {
      console.error('Error:', error.response.status, error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testWithRealData();
