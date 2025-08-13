import { Connection } from '@solana/web3.js'
import { getTokenDataMap } from '@/lib/utils'
import { getKaminoRates } from '@/lib/protocols/kamino'
import { getMarginfiRates } from '@/lib/protocols/marginfi'
import {ProtocolDataRow} from "@/lib/types";

export async function GET() {
    try {
        const connection = new Connection(process.env.RPC_URL!, 'confirmed')
        const bankData = getTokenDataMap()

        const [kaminoRates, marginfiRates] = await Promise.all([
            getKaminoRates(connection, bankData),
            getMarginfiRates(connection, bankData),
        ])

        const allRates: ProtocolDataRow[] = [...kaminoRates, ...marginfiRates];
        return Response.json(allRates);
    } catch (error) {
        console.error('Failed to load protocol rates:', error)
        return new Response(JSON.stringify({ error: 'Failed to fetch rates' }), {
            status: 500,
        })
    }
}
