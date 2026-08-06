import Link from "next/link";
import { Button } from "@repo/ui/button";

export default function DocsPage() {
  return (
    <main style={{ padding: "3rem", maxWidth: "720px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem" }}>
        FinanceLens Documentation
      </h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>
        FinanceLens is a full-stack personal finance tracker built with Next.js, NestJS, Prisma, and Supabase.
      </p>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.75rem" }}>
          Architecture
        </h2>
        <ul style={{ listStyle: "disc", paddingLeft: "1.5rem", lineHeight: "1.8" }}>
          <li><strong>Frontend</strong> — Next.js 16 App Router, React 19, ShadcnUI, TanStack Query</li>
          <li><strong>Backend</strong> — NestJS 11, Prisma 7, PostgreSQL, Swagger/OpenAPI</li>
          <li><strong>Auth</strong> — Supabase JWT with cookie-based sessions</li>
          <li><strong>Monorepo</strong> — Turborepo + pnpm workspaces</li>
        </ul>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.75rem" }}>
          Key Resources
        </h2>
        <ul style={{ listStyle: "disc", paddingLeft: "1.5rem", lineHeight: "1.8" }}>
          <li>API Swagger docs: <code>/api/docs</code> (when API is running)</li>
          <li>Backend README: <code>apps/api/README.md</code></li>
          <li>Root README: project overview and quick start</li>
        </ul>
      </section>

      <Link href="/">
        <Button appName="docs">Back to App</Button>
      </Link>
    </main>
  );
}
