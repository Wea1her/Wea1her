export function normalizeWalinePath(pathname: string) {
  const trimmedPathname = pathname.trim();

  if (!trimmedPathname || trimmedPathname === "/") {
    return "/";
  }

  const normalizedPathname = `/${trimmedPathname.replace(/^\/+|\/+$/g, "")}`;

  try {
    const encodedPathname = new URL(normalizedPathname, "https://example.com")
      .pathname;

    return encodedPathname === "/" ? "/" : encodedPathname.replace(/\/+$/g, "");
  } catch {
    return normalizedPathname;
  }
}
