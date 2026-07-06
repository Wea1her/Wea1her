export interface ContentVisibilityFrontmatter {
  published?: boolean;
  draft?: boolean;
}

export function isPublishedFrontmatter(
  frontmatter: ContentVisibilityFrontmatter | undefined,
) {
  return frontmatter?.published !== false && frontmatter?.draft !== true;
}

export function isPublishedContentEntry<
  T extends { data: ContentVisibilityFrontmatter },
>(entry: T) {
  return isPublishedFrontmatter(entry.data);
}
