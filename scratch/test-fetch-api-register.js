async function main() {
  const res = await fetch("http://localhost:3000/api/register");
  const data = await res.json();
  console.log("=== API REGISTER RESPONSE ===");
  console.log("Success:", data.success);
  console.log("Registrations count:", data.registrations?.length);
  if (data.registrations) {
    console.log("First 5 registrations:", data.registrations.slice(0, 5));
  }
}
main();
