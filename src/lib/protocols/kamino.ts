// src/lib/protocols/kamino.ts

import { getLendingAndBorrowingApys} from '@/lib/utils/kamino-functions'
import { optimalUtilizationMap, mfiDefaultOptimal } from '@/lib/utils/shared-data';
import { Connection, PublicKey } from '@solana/web3.js'
import { KaminoMarket } from '@kamino-finance/klend-sdk'
import { ProtocolDataRow } from '@/lib/types'
import { TokenData } from '@/lib/utils' // where your TokenData lives
import { transformBorrowCurve, writeBorrowCurveLog } from '@/lib/utils/borrow-curve'




// // Placeholder for target values (if you later read targets from SDK, plug them in here)
// function getKaminoTargets() {
//     return {
//         optimalUtilization: '-',
//         plateauInterestRate: '-',
//         maxInterestRate: '-',
//     }
// }


// Collect per-token curves already transformed to {knots, values}
const borrowCurveLog: Record<string, { knots: number[]; values: number[] }> = {}


export async function getKaminoRates(
    connection: Connection,
    tokenData: Record<string, TokenData>
): Promise<ProtocolDataRow[]> {
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
        const currentSlot = await connection.getSlot()

        const rates = Object.entries(tokenData)
            .map(([, metadata]) => {
                try {
                    const mint = new PublicKey(metadata.tokenAddress)
                    const k = kaminoMarket.getReserveByMint(mint)
                    if (!k) throw new Error('No reserve for mint')

                    // ---- Safe conversions (avoid BN > 53-bit toNumber) ----
                    const mintFactor = Number(k.getMintFactor().toString())
                    if (!mintFactor || mintFactor === 0) throw new Error('Invalid mint factor')

                    const borrowed = Number(k.getBorrowedAmount().toString()) / mintFactor
                    const total = Number(k.getTotalSupply().toString()) / mintFactor
                    const liquidity_ = total - borrowed
                    const utilization = k.calculateUtilizationRatio()

                    const stats = k.stats
                    const assetWeight = stats.loanToValue
                    const liabilityWeight_ = stats.borrowFactor / 100.0
                    const ltv_ = 1.0 / liabilityWeight_

                    const numberString = stats.reserveDepositLimit.toString();
                    const depositLimit = Number(numberString) / mintFactor
                    const numberString2 = stats.reserveBorrowLimit.toString();
                    const borrowLimit = Number(numberString2) / mintFactor;


                    // ---- Borrow curve logging (transform at assignment) ----
                    const borrowCurve = stats.borrowCurve // [number, number][]
                    const borrowRateCurvePoints = k.state.config.borrowRateCurve.points
                    borrowCurveLog[metadata.tokenSymbol] = transformBorrowCurve(borrowCurve)
                    // const referralFeeBps = kaminoMarket.state.referralFeeBps;
                    const protocolTakeRatePct = k.state.config.protocolTakeRatePct;
                    const slotAdjustmentFactor = k.slotAdjustmentFactor();
                    const fixedHostInterestRate =  k.getFixedHostInterestRate().toNumber()

                    const wrappedReserveData = {
                        protocolTakeRatePct,
                        borrowRateCurvePoints,
                        slotAdjustmentFactor,
                        fixedHostInterestRate
                    };

                    // ---- Calculate rates ---- Replication
                    /*const z_apr =  calculateSupplyAPR(wrappedReserveData, utilization);
                    const lendingApy1 = calculateAPYFromAPR(z_apr);
                    const z_borrowApr = calculateBorrowAPR(wrappedReserveData, utilization);
                    const borrowApy1 = calculateAPYFromAPR(z_borrowApr);

                    const { lendingApy, borrowApy } = getLendingAndBorrowingApys(wrappedReserveData, utilization);*/

                    const {borrowApy: maxBorrowApy } =
                        getLendingAndBorrowingApys(wrappedReserveData, 1.0);

                    const marginfiOptimal = optimalUtilizationMap[metadata.tokenSymbol] ?? mfiDefaultOptimal;

                    const {borrowApy: borrowApyAtMarginfiOptimal } =
                        getLendingAndBorrowingApys(wrappedReserveData, marginfiOptimal);


                    const lendingRate_ = k.totalSupplyAPY(currentSlot);
                    const borrowingRate_ = k.totalBorrowAPY(currentSlot);


                    // const kaminoTargets = getKaminoTargets()

                    const rate: ProtocolDataRow = {
                        "protocol": 'Kamino',
                        "token": metadata.tokenSymbol,
                        "category": metadata.category,
                        "liquidity": liquidity_,
                        "currentUtilization": utilization,
                        "targetUtilization": marginfiOptimal,
                        "plateauRate": borrowApyAtMarginfiOptimal,
                        "maxRate": maxBorrowApy,
                        "lendingRate": lendingRate_,
                        "borrowingRate": borrowingRate_,
                        "collateralWeight": assetWeight,
                        "liabilityWeight": liabilityWeight_,
                        "ltv": ltv_,
                        "borrowCap": borrowLimit,
                        "depositCap": depositLimit,
                        "flashLoanFee": k.getFlashLoanFee().toNumber(),
                        "fixedHostInterestRate": k.getFixedHostInterestRate().toNumber(),
                        "borrowFee": k.getBorrowFee().toNumber(),
                    }

                    // Normalize undefined/nulls to NaN for downstream formatting
                    for (const [key, value] of Object.entries(rate)) {
                        if (value === undefined || value === null) {
                            // @ts-expect-error dynamic assignment
                            rate[key] = NaN
                        }
                    }

                    return rate
                } catch (err) {
                    console.warn(`Skipping ${metadata.tokenSymbol}:`, err)
                    return null
                }
            })
            .filter((r): r is ProtocolDataRow => r !== null)
            .sort((a, b) => {
                const cat = a.category.localeCompare(b.category)
                return cat !== 0 ? cat : a.token.localeCompare(b.token)
            })

        // Write once per run (timestamped file)
        // Only write locally (skip in Vercel or production)
        if (process.env.VERCEL !== '1' && process.env.NODE_ENV !== 'production') {
            await writeBorrowCurveLog(borrowCurveLog);
        }


        return rates
    } catch (err) {
        console.error('Failed to get Kamino rates:', err)
        return []
    }
}
