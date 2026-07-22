export function safeApplicationPath(
  value: string | null,
  fallback = "/account/continue",
): string {
  return value?.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\")
    ? value
    : fallback;
}
