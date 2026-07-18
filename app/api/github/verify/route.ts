import { NextResponse } from "next/server";
import { completeTaskForEnrollment } from "@/lib/tasks";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { enrollmentNumber, repoUrl } = body || {};
    if (!enrollmentNumber || !repoUrl) {
      return NextResponse.json({ success: false, error: "Enrollment number and repository URL are required." }, { status: 400 });
    }

    let normalized = repoUrl.trim();
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = `https://${normalized}`;
    }

    let url: URL;
    try {
      url = new URL(normalized);
    } catch {
      return NextResponse.json({ success: false, error: "That repository URL does not look valid." }, { status: 400 });
    }

    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length < 2) {
      return NextResponse.json({ success: false, error: "Please provide a GitHub repository URL in the form https://github.com/owner/repo." }, { status: 400 });
    }

    const [, owner, repo] = parts;
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;
    const response = await fetch(apiUrl, {
      headers: { Accept: "application/vnd.github+json" },
    });

    if (!response.ok) {
      return NextResponse.json({ success: false, error: "We could not verify that GitHub repository." }, { status: 404 });
    }

    const repoData = await response.json();
    if (!repoData?.pushed_at) {
      return NextResponse.json({ success: false, error: "That repository does not look like a valid public repository." }, { status: 400 });
    }

    const taskResult = await completeTaskForEnrollment(enrollmentNumber, "push_github", {
      source: "github-repo-verify",
      metadata: { repo_url: url.toString(), repo_name: `${owner}/${repo}` },
    });

    return NextResponse.json({ success: true, verified: true, repository: `${owner}/${repo}`, task: taskResult });
  } catch (error: any) {
    console.error("GitHub repo verification failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
