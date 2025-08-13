// src/lib/protocols/kamino.ts

import { getLendingAndBorrowingApys} from '@/lib/utils/kamino-functions'
import { Connection, PublicKey } from '@solana/web3.js'
import { KaminoMarket } from '@kamino-finance/klend-sdk'
import { TokenData } from '@/lib/utils' // where your TokenData lives
import { transformBorrowCurve, writeBorrowCurveLog } from '@/lib/utils/borrow-curve'


// Collect per-token curves already transformed to {knots, values}
const borrowCurveLog: Record<string, { knots: number[]; values: number[] }> = {}


export async function getKaminoRates(
    connection: Connection,
    tokenData: Record<string, TokenData>
): Promise<any> {
    try {
        const kaminoMarket = await KaminoMarket.load(
            connection,
            new PublicKey('7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF'),
            400
        )

        if (!kaminoMarket) {
            console.warn('KaminoMarket returned null or undefined.')
            return []
        }

        await kaminoMarket.loadReserves()
        //const currentSlot = await connection.getSlot()

        const rates = Object.entries(tokenData)
            .map(([, metadata]) => {
                try {
                    const mint = new PublicKey(metadata.tokenAddress)
                    const k = kaminoMarket.getReserveByMint(mint)
                    if (!k) throw new Error('No reserve for mint')

                    // ---- Safe conversions (avoid BN > 53-bit toNumber) ----
                    const mintFactor = Number(k.getMintFactor().toString())
                    if (!mintFactor || mintFactor === 0) throw new Error('Invalid mint factor')

                    // const utilization = k.calculateUtilizationRatio()
                    const stats = k.stats


                    // ---- Borrow curve logging (transform at assignment) ----
                    const borrowCurve = stats.borrowCurve // [number, number][]
                    const borrowRateCurvePoints = k.state.config.borrowRateCurve.points
                    borrowCurveLog[metadata.tokenSymbol] = transformBorrowCurve(borrowCurve)

                    const protocolTakeRatePct = k.state.config.protocolTakeRatePct;
                    const slotAdjustmentFactor = k.slotAdjustmentFactor();
                    const fixedHostInterestRate =  k.getFixedHostInterestRate().toNumber()

                    const wrappedReserveData = {
                        protocolTakeRatePct,
                        borrowRateCurvePoints,
                        slotAdjustmentFactor,
                        fixedHostInterestRate
                    };

                    const step = 0.10;
                    const arr = Array.from({ length: Math.floor(1 / step) + 1 },
                        (_, i) => +(i * step).toFixed(2));

// Initialize the dictionaries
                    const lendingRates: Record<number, number> = {};
                    const borrowRates: Record<number, number> = {};

                    arr.forEach(arrayVal => {
                        const [val1, val2] = getLendingAndBorrowingApys(wrappedReserveData, arrayVal);
                        lendingRates[arrayVal] = val1;
                        borrowRates[arrayVal] = val2;
                    });

                    console.log(lendingRates);
                    console.log(borrowRates);
                    //const lendingRate_ = k.totalSupplyAPY(currentSlot);
                    //const borrowingRate_ = k.totalBorrowAPY(currentSlot);


                    // const rate: ProtocolDataRow = {
                    //     "protocol": 'Kamino',
                    //     "token": metadata.tokenSymbol,
                    //     "currentUtilization": utilization,
                    //     "lendingRate": lendingRate_,
                    //     "borrowingRate": borrowingRate_,
                    // }

                    // // Normalize undefined/nulls to NaN for downstream formatting
                    // for (const [key, value] of Object.entries(rate)) {
                    //     if (value === undefined || value === null) {
                    //         // @ts-expect-error dynamic assignment
                    //         rate[key] = NaN
                    //     }
                    // }

                    return null
                } catch (err) {
                    console.warn(`Skipping ${metadata.tokenSymbol}:`, err)
                    return null
                }
            })
            // .filter((r): r is ProtocolDataRow => r !== null)
            // .sort((a, b) => {
            //     const cat = a.category.localeCompare(b.category)
            //     return cat !== 0 ? cat : a.token.localeCompare(b.token)
            // })

        // Write once per run (timestamped file)
        // Only write locally (skip in Vercel or production)
        if (process.env.VERCEL !== '1' && process.env.NODE_ENV !== 'production') {
            await writeBorrowCurveLog(borrowCurveLog);
        }
    } catch (err) {
        console.error('Failed to get Kamino rates:', err)
        return []
    }
}
