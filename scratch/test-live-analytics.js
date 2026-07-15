const path = require('path');
const fs = require('fs');

async function main() {
  const adminEmail = "admin@githubpages.in";
  // The password for this admin was admin123 or similar. Let's see if we can log in by POSTing to /api/login.
  // Wait, let's try password "admin123" first.
  const password = "admin123";

  console.log("Logging in to live site as admin...");
  const loginRes = await fetch("https://ajumicrosoft.in/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: adminEmail, password })
  });

  console.log("Login HTTP Status:", loginRes.status);
  const loginData = await loginRes.json();
  console.log("Login Response:", loginData);

  if (!loginRes.ok || !loginData.success) {
    console.error("Login failed!");
    return;
  }

  // Get session cookie
  const cookieHeader = loginRes.headers.get("set-cookie");
  console.log("Cookies received:", cookieHeader);

  console.log("Fetching live analytics...");
  const statsRes = await fetch("https://ajumicrosoft.in/api/admin/analytics", {
    headers: {
      "Cookie": cookieHeader || ""
    }
  });

  console.log("Stats HTTP Status:", statsRes.status);
  const statsData = await statsRes.json();
  console.log("Stats Response:", JSON.stringify(statsData, null, 2));
}

main();
