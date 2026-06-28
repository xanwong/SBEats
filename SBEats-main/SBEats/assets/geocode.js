// script to get the latitude and longitude of each restaurant using OpenStreetMap Nominatim API
// free API to get accurate coordinates for each food spot

const fs = require('fs');
const restaurants = JSON.parse(fs.readFileSync('iv_restaurants.json', 'utf8'));

async function geocode(address, city, zip) {
  const full = `${address}, ${city}, CA ${zip}, USA`;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(full)}&format=json&limit=1`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'SBEats-App/1.0' }
  });
  const data = await res.json();
  if (data.length > 0) {
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  }
  return null;
}

async function main() {
  const results = [];
  for (const r of restaurants) {
    const coords = await geocode(r.address, r.city, r.zip);
    if (coords) {
      console.log(`✓ ${r.name}: ${coords.lat}, ${coords.lng}`);
      results.push({ ...r, latitude: coords.lat, longitude: coords.lng });
    } else {
      console.log(`✗ ${r.name}: NOT FOUND`);
      results.push(r);
    }
    // nominatim rate limit: max 1 request/second
    await new Promise(res => setTimeout(res, 1100));
  }
  fs.writeFileSync('iv_restaurants.json', JSON.stringify(results, null, 4));
  console.log('\nDone!');
}

main();