import { RatesTable } from '@/components/rates-table';
import { IconAlertCircle } from '@tabler/icons-react';
import { getAllRates } from '@/lib/get-all-rates';
import { ProtocolDataRow } from '@/lib/types'

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
    try {
        const data = await getAllRates();


        return <RatesTable data={data.filter((r): r is ProtocolDataRow => r !== null)} />
            ;
    } catch (error) {
        console.error('08.05.2025 deployment - Error fetching rates:', error);
        return (
            <div className="flex items-center justify-center">
                <p className="flex items-center gap-1.5 text-destructive">
                    <IconAlertCircle size={20} />
                    08.05.2025 deployment: Failed to load rates. Please try again later.
                </p>
                <pre className="text-xs text-red-500">{JSON.stringify(error, null, 2)}</pre>
            </div>
        );
    }
}
