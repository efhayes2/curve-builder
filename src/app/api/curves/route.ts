// File: src/app/api/curves/route.ts
import { NextResponse } from "next/server";
import { Connection } from "@solana/web3.js";
import { getTokenDataMap } from "@/lib/utils";
import { getKaminoRates } from "@/lib/protocols/kamino"; // alias of getKaminoCurves

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const stepStr = url.searchParams.get("step"); // optional: ?step=0.10 → 10% increments
        const step = stepStr ? Number(stepStr) : undefined;

        const rpcUrl = process.env.RPC_URL;
        if (!rpcUrl) {
            return NextResponse.json({ error: "RPC_URL is not set" }, { status: 500 });
        }

        const connection = new Connection(rpcUrl, "confirmed");
        const tokenData = getTokenDataMap();

        // Kamino only for now; merge Marginfi later if desired.
        const curves = await getKaminoRates(connection, tokenData, step);

        // curves: Record<string, { borrowRates:{knots,values}, lendingRates:{knots,values} }>
        return NextResponse.json(curves, { status: 200 });
    } catch (error: any) {
        console.error("Failed to load protocol curves:", error);
        return NextResponse.json(
            { error: error?.message ?? "Failed to fetch curves" },
            { status: 500 }
        );
    }
}
