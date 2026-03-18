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
      <p className="mt-2 flex items-center gap-2 text-sm text-emerald-700">
        <CheckCircle2 className="h-4 w-4" />
        {state.message}
      </p>
    );
  }

  return (
    <p className="mt-2 flex items-center gap-2 text-sm text-rose-700">
      <AlertCircle className="h-4 w-4" />
      {state.message}
    </p>
  );
}
