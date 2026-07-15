async function main() {
  try {
    const res = await fetch("https://ajumicrosoft.in/api/register");
    const data = await res.json();
    console.log("=== LIVE WEBSITE API REGISTER RESPONSE ===");
    console.log("Success:", data.success);
    console.log("Registrations count on live website:", data.registrations?.length);
    if (data.registrations) {
      console.log("First 3 registrations:");
      console.log(data.registrations.slice(0, 3).map(r => ({ name: r.name, email: r.email, enroll: r.enrollment_number })));
    }
  } catch (err) {
    console.error("Failed to fetch from live website:", err.message);
  }
}
main();
