import { AlertCircle, CheckCircle2 } from "lucide-react";

import type { ActionState } from "@/presentation/admin/common/action-state";

type ActionFeedbackProps = {
  state: ActionState;
};

export function ActionFeedback({ state }: ActionFeedbackProps) {
  if (state.status === "idle") {
    return null;
  }

  if (state.status === "success") {
    return (
      <p className="mt-3 inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
        <CheckCircle2 className="h-4 w-4" />
        {state.message}
      </p>
    );
  }

  return (
    <p className="mt-3 inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
      <AlertCircle className="h-4 w-4" />
      {state.message}
    </p>
  );
}
