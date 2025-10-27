#!/usr/bin/env node

const http = require('http');

console.log('🔍 Checking UMass Marketplace health...\n');

// Check backend health
function checkBackend() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:8080/api/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.status === 'OK') {
            console.log('✅ Backend: Running on http://localhost:8080');
            console.log('   API Health:', response.message);
            resolve(true);
          } else {
            console.log('❌ Backend: Unhealthy response');
            resolve(false);
          }
        } catch (e) {
          console.log('❌ Backend: Invalid response');
          resolve(false);
        }
      });
    });
    
    req.on('error', () => {
      console.log('❌ Backend: Not running on http://localhost:8080');
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('❌ Backend: Timeout');
      resolve(false);
    });
  });
}

// Check frontend
function checkFrontend() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000', (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Frontend: Running on http://localhost:3000');
        resolve(true);
      } else {
        console.log('❌ Frontend: Unexpected status code:', res.statusCode);
        resolve(false);
      }
    });
    
    req.on('error', () => {
      console.log('❌ Frontend: Not running on http://localhost:3000');
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('❌ Frontend: Timeout');
      resolve(false);
    });
  });
}

// Run health checks
async function runHealthCheck() {
  const backendOk = await checkBackend();
  const frontendOk = await checkFrontend();
  
  console.log('\n📊 Health Check Summary:');
  console.log('Backend:', backendOk ? '✅ Healthy' : '❌ Unhealthy');
  console.log('Frontend:', frontendOk ? '✅ Healthy' : '❌ Unhealthy');
  
  if (backendOk && frontendOk) {
    console.log('\n🎉 UMass Marketplace is running perfectly!');
    console.log('\n🌐 Access URLs:');
    console.log('• Website: http://localhost:3000');
    console.log('• Admin: http://localhost:3000/admin');
    console.log('• Dev Tools: http://localhost:3000/dev/codes');
    console.log('• API: http://localhost:8080/api');
  } else {
    console.log('\n🚨 Some services are not running.');
    console.log('Try running: npm run dev');
  }
}

runHealthCheck();