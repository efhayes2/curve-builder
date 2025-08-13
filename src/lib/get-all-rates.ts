// lib/get-all-rates.ts
import { getTokenDataMap } from "@/lib/utils";
import { Connection } from '@solana/web3.js';
import { getKaminoRates } from './protocols/kamino';
import { getMarginfiRates } from './protocols/marginfi';

export async function getAllRates() {
    const connection = new Connection(process.env.RPC_URL!, 'confirmed');
    const bankData = getTokenDataMap();

    const [marginfiRates, kaminoRates ] = await Promise.all([
        getMarginfiRates(connection, bankData),
        getKaminoRates(connection, bankData),
    ]);

    return [...marginfiRates, ...kaminoRates];
}
