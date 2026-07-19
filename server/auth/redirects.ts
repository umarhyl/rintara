export function safeApplicationPath(
  value: string | null,
  fallback = "/dashboard",
): string {
  return value?.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\")
    ? value
    : fallback;
}

