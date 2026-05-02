import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export interface PostFrontmatter {
  title: string
  date: string
  excerpt: string
  author: string
  tags: string[]
}

export interface Post extends PostFrontmatter {
  slug: string
  readingTime: number
}

const BLOG_DIR = path.join(process.cwd(), 'content/blog')

export function getAllPosts(): Post[] {
  if (!fs.existsSync(BLOG_DIR)) return []
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.mdx'))
  return files
    .map(file => parsePost(file.replace(/\.mdx$/, '')))
    .filter((p): p is Post => p !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getPost(slug: string): Post | null {
  return parsePost(slug)
}

function parsePost(slug: string): Post | null {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`)
  if (!fs.existsSync(filePath)) return null
  const raw = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(raw)
  const readingTime = Math.max(1, Math.ceil(content.split(/\s+/).length / 200))
  return {
    slug,
    title: data.title ?? '',
    date: data.date ?? '',
    excerpt: data.excerpt ?? '',
    author: data.author ?? '',
    tags: data.tags ?? [],
    readingTime,
  }
}
