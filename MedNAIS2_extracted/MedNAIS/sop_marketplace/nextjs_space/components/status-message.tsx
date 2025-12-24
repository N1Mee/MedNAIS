
import { AlertCircle, CheckCircle, Info } from "lucide-react";

interface StatusMessageProps {
  type: "error" | "success" | "info";
  message: string;
}

export function StatusMessage({ type, message }: StatusMessageProps) {
  const icons = {
    error: AlertCircle,
    success: CheckCircle,
    info: Info,
  };

  const colors = {
    error: "text-red-600 bg-red-50 dark:bg-red-900/20",
    success: "text-green-600 bg-green-50 dark:bg-green-900/20",
    info: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
  };

  const Icon = icons[type];

  return (
    <div className={`rounded-lg p-4 flex items-center gap-3 ${colors[type]}`}>
      <Icon className="h-5 w-5 flex-shrink-0" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
