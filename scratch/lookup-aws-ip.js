const https = require('https');

// Let's do a simple substring check or download the json and look for ipv6_prefix
https.get('https://ip-ranges.amazonaws.com/ip-ranges.json', (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    const data = JSON.parse(body);
    const target = '2406:da1c:61c:d601:a74:694b:887:af93';
    console.log("Searching for region of:", target);
    
    // Simple match: check which prefix contains our target
    // For AWS IPv6 ranges, they are defined in ipv6_prefixes array
    for (const prefix of data.ipv6_prefixes) {
      // e.g. "2406:da1c:600::/40"
      const [ipPart, bits] = prefix.ipv6_prefix.split('/');
      // Let's see if the prefix matches the start of target
      // 2406:da1c is 32 bits (4 characters * 4 * 2 = 32 bits, wait, hex characters are 4 bits each: 2406 is 16 bits, da1c is 16 bits, total 32 bits)
      // So 2406:da1c matches any /32 prefix
      if (prefix.ipv6_prefix.startsWith('2406:da1c')) {
        console.log(`Matching prefix: ${prefix.ipv6_prefix} in region: ${prefix.region} service: ${prefix.service}`);
      }
    }
  });
});
