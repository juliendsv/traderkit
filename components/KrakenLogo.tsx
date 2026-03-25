interface Props {
  size?: number
}

export function KrakenLogo({ size = 40 }: Props) {
  return <ExchangeLogo domain="kraken.com" name="Kraken" size={size} />
}

interface ExchangeLogoProps {
  domain: string
  name: string
  size?: number
}

export function ExchangeLogo({ domain, name, size = 40 }: ExchangeLogoProps) {
  return (
    <div
      className="rounded-full bg-white flex items-center justify-center overflow-hidden shrink-0"
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
        alt={name}
        width={size}
        height={size}
        className="w-full h-full object-cover rounded-full"
      />
    </div>
  )
}
