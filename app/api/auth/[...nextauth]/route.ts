import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import { supabaseAdmin } from "@/lib/supabaseServer";
import fs from "fs";
import path from "path";

const normalizeEmail = (email: string) => email.trim().toLowerCase();
const getProviderField = (provider?: string | null) => {
  switch (provider) {
    case "google":
      return "google_id";
    case "github":
      return "github_id";
    default:
      return null;
  }
};

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "placeholder-google-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "placeholder-google-secret",
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "placeholder-github-id",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "placeholder-github-secret",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || "nextauth-secret-key-default-32-chars-minimum",
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      const userEmail = normalizeEmail(user.email);
      const userName = user.name || "OAuth User";
      const userImage = user.image || "";
      const providerField = getProviderField(account?.provider);
      const providerId = account?.providerAccountId || account?.id || `${account?.provider || "oauth"}-${Date.now()}`;

      let registration: any = null;

      if (supabaseAdmin) {
        try {
          const { data, error } = await supabaseAdmin
            .from("registrations")
            .select("*")
            .eq("email", userEmail)
            .maybeSingle();

          if (!error && data) {
            registration = data;
          }
        } catch (e) {
          console.error("Supabase registrations query failed:", e);
        }
      }

      if (!registration) {
        const dataDir = path.join(process.cwd(), "data");
        const regFilePath = path.join(dataDir, "registrations.json");
        if (fs.existsSync(regFilePath)) {
          try {
            const fileData = fs.readFileSync(regFilePath, "utf8");
            const registrations = JSON.parse(fileData);
            registration = registrations.find(
              (r: any) => r.email && r.email.toLowerCase() === userEmail
            );
          } catch (e) {
            console.error("Error reading fallback JSON registrations:", e);
          }
        }
      }

      if (!registration) {
        console.info(`OAuth sign-in for ${userEmail} has no matching registration yet; waiting for manual registration before linking provider.`);
        return true;
      } else if (providerField && (!registration[providerField] || registration[providerField] !== providerId)) {
        const updatePayload: Record<string, any> = {};
        updatePayload[providerField] = providerId;

        if (supabaseAdmin) {
          try {
            await supabaseAdmin.from("registrations").update(updatePayload).eq("id", registration.id);
          } catch (e) {
            console.error("Supabase OAuth linking update failed:", e);
          }
        }

        const dataDir = path.join(process.cwd(), "data");
        const regFilePath = path.join(dataDir, "registrations.json");
        if (fs.existsSync(regFilePath)) {
          try {
            const registrations = JSON.parse(fs.readFileSync(regFilePath, "utf8"));
            const found = registrations.find((item: any) => item.id === registration.id || item.email?.toLowerCase() === userEmail);
            if (found) {
              found[providerField] = providerId;
              fs.mkdirSync(dataDir, { recursive: true });
              fs.writeFileSync(regFilePath, JSON.stringify(registrations, null, 2), "utf8");
            }
          } catch (e) {
            console.error("Fallback OAuth linking update failed:", e);
          }
        }
      }

      return true;
    },
    async session({ session }) {
      const sessionEmail = session.user?.email ? normalizeEmail(session.user.email) : null;

      if (session.user && sessionEmail) {
        let registration: any = null;

        if (supabaseAdmin) {
          try {
            const { data } = await supabaseAdmin
              .from("registrations")
              .select("*")
              .eq("email", sessionEmail)
              .maybeSingle();
            if (data) registration = data;
          } catch (e) {}
        }

        if (!registration) {
          const regFilePath = path.join(process.cwd(), "data", "registrations.json");
          if (fs.existsSync(regFilePath)) {
            try {
              const fileData = fs.readFileSync(regFilePath, "utf8");
              const registrations = JSON.parse(fileData);
              const found = registrations.find(
                (r: any) => r.email && r.email.toLowerCase() === sessionEmail
              );
              if (found) {
                registration = {
                  name: found.name,
                  enrollment_number: found.enrollmentNumber || found.enrollment_number,
                  email: found.email,
                  branch: found.branch || "CS",
                  year_of_study: found.yearOfStudy || found.year_of_study || "1st Year",
                };
              }
            } catch (e) {}
          }
        }

        if (registration) {
          (session.user as any).enrollmentNumber = registration.enrollment_number || registration.enrollmentNumber;
          (session.user as any).branch = registration.branch || "CS";
          (session.user as any).yearOfStudy = registration.year_of_study || "1st Year";
          (session.user as any).role = "student";
          (session.user as any).name = registration.name || session.user.name;
        }
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
    error: "/login",
  }
});

export { handler as GET, handler as POST };
