export interface Toast {
  id: string;
  message: string;
  type: "info" | "success" | "danger" | "warning";
  duration?: number;
}
