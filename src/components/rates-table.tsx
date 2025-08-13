'use client'

import { ProtocolDataRow } from '@/lib/types'
import { formatRow, FormattedDataRow } from '@/lib/utils'
import { useMemo, useState } from 'react'
import Image from 'next/image'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type Props = {
  data: ProtocolDataRow[]
}

export const RatesTable = ({ data }: Props) => {
  const [protocolFilter, setProtocolFilter] = useState<string | null>(null)
  const [tokenFilter, setTokenFilter] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<keyof ProtocolDataRow | null>('token')
  const [sortAsc, setSortAsc] = useState(true)

  const filteredData = useMemo(() => {
    return data
        .filter((row) => !protocolFilter || row.protocol === protocolFilter)
        .filter((row) => !tokenFilter || row.token === tokenFilter)
        .filter((row) => !categoryFilter || row.category === categoryFilter)
        .sort((a, b) => {
          if (!sortKey) return 0
          const aVal = a[sortKey]
          const bVal = b[sortKey]
          if (typeof aVal === 'string' && typeof bVal === 'string') {
            return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
          }
          if (typeof aVal === 'number' && typeof bVal === 'number') {
            return sortAsc ? aVal - bVal : bVal - aVal
          }
          return 0
        })
  }, [data, protocolFilter, tokenFilter, categoryFilter, sortKey, sortAsc])

  const formattedData: FormattedDataRow[] = useMemo(() => {
    return filteredData.map(formatRow)
  }, [filteredData])

  const unique = (key: keyof ProtocolDataRow) => [...new Set(data.map(d => d[key]))]

  const toggleSort = (key: keyof ProtocolDataRow) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(true)
    }
  }

  return (
      <div className="space-y-2">
        <div className="flex gap-4">
          <select onChange={(e) => setProtocolFilter(e.target.value || null)} value={protocolFilter ?? ''}>
            <option value="">All Protocols</option>
            {unique('protocol').map((p) => (
                <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select onChange={(e) => setTokenFilter(e.target.value || null)} value={tokenFilter ?? ''}>
            <option value="">All Tokens</option>
            {unique('token').map((t) => (
                <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select onChange={(e) => setCategoryFilter(e.target.value || null)} value={categoryFilter ?? ''}>
            <option value="">All Categories</option>
            {unique('category').map((c) => (
                <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => toggleSort('protocol')} className="cursor-pointer">Protocol</TableHead>
              <TableHead onClick={() => toggleSort('token')} className="cursor-pointer">Token</TableHead>
              <TableHead onClick={() => toggleSort('category')} className="cursor-pointer">Category</TableHead>
              <TableHead>Lending<br />Rate</TableHead>
              <TableHead>Borrow<br />Rate</TableHead>
              <TableHead>Liquidity</TableHead>
              <TableHead>Util</TableHead>
              <TableHead>Target<br />Util</TableHead>
              <TableHead>Plateau<br />Rate</TableHead>
              <TableHead>Max<br />Rate</TableHead>
              <TableHead>Collateral<br />Weight</TableHead>
              <TableHead>Liability<br />Weight</TableHead>
              <TableHead>LTV</TableHead>
              <TableHead>Borrow<br />Cap</TableHead>
              <TableHead>Deposit<br />Cap</TableHead>
              <TableHead>Borrow<br />Fee</TableHead>
              <TableHead>Flash<br />Fee</TableHead>
              <TableHead>Fixed<br />Fee</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {formattedData.map((row) => (
                <TableRow key={`${row.protocol}-${row.token}`}>
                  <TableCell className="font-medium">{row.protocol}</TableCell>
                  <TableCell className="flex items-center gap-2 font-medium">
                    <Image
                        src={`https://storage.googleapis.com/mrgn-public/mrgn-token-icons/${row.token}.png`}
                        alt={row.token}
                        width={20}
                        height={20}
                        className="rounded-full"
                    />
                    {row.token}
                  </TableCell>
                  <TableCell className="text-green-600">{row.category}</TableCell>
                  <TableCell className="text-green-600">{row.lendingRate}</TableCell>
                  <TableCell className="text-yellow-600">{row.borrowingRate}</TableCell>
                  <TableCell>{row.liquidity}</TableCell>
                  <TableCell>{row.currentUtilization}</TableCell>
                  <TableCell>{row.targetUtilization}</TableCell>
                  <TableCell>{row.plateauRate}</TableCell>
                  <TableCell>{row.maxRate}</TableCell>
                  <TableCell>{row.collateralWeight}</TableCell>
                  <TableCell>{row.liabilityWeight}</TableCell>
                  <TableCell>{row.ltv}</TableCell>
                  <TableCell>{row.borrowCap}</TableCell>
                  <TableCell>{row.depositCap}</TableCell>
                  <TableCell>{row.borrowFee}</TableCell>
                  <TableCell>{row.flashLoanFee}</TableCell>
                  <TableCell>{row.fixedHostInterestRate}</TableCell>
                </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
  )
}
