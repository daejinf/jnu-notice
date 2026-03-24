function createSubviewEncValue(targetPath: string) {
  const normalizedPath = targetPath.trim();
  const encodedTargetPath = encodeURIComponent(normalizedPath);
  return Buffer.from(`fnct1|@@|${encodedTargetPath}`, "utf8").toString("base64");
}

function toResolvedUrl(baseUrl: string, rawHref: string) {
  if (rawHref.startsWith("http://") || rawHref.startsWith("https://")) {
    return new URL(rawHref);
  }

  if (rawHref.startsWith("/")) {
    return new URL(rawHref, new URL(baseUrl).origin);
  }

  return new URL(rawHref, baseUrl);
}

export function buildSubviewNoticeUrl(baseSubviewUrl: string, rawHref: string) {
  if (!rawHref) {
    return baseSubviewUrl;
  }

  const resolvedUrl = toResolvedUrl(baseSubviewUrl, rawHref);

  if (!resolvedUrl.pathname.includes("/bbs/") || resolvedUrl.pathname.includes("subview.do")) {
    return resolvedUrl.toString();
  }

  const wrappedUrl = new URL(baseSubviewUrl);
  wrappedUrl.search = "";
  wrappedUrl.hash = "";
  wrappedUrl.searchParams.set(
    "enc",
    createSubviewEncValue(`${resolvedUrl.pathname}${resolvedUrl.search}`),
  );

  return wrappedUrl.toString();
}