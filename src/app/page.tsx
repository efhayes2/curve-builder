// File: src/app/page.tsx
"use client";
import React, { useState } from "react";
import CurveBuilder, { type CurvesResponse } from "@/components/CurveBuilder";

const API_PATH = "/api/curves" as const;

export default function HomePage() {
    const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
    const [data, setData] = useState<CurvesResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function fetchCurves() {
        console.log("fetchCurves: start");  // DEBUG
        debugger;                           // <-- Browser will pause here
        try {
            setStatus("loading");
            setError(null);

            const res = await fetch(API_PATH, { cache: "no-store" });
            console.log("fetchCurves: got res", res.status);

            debugger; // <-- Pause again after response

            if (!res.ok) {
                console.warn(`fetchCurves: non-OK HTTP status ${res.status}`);
                setStatus("error");
                setError(`HTTP ${res.status}`);
                return; // Stop here — no JSON parsing if response failed
            }

            const json = (await res.json()) as CurvesResponse;
            console.log("fetchCurves: json keys", Object.keys(json));

            setData(json);
            setStatus("ok");
        } catch (e: any) {
            console.error("fetchCurves: caught error", e);
            setStatus("error");
            setError(e?.message ?? "Unknown error");
        }
    }

    return (
        <main className="min-h-screen w-full p-6">
            <h1 className="text-center text-3xl font-bold mb-8">Curve Builder</h1>
            <CurveBuilder data={data} status={status} error={error} onRefresh={fetchCurves} />
        </main>
    );
}
