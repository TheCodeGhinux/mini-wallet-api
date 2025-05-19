export function generateTransactionReference(userId: string): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = String(now.getFullYear()).slice(-2);
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");

  const suffix = userId.slice(-6);
  const random = Math.random().toString(36).substring(2, 6);

  return `txn-${dd}${mm}${yy}-${hh}${min}-${suffix}-${random}`;
}
