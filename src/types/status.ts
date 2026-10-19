export type StatusTone = "green" | "yellow" | "gray" | "red" | "brown";

export const STATUS_TONE: Record<string, StatusTone> = {
  Active: "green",
  Used: "green",
  Completed: "green",
  Open: "green",
  Direct: "green",
  Pending: "yellow",
  Missed: "brown",
  Expired: "gray",
  Cancelled: "gray",
};

export function statusTone(status: string): StatusTone {
  return STATUS_TONE[status] ?? "gray";
}
