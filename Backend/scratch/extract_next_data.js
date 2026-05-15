
const fs = require('fs');

async function run() {
  const res = await fetch('https://rezervame-web.web.app/venue/cmp6dhgwm0006gne0151t5tpv');
  const html = await res.text();
  const match = html.match(/<script id="__NEXT_DATA__" type="application/json">(.*?)<\/script>/);
  if (match) {
    const data = JSON.parse(match[1]);
    fs.writeFileSync('scratch/next_data.json', JSON.stringify(data, null, 2));
    console.log('Extracted __NEXT_DATA__');
  } else {
    console.log('No __NEXT_DATA__ found');
  }
}

run();
