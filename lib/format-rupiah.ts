const MAX_RUPIAH_DIGITS = 12;

const rupiahInputFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
  useGrouping: true,
});

export function normalizeRupiahDigits(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, MAX_RUPIAH_DIGITS);
  return digits.replace(/^0+(?=\d)/, "");
}

export function formatRupiahInput(value: string) {
  const digits = normalizeRupiahDigits(value);
  if (!digits) return "";

  return `Rp ${rupiahInputFormatter.format(Number(digits))}`;
}
