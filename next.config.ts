import createMDX from '@next/mdx'
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  serverExternalPackages: ['ccxt'],
  cacheComponents: true,
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
}

const withMDX = createMDX({
  options: {
    // Turbopack requires plugin names as strings, not imported modules
    remarkPlugins: ['remark-frontmatter'],
  },
})

export default withMDX(nextConfig)
