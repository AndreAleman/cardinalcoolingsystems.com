// Route predicates for the builder section. Pure, so the footer's client wrapper and tests share it.

/** /[cc]/build/**, /[cc]/for/**, /[cc]/sanitary-vs-bpe: pages with no newsletter block. */
export function isBuilderSectionPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  return /^\/[a-z]{2}\/(?:build|for|sanitary-vs-bpe)(?:\/|$|\?)/i.test(pathname)
}
