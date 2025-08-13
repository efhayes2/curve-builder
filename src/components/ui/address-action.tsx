'use client'

import React from 'react'
import Link from 'next/link'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { IconExternalLink, IconCopy, IconCheck } from '@tabler/icons-react'

import { cn } from '@/lib/utils'

type AddressActionsProps = {
  address: string
  shortAddress?: string
  icon?: React.ReactNode
}

const AddressActions = ({
  address,
  shortAddress,
  icon,
}: AddressActionsProps) => {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 1000)
  }

  return (
    <div className="group flex max-w-fit items-center justify-start gap-2">
      <span className="flex items-center gap-1">
        {icon}
        {shortAddress || address}
      </span>
      <div
        className={cn(
          'flex items-center gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100',
          copied && 'opacity-100'
        )}
      >
        <CopyToClipboard text={address} onCopy={handleCopy}>
          <button className="flex cursor-pointer items-center text-muted-foreground transition-colors hover:text-foreground">
            {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
          </button>
        </CopyToClipboard>
        <Link
          href={`https://solscan.io/address/${address}`}
          className="flex items-center text-muted-foreground transition-colors hover:text-foreground"
          target="_blank"
        >
          <IconExternalLink size={16} />
        </Link>
      </div>
    </div>
  )
}

export { AddressActions }
