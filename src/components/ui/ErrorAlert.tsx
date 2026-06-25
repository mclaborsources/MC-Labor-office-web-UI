import { AlertTriangle } from "lucide-react";
import { Icon } from "@/components/ui/Icon";

interface ErrorAlertProps {
  title?: string;
  message: string;
}

export function ErrorAlert({ title = "Something went wrong", message }: ErrorAlertProps) {
  return (
    <div
      className="flex items-start gap-3 rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-4 text-sm text-red-800"
      role="alert"
    >
      <Icon icon={AlertTriangle} size="sm" className="mt-0.5 shrink-0 text-red-500" />
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-0.5 text-red-700/80">{message}</p>
      </div>
    </div>
  );
}
