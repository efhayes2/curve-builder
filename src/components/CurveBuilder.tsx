// File: src/components/CurveBuilder.tsx
"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

export type CurveVector = { knots: number[]; values: number[] };
export type CurveEntry  = { borrowRates: CurveVector; lendingRates: CurveVector };
export type CurvesResponse = Record<string, CurveEntry>;

function parseKey(key: string) {
    const i = key.indexOf("_");
    return i === -1 ? { protocol: key, token: "" } : { protocol: key.slice(0, i), token: key.slice(i + 1) };
}
const buildKey = (protocol: string, token: string) => `${protocol}_${token}`;

export default function CurveBuilder({
                                         data, status, error, onRefresh,
                                     }: {
    data: CurvesResponse | null;
    status: "idle" | "loading" | "ok" | "error";
    error: string | null;
    onRefresh: () => void;
}) {
    // Selections
    const [p1, setP1] = useState("Kamino");
    const [t1, setT1] = useState("SOL");
    const [p2, setP2] = useState("Kamino");
    const [t2, setT2] = useState("USDC");

    // Range (%)
    const [lower, setLower] = useState(0);
    const [upper, setUpper] = useState(100);

    // Draw gate
    const [shouldDraw, setShouldDraw] = useState(false);

    // Seed defaults when data refreshes
    useEffect(() => {
        if (!data) {
            console.log("useEffect: no data yet (waiting for refresh)");
            return;
        }
        const keys = Object.keys(data);
        if (!keys.length) {
            console.warn("useEffect: data object has no keys");
            return;
        }
        const a = parseKey(keys[0]); setP1(a.protocol); setT1(a.token);
        if (keys[1]) { const b = parseKey(keys[1]); setP2(b.protocol); setT2(b.token); }
        setShouldDraw(false);
        console.log("useEffect: seeded selections from data", { p1: a.protocol, t1: a.token, p2, t2 });
    }, [data]);

    // Options
    const protocols = useMemo(() => {
        if (!data) return [] as string[];
        const set = new Set<string>();
        Object.keys(data).forEach((k) => set.add(parseKey(k).protocol));
        const arr = Array.from(set).sort();
        console.log("protocols", arr);
        return arr;
    }, [data]);

    const tokensByProtocol = useMemo(() => {
        const map = new Map<string, Set<string>>();
        if (data) {
            for (const key of Object.keys(data)) {
                const { protocol, token } = parseKey(key);
                if (!map.has(protocol)) map.set(protocol, new Set());
                map.get(protocol)!.add(token);
            }
        }
        const out = new Map<string, string[]>();
        for (const [proto, set] of map) out.set(proto, Array.from(set).sort());
        console.log("tokensByProtocol", Object.fromEntries(Array.from(out.entries())));
        return out;
    }, [data]);

    const key1 = buildKey(p1, t1);
    const key2 = buildKey(p2, t2);

    // Build rows for Recharts (normalize knots if they’re 0..1; drop invalid values)
    const chartData = useMemo(() => {
        console.log("chartData: recompute", { key1, key2, lower, upper, hasData: !!data });
        if (!data) return [] as any[];

        const normalize = (v: number[]) => {
            if (!v.length) return v;
            const max = Math.max(...v);
            const scale = max <= 1.5 ? 100 : 1; // treat <=1.5 as 0..1 fractions
            return v.map((n) => +(n * scale).toFixed(2));
        };

        const isNum = (x: any) => Number.isFinite(Number(x));

        const addSeries = (entry?: CurveEntry) => {
            if (!entry) return [] as { x: number; yBorrow: number; yLend: number }[];
            const knots = normalize(entry.lendingRates.knots);
            const out: { x: number; yBorrow: number; yLend: number }[] = [];
            const len = Math.min(knots.length, entry.borrowRates.values.length, entry.lendingRates.values.length);
            for (let i = 0; i < len; i++) {
                const x = knots[i];
                const yBorrow = Number(entry.borrowRates.values[i]);
                const yLend = Number(entry.lendingRates.values[i]);
                if (!isNum(x) || !isNum(yBorrow) || !isNum(yLend)) continue;
                if (x < lower || x > upper) continue;
                out.push({ x: Number(x), yBorrow, yLend });
            }
            return out;
        };

        const a = addSeries(data[key1]);
        const b = addSeries(data[key2]);

        const byX = new Map<number, any>();
        for (const p of a) byX.set(+p.x.toFixed(2), { x: +p.x.toFixed(2), aBorrow: p.yBorrow, aLend: p.yLend });
        for (const p of b) {
            const k = +p.x.toFixed(2);
            const cur = byX.get(k) || { x: k };
            byX.set(k, { ...cur, bBorrow: p.yBorrow, bLend: p.yLend });
        }

        const rows = Array.from(byX.values()).sort((m, n) => m.x - n.x);
        console.log("chartData: rows[0..4]", rows.slice(0, 5));
        console.log("chartData: len", rows.length);
        return rows;
    }, [data, key1, key2, lower, upper]);

    const chartKey = `${key1}|${key2}|${lower}-${upper}|${shouldDraw}`;

    // @ts-ignore
    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT: Controls + Chart */}
                <section className="lg:col-span-2 space-y-6">
                    <h2 className="text-2xl font-semibold">Curve Builder</h2>

                    {/* Selectors */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        <label className="text-sm">Protocol 1
                            <select
                                value={p1}
                                onChange={(e) => setP1(e.target.value)}
                                className="block w-full border rounded-lg px-2 py-1 mt-1"
                            >
                                {protocols.map((p) => (<option key={p} value={p}>{p}</option>))}
                            </select>
                        </label>

                        <label className="text-sm">Token 1
                            <select
                                value={t1}
                                onChange={(e) => setT1(e.target.value)}
                                className="block w-full border rounded-lg px-2 py-1 mt-1"
                            >
                                {(tokensByProtocol.get(p1) ?? ["SOL", "USDC"]).map((t) => (<option key={t} value={t}>{t}</option>))}
                            </select>
                        </label>

                        <label className="text-sm">Protocol 2
                            <select
                                value={p2}
                                onChange={(e) => setP2(e.target.value)}
                                className="block w-full border rounded-lg px-2 py-1 mt-1"
                            >
                                {protocols.map((p) => (<option key={p} value={p}>{p}</option>))}
                            </select>
                        </label>

                        <label className="text-sm">Token 2
                            <select
                                value={t2}
                                onChange={(e) => setT2(e.target.value)}
                                className="block w-full border rounded-lg px-2 py-1 mt-1"
                            >
                                {(tokensByProtocol.get(p2) ?? ["SOL", "USDC"]).map((t) => (<option key={t} value={t}>{t}</option>))}
                            </select>
                        </label>
                    </div>

                    {/* Draw controls */}
                    <div className="flex flex-wrap items-end gap-4">
                        <button
                            type="button"
                            onClick={() => {
                                console.log("Draw clicked", { key1, key2, lower, upper, status, hasData: !!data });
                                // setShouldDraw((v) => !v);
                                setShouldDraw(true); // toggle to force rerender if you click again
                            }}
                            className="px-4 py-2 rounded-xl border bg-blue-600 text-white hover:bg-blue-700"
                        >
                            {shouldDraw ? "Redraw" : "Draw Graph"}
                        </button>

                        <label className="text-sm">Lower Limit (%)
                            <input
                                type="number" step={0.1} min={0} max={100} value={lower}
                                onChange={(e) => setLower(Math.min(upper, Math.max(0, Number(e.target.value))))}
                                className="block w-28 border rounded-lg px-2 py-1 mt-1"
                            />
                        </label>

                        <label className="text-sm">Upper Limit (%)
                            <input
                                type="number" step={0.1} min={0} max={100} value={upper}
                                onChange={(e) => setUpper(Math.max(lower, Math.min(100, Number(e.target.value))))}
                                className="block w-28 border rounded-lg px-2 py-1 mt-1"
                            />
                        </label>
                    </div>

                    {/* Sliders */}
                    <div className="flex items-center gap-3">
                        <input
                            type="range" min={0} max={100} step={0.1} value={lower}
                            onChange={(e) => setLower(Math.min(Number(e.target.value), upper))}
                            className="w-full"
                        />
                        <input
                            type="range" min={0} max={100} step={0.1} value={upper}
                            onChange={(e) => setUpper(Math.max(Number(e.target.value), lower))}
                            className="w-full"
                        />
                    </div>

                    {/* Chart */}
                    <div className="h-[420px] border rounded-2xl p-3">
                        {shouldDraw && status === "ok" && data && chartData.length > 0 ? (
                            <>
                                {/* debug: show container size */}
                                <div className="mb-2 text-xs text-gray-600">
                                    (chart rows: {chartData.length})
                                </div>

                                {/* TEMP 1: give the chart a fixed size to bypass ResponsiveContainer */}
                                <div style={{ width: 820, height: 380, outline: "2px dashed #999" }}>
                                    <LineChart
                                        width={820}               // <-- add this
                                        height={380}              // <-- and this
                                        data={chartData}
                                        margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="x"
                                            type="number"
                                            domain={[lower, upper]}
                                            tickFormatter={(v) => `${Number(v).toFixed(1)}%`}
                                            allowDataOverflow
                                        />
                                        <YAxis
                                            tickFormatter={(v) => `${Number(v).toFixed(1)}%`}
                                            domain={["auto", "auto"]}
                                        />
                                        <Tooltip
                                            formatter={(v: any) => `${Number(v).toFixed(2)}%`}
                                            labelFormatter={(l: any) => `${Number(l).toFixed(1)}%`}
                                        />
                                        <Legend />
                                        <Line type="monotone" dataKey="aBorrow" name={`${p1} ${t1} Borrow`} stroke="#2563eb" strokeWidth={2} dot={false} isAnimationActive={false} />
                                        <Line type="monotone" dataKey="aLend"   name={`${p1} ${t1} Lend`}   stroke="#2563eb" strokeWidth={2.4} dot={false} isAnimationActive={false} />
                                        <Line type="monotone" dataKey="bBorrow" name={`${p2} ${t2} Borrow`} stroke="#dc2626" strokeWidth={2} dot={false} isAnimationActive={false} />
                                        <Line type="monotone" dataKey="bLend"   name={`${p2} ${t2} Lend`}   stroke="#dc2626" strokeWidth={2.4} dot={false} isAnimationActive={false} />
                                    </LineChart>
                                </div>

                                {/* TEMP 2: once you confirm the fixed-size chart shows, swap this back in and remove the fixed block above
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
        >
          ...
        </LineChart>
      </ResponsiveContainer>
      */}
                            </>
                        ) : (
                            <div className="h-full grid place-items-center text-sm text-gray-600">
                                {status === "idle" && <span>Click "Refresh Rates Query" to load curves.</span>}
                                {status === "loading" && <span>Loading…</span>}
                                {status === "ok" && !shouldDraw && <span>Data ready. Click "Draw Graph".</span>}
                                {status === "ok" && shouldDraw && chartData.length === 0 && (
                                    <span>No points in selected range. Try LL=0, UL=100.</span>
                                )}
                                {status === "error" && <span className="text-red-600">{error ?? "Error"}</span>}
                            </div>
                        )}
                    </div>
                </section>

                {/* RIGHT: Refresh */}
                <aside className="lg:col-span-1">
                    <div className="sticky top-6 space-y-3 p-4 border rounded-2xl">
                        <button
                            onClick={() => {
                                console.log("Refresh clicked");
                                onRefresh();
                            }}
                            disabled={status === "loading"}
                            className="w-full px-4 py-2 rounded-xl border bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                            {status === "loading" ? "Fetching…" : "Refresh Rates Query"}
                        </button>
                        {status === "ok" && <p className="text-green-700 text-sm">data received</p>}
                        {status === "error" && <p className="text-red-600 text-sm">{error ?? "Error"}</p>}
                    </div>
                </aside>
            </div>

            {/* Debug footer at absolute page bottom */}
            <div className="mt-4 text-xs text-gray-600">
                rows: {chartData.length} · key1: {key1} · key2: {key2} · x-preview: {chartData
                .slice(0, 5)
                .map((p: any) => p.x)
                .join(", ")}
            </div>
        </>
    );
}
