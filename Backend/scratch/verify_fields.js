
const venueId = 'cmp6dhgwm0006gne0151t5tpv';
const baseUrl = 'https://rezervame-backend.onrender.com/api';

async function run() {
  const res = await fetch(`${baseUrl}/business/${venueId}`);
  const json = await res.json();
  console.log('ID:', json.id);
  console.log('Name:', json.name);
  console.log('Category:', json.category);
  console.log('Keys:', Object.keys(json));
}

run();
