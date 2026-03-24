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

  return toResolvedUrl(baseSubviewUrl, rawHref).toString();
}
