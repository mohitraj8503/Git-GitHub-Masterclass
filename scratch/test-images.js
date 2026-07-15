async function checkImage(url) {
  try {
    const res = await fetch(url, { method: "HEAD" });
    console.log(`URL: ${url} -> Status: ${res.status}`);
  } catch (err) {
    console.error(`URL: ${url} -> Error: ${err.message}`);
  }
}

async function main() {
  await checkImage("https://ajumicrosoft.in/images/arka-jain-logo-wide.png");
  await checkImage("https://ajumicrosoft.in/images/mlsa-badge.png");
}

main();
