// src/lib/protocols/kamino.ts

import "server-only";
import { getLendingAndBorrowingApys } from "@/lib/utils/kamino-functions";
import { Connection, PublicKey } from "@solana/web3.js";
import { KaminoMarket } from "@kamino-finance/klend-sdk";
import { TokenData } from "@/lib/utils"; // your TokenData
import { transformBorrowCurve /*, writeBorrowCurveLog */ } from "@/lib/utils/borrow-curve";

export type CurveVector = { knots: number[]; values: number[] };
export type CurveEntry = {
    borrowRates: CurveVector;
    lendingRates: CurveVector;
};
export type CurvesResponse = Record<string, CurveEntry>;
export { getKaminoCurves as getKaminoRates };


// Optional: collect per-token borrow curves (already transformed) for logging
const borrowCurveLog: Record<string, { knots: number[]; values: number[] }> = {};

/**
 * Build 0..100 percent knots with a step specified as a FRACTION (e.g., 0.10 => 10% increments).
 * Returns percent knots: [0, 10, 20, ..., 100] for stepFraction=0.10
 */
function makePercentKnots(stepFraction: number): number[] {
    if (stepFraction <= 0 || stepFraction > 1) {
        throw new Error(`Invalid stepFraction=${stepFraction}. Expected (0, 1].`);
    }
    const stepPercent = stepFraction * 100; // e.g., 0.10 -> 10
    const count = Math.floor(100 / stepPercent) + 1;
    return Array.from({ length: count }, (_, i) => +(i * stepPercent).toFixed(2));
}

/**
 * Returns curves keyed like "Kamino_SOL", "Kamino_USDC", ...
 * Each value has { borrowRates: {knots, values}, lendingRates: {knots, values} }.
 *
 * @param connection Solana connection
 * @param tokenData  Record of tokens to include (symbol/address in your TokenData)
 * @param stepFraction step size as FRACTION of 1 (0.02 → 2% steps, 0.10 → 10% steps)
 */
export async function getKaminoCurves(
    connection: Connection,
    tokenData: Record<string, TokenData>,
    stepFraction: number = 0.02
): Promise<CurvesResponse> {
    try {
        const kaminoMarket = await KaminoMarket.load(
            connection,
            new PublicKey("7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF"),
            400
        );

        if (!kaminoMarket) {
            console.warn("KaminoMarket returned null or undefined.");
            return {};
        }

        await kaminoMarket.loadReserves();

        const knotsPercent = makePercentKnots(stepFraction);
        const out: CurvesResponse = {};

        for (const [, metadata] of Object.entries(tokenData)) {
            try {
                const mint = new PublicKey(metadata.tokenAddress);
                const k = kaminoMarket.getReserveByMint(mint);
                if (!k) {
                    console.warn(`No reserve for mint ${metadata.tokenSymbol}`);
                    continue; // skip to next token
                }


                // ---- Optional: capture/transform the on-chain borrow curve for logs
                const stats = k.stats;
                const borrowCurveRaw = stats.borrowCurve; // [number, number][]
                borrowCurveLog[metadata.tokenSymbol] = transformBorrowCurve(borrowCurveRaw);

                // ---- Minimal wrapped data needed for your APY calculator
                const protocolTakeRatePct = k.state.config.protocolTakeRatePct;
                const borrowRateCurvePoints = k.state.config.borrowRateCurve.points;
                const slotAdjustmentFactor = k.slotAdjustmentFactor();
                const fixedHostInterestRate = k.getFixedHostInterestRate().toNumber();

                const wrappedReserveData = {
                    protocolTakeRatePct,
                    borrowRateCurvePoints,
                    slotAdjustmentFactor,
                    fixedHostInterestRate,
                };

                // ---- Compute lend/borrow vectors over the knots
                const lendingValues: number[] = [];
                const borrowValues: number[] = [];

                for (const knotPercent of knotsPercent) {
                    const u = knotPercent / 100; // convert percent → fraction 0..1
                    const [lendApy, borrowApy] = getLendingAndBorrowingApys(wrappedReserveData, u);
                    lendingValues.push(lendApy);
                    borrowValues.push(borrowApy);
                }

                const key = `Kamino_${metadata.tokenSymbol}`;
                out[key] = {
                    lendingRates: { knots: knotsPercent, values: lendingValues },
                    borrowRates: { knots: knotsPercent, values: borrowValues },
                };
            } catch (err) {
                console.warn(`Skipping ${metadata.tokenSymbol}:`, err);

            }
        }

        // If you want to log the transformed borrow curves locally:
        // if (process.env.VERCEL !== "1" && process.env.NODE_ENV !== "production") {
        //   await writeBorrowCurveLog(borrowCurveLog);
        // }

        return out;
    } catch (err) {
        console.error("Failed to get Kamino curves:", err);
        return {};
    }
}
