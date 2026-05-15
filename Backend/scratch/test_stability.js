
const venueId = 'cmp6dhgwm0006gne0151t5tpv';
const baseUrl = 'https://rezervame-backend.onrender.com/api';

async function testFetch(i) {
  try {
    const res = await fetch(`${baseUrl}/business/${venueId}`);
    if (!res.ok) {
      console.log(`[${i}] Status: ${res.status}`);
      return;
    }
    const text = await res.text();
    try {
      JSON.parse(text);
      process.stdout.write('.');
    } catch (e) {
      console.log(`\n[${i}] JSON PARSE FAILED: ${e.message}`);
      console.log(`[${i}] Snippet: ${text.slice(0, 100)}`);
    }
  } catch (err) {
    console.log(`\n[${i}] FETCH FAILED: ${err.message}`);
  }
}

async function run() {
  console.log('Running 20 iterations...');
  for (let i = 0; i < 20; i++) {
    await testFetch(i);
  }
  console.log('\nDone.');
}

run();
