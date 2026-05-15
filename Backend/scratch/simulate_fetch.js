
const venueId = 'cmp6dhgwm0006gne0151t5tpv';
const baseUrl = 'https://rezervame-backend.onrender.com/api';

async function testFetch(path) {
  console.log(`Testing ${path}...`);
  try {
    const res = await fetch(`${baseUrl}${path}`);
    console.log(`  Status: ${res.status}`);
    if (!res.ok) {
      console.error(`  Error: ${res.statusText}`);
      return;
    }
    const text = await res.text();
    console.log(`  Body length: ${text.length}`);
    try {
      const json = JSON.parse(text);
      console.log(`  JSON parsed successfully.`);
    } catch (e) {
      console.error(`  JSON PARSE FAILED: ${e.message}`);
      console.error(`  Snippet: ${text.slice(0, 100)}...${text.slice(-100)}`);
    }
  } catch (err) {
    console.error(`  FETCH FAILED: ${err.message}`);
  }
}

async function run() {
  await testFetch(`/business/${venueId}`);
  await testFetch(`/business/${venueId}/services`);
  await testFetch(`/business/${venueId}/staff`);
  await testFetch(`/business/${venueId}/reviews`);
}

run();
