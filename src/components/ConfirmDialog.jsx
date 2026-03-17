export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  confirmTone = "primary",
}) {
  if (!open) return null;

  const confirmClass =
    confirmTone === "danger" ? "rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500" : "btn btn-primary";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-outline"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={confirmClass}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
