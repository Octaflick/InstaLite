export function parsePositiveInteger(value, fallback) {
  if (value === undefined) return fallback;
  if (!/^[1-9]\d*$/.test(String(value))) return null;
  return Number(value);
}

export function parsePagination(query) {
  const page = parsePositiveInteger(query.page, 1);
  const rawLimit = parsePositiveInteger(query.limit, 10);

  if (page === null || rawLimit === null) {
    return { error: "page and limit must be positive integers" };
  }

  return { page, limit: Math.min(rawLimit, 50) };
}
