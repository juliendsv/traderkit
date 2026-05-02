export function BinanceLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Binance"
    >
      <circle cx="16" cy="16" r="16" fill="#F3BA2F" />
      <path
        d="M12.116 14.404L16 10.52l3.886 3.886 2.26-2.26L16 6l-6.144 6.144 2.26 2.26zM6 16l2.26-2.26L10.52 16l-2.26 2.26L6 16zm6.116 1.596L16 21.48l3.886-3.886 2.26 2.259L16 26l-6.144-6.144-.002-.001 2.262-2.259zm9.364-1.596L23.74 16 26 18.26 23.74 20.52 21.48 16zM18.422 16h-.001L16 13.578 14.094 15.483l-.224.224-.459.459L13.578 16l2.423 2.422L18.422 16z"
        fill="#1A1A2E"
      />
    </svg>
  )
}
