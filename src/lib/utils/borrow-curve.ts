// src/utils/borrowCurve.ts
type CurvePoint = [number, number];
type TransformedCurve = { knots: number[]; values: number[] };
type LogDict = Record<string, TransformedCurve>;

function tsMMDDYY_HHMM(date = new Date()) {
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yy = String(date.getFullYear()).slice(2);
    const hh = String(date.getHours()).padStart(2, '0');
    const mi = String(date.getMinutes()).padStart(2, '0');
    return `${mm}${dd}${yy}_${hh}${mi}`;
}

export function transformBorrowCurve(curve: CurvePoint[]): TransformedCurve {
    return {
        knots: curve.map(([k]) => k),
        values: curve.map(([, v]) => v),
    };
}

export async function writeBorrowCurveLog(
    log: LogDict,
    fileBase = 'C:/data/borrowCurves'
) {
    const fs = await import('fs/promises');
    const path = `${fileBase}_${tsMMDDYY_HHMM()}.json`;
    await fs.writeFile(path, JSON.stringify(log, null, 2), 'utf-8');
    console.log(`✅ Borrow curve log written to ${path}`);
}

/**
 * One-liner helper:
 * - Transforms the curve
 * - If debug=true, writes { [token]: transformed } to timestamped file
 * - Returns the transformed curve
 */
export async function logBorrowCurve(
    tokenSymbol: string,
    curve: CurvePoint[],
    opts?: { debug?: boolean; fileBase?: string }
): Promise<TransformedCurve> {
    const transformed = transformBorrowCurve(curve);
    if (opts?.debug) {
        await writeBorrowCurveLog({ [tokenSymbol]: transformed }, opts.fileBase);
    }
    return transformed;
}
