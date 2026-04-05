// app/about/page.tsx
//
// This is a SERVER component — no "use client" directive.
// Server components run on the server, generate static HTML, and send it
// to the browser already rendered. They cannot use React hooks (useState,
// useEffect, etc.) because there is no browser context during rendering.
//
// The AboutBox is a perfect SSR candidate: it displays static biographical
// content that never changes based on user interaction, making it ideal for
// SEO and fast initial page load.
//
// Citation: Bootstrap About Box pattern adapted from
// https://getbootstrap.com/docs/5.3/examples/album/
// (Bootstrap v5.3 - MIT License, https://github.com/twbs/bootstrap)

import Link from "next/link";
import NavBar from "@/app/components/NavBar";

export default function AboutPage() {
  return (
    <>
      <NavBar />
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card shadow">
              <div
                className="card-header text-white text-center py-4"
                style={{ backgroundColor: "#1a1a2e" }}
              >
                <h2 className="mb-0 fw-bold">About My Music App</h2>
              </div>
              <div className="card-body text-center p-5">
                <div
                  className="rounded-circle bg-secondary d-flex align-items-center justify-content-center mx-auto mb-4"
                  style={{ width: "100px", height: "100px", fontSize: "2.5rem" }}
                >
                  🎵
                </div>
                <h3 className="card-title fw-bold">Luke Morton</h3>
                <p className="text-muted fst-italic mb-3">Boss &amp; Lead Developer</p>
                <p className="card-text">
                  Welcome to Luke Morton&apos;s Music App — a full-stack Next.js
                  application that lets you browse, search, create, and edit
                  your personal music album collection.
                </p>
                <hr />
                <p className="card-text text-muted small">
                  Built with Next.js, TypeScript, Bootstrap, and PostgreSQL as
                  part of the CST-391 course at Grand Canyon University.
                </p>
                <Link href="/" className="btn btn-primary mt-3">
                  Home
                </Link>
              </div>
              <div className="card-footer text-center text-muted small py-2">
                CST-391 Activity 5 &mdash; React to Next.js Migration
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
