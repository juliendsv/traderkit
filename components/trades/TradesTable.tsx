'use client'

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { Input } from '@/components/ui/input'

export interface TradeTableRow {
  id: string
  pair: string
  side: 'buy' | 'sell'
  amount: number
  price: number
  fee: number
  pnl: number | null
  opened_at: string
  exchange_name?: string
}

const col = createColumnHelper<TradeTableRow>()

const columns = [
  col.accessor('opened_at', {
    header: 'Date',
    cell: (info) => new Date(info.getValue()).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: '2-digit', hour: '2-digit', minute: '2-digit'
    }),
  }),
  col.accessor('pair', {
    header: 'Pair',
    cell: (info) => <span className="font-medium text-white">{info.getValue()}</span>,
  }),
  col.accessor('side', {
    header: 'Side',
    cell: (info) => (
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
        info.getValue() === 'buy'
          ? 'bg-emerald-950 text-emerald-400'
          : 'bg-red-950 text-red-400'
      }`}>
        {info.getValue().toUpperCase()}
      </span>
    ),
  }),
  col.accessor('amount', {
    header: 'Amount',
    cell: (info) => info.getValue().toLocaleString('en-US', { maximumFractionDigits: 8 }),
  }),
  col.accessor('price', {
    header: 'Price',
    cell: (info) => `$${info.getValue().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  }),
  col.accessor('fee', {
    header: 'Fee',
    cell: (info) => (
      <span className="text-zinc-500">
        ${info.getValue().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
      </span>
    ),
  }),
  col.accessor('pnl', {
    header: 'P&L',
    cell: (info) => {
      const v = info.getValue()
      if (v === null) return <span className="text-zinc-600">—</span>
      return (
        <span className={`font-medium tabular-nums ${v >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {v >= 0 ? '+' : ''}${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      )
    },
  }),
]

export function TradesTable({ trades }: { trades: TradeTableRow[] }) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'opened_at', desc: true }])
  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data: trades,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div className="space-y-4">
      <Input
        placeholder="Filter by pair, side..."
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="max-w-xs bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
      />

      <div className="rounded-lg border border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-zinc-800 bg-zinc-900">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider cursor-pointer select-none hover:text-zinc-200"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === 'asc' ? ' ↑' : header.column.getIsSorted() === 'desc' ? ' ↓' : ''}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-zinc-500">
                  No trades found
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-zinc-300">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-zinc-500 text-xs">
        {table.getFilteredRowModel().rows.length} trades
      </p>
    </div>
  )
}
