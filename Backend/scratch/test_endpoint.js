
const fetch = require('node-fetch');

async function testEndpoint() {
  const id = 'cmp6foznu0002ill8jtq4efg8';
  const url = `https://rezervame-backend.onrender.com/api/business/${id}`;
  console.log(`Testing GET ${url}`);
  const res = await fetch(url);
  console.log(`Status: ${res.status}`);
  const data = await res.json();
  console.log('Response:', JSON.stringify(data, null, 2));
}

testEndpoint().catch(console.error);
