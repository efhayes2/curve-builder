import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export type Environment = "production" | "staging";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import { ProtocolDataRow } from "@/lib/types";

export type FormattedDataRow = { [K in keyof ProtocolDataRow]: string };

export function formatRow(row: ProtocolDataRow): FormattedDataRow {
    const safeNumber = (val: number | string) =>
        isNaN(Number(val)) ? "-" : Number(val);

    const formatPercent = (val: number | string, decimals = 1) =>
        isNaN(Number(val)) ? "-" : `${(Number(val) * 100).toFixed(decimals)}%`;

    const formatFixed = (val: number | string, decimals = 2) =>
        isNaN(Number(val)) ? "-" : Number(val).toFixed(decimals);


    const formatCompactNumber = (val: number | string): string => {
        const num = safeNumber(val);
        if (num === "-") return "-";

        if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}m`;
        if (num >= 100_000) return `${Math.round(num / 1_000)}k`;
        if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
        return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
    };

    return {
        protocol: row.protocol,
        token: row.token,
        category: row.category,
        liquidity: formatCompactNumber(row.liquidity),
        currentUtilization: formatPercent(row.currentUtilization),
        targetUtilization: formatPercent(row.targetUtilization),
        plateauRate: formatPercent(row.plateauRate, 2),
        maxRate: formatPercent(row.maxRate, 0),
        lendingRate: formatPercent(row.lendingRate, 2),
        borrowingRate: formatPercent(row.borrowingRate, 2),
        collateralWeight: formatPercent(row.collateralWeight, 0),
        liabilityWeight: formatFixed(row.liabilityWeight, 2),
        ltv: formatPercent(row.ltv, 0),
        borrowCap: formatCompactNumber(row.borrowCap),
        depositCap: isNaN(Number(row.depositCap))
            ? String(row.depositCap)
            : formatCompactNumber(row.depositCap),
        borrowFee: formatPercent(row.borrowFee, 1),
        flashLoanFee: formatPercent(row.flashLoanFee, 3),
        fixedHostInterestRate: formatPercent(row.fixedHostInterestRate, 1),
    };
}


export type TokenData = {
    category: string;
    tokenAddress: string;
    tokenSymbol: string;
};


export function getTokenDataMap(): Record<string, TokenData> {
    const useFullTable = true;
    if (useFullTable)
        return getTokenDataMapFull();
    return getTokenDataMapPartial();

}

export function getTokenDataMapFull(): Record<string, TokenData> {

    return {
        "CCKtUs6Cgwo4aaQUmBPmyoApH2gUDErxNZCAntD6LYGh": {
            category: "LST",
            tokenAddress: "So11111111111111111111111111111111111111112",
            tokenSymbol: "SOL",
        },
        "2s37akK2eyBbp8DZgCm7RtsaEz8eJP3Nxd4urLHQv7yB": {
            category: "Stable",
            tokenAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            tokenSymbol: "USDC",
        },
        "Dj2CwMF3GM7mMT5hcyGXKuYSQ2kQ5zaVCkA1zX1qaTva": {
            category: "Stable",
            tokenAddress: "2u1tszSeqZ3qBWF3uNGPFc8TzMk2tdiwknnRMWGWjGWH",
            tokenSymbol: "USDG",
        },
        "FDsf8sj6SoV313qrA91yms3u5b3P4hBxEPvanVs8LtJV": {
            category: "Stable",
            tokenAddress: "USDSwr9ApdHk5bvJKMjzff41FfuX8bSxdKcR81vTwcA",
            tokenSymbol: "USDS",
        },
        "8UEiPmgZHXXEDrqLS3oiTxQxTbeYTtPbeMBxAd2XGbpu": {
            category: "Stable",
            tokenAddress: "2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo",
            tokenSymbol: "PYUSD",
        },
        "GJCi1uj3kYPZ64puA5sLUiCQfFapxT2xnREzrbDzFkYY": {
            category: "LST",
            tokenAddress: "he1iusmfkpAdwvxLNGV8Y1iSbj4rUy6yMhEA3fotn9A",
            tokenSymbol: "hSOL",
        },
        "8LaUZadNqtzuCG7iCvZd7d5cbquuYfv19KjAg6GPuuCb": {
            category: "LST",
            tokenAddress: "jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjx93v",
            tokenSymbol: "jupSOL",
        },
        "BeNBJrAh1tZg5sqgt8D6AWKJLD5KkBrfZvtcgd7EuiAR": {
            category: "Stable",
            tokenAddress: "7kbnvuGBxxj8AG9qp8Scn56muWGaRaFqxg1FsRp3PaFT",
            tokenSymbol: "UXD",
        },
        "HmpMfL8942u22htC4EMiWgLX931g3sacXFR6KjuLgKLV": {
            category: "Stable",
            tokenAddress: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
            tokenSymbol: "USDT",
        },
        "22DcjMZrMwC5Bpa5AGBsmjc5V9VuQrXG6N9ZtdUNyYGE": {
            category: "LST",
            tokenAddress: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
            tokenSymbol: "mSOL",
        },
        "DMoqjmsuoru986HgfjqrKEvPv8YBufvBGADHUonkadC5": {
            category: "LST",
            tokenAddress: "LSTxxxnJzKDFSLr4dUkPcmCf5VyryEqzPLz5j4bpxFp",
            tokenSymbol: "LST",
        },
        "Bohoc1ikHLD7xKJuzTyiTyCwzaL5N7ggJQu75A8mKYM8": {
            category: "LST",
            tokenAddress: "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn",
            tokenSymbol: "JitoSOL",
        },
        "NA": {
            category: "LST",
            tokenAddress: "sctmB7GPi5L2Q5G9tUSzXvhZ4YiDMEGcRov9KfArQpx",
            tokenSymbol: "dfdvSOL",
        },
    };
}

export function getTokenDataMapPartial(): Record<string, TokenData> {
    return {
        "2s37akK2eyBbp8DZgCm7RtsaEz8eJP3Nxd4urLHQv7yB": {
            category: "Stable",
            tokenAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            tokenSymbol: "USDC",
        },
        "CCKtUs6Cgwo4aaQUmBPmyoApH2gUDErxNZCAntD6LYGh": {
            category: "LST",
            tokenAddress: "So11111111111111111111111111111111111111112",
            tokenSymbol: "SOL",
        },
    };
}

// "NA": {
//     category: "LST",
//         tokenAddress: "sctmB7GPi5L2Q5G9tUSzXvhZ4YiDMEGcRov9KfArQpx",
//         tokenSymbol: "dfdvSOL",
// },


// utils/borrowCurve.ts
export function transformBorrowCurve(curve: [number, number][]) {
    return {
        knots: curve.map(([k]) => k),
        values: curve.map(([, v]) => v),
    };
}

