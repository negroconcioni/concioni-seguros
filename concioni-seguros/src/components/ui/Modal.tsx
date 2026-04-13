import type { ReactNode } from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
};

function Modal({ open, onClose, title, children, footer }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex max-md:items-end max-md:justify-stretch max-md:bg-black/40 md:items-center md:justify-center md:bg-black/30 md:p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={[
          "flex min-h-0 w-full flex-col overflow-hidden bg-white shadow-xl",
          "max-md:h-[95vh] max-md:max-h-[95vh] max-md:rounded-b-none max-md:rounded-t-2xl max-md:animate-modal-sheet-in",
          "md:mx-auto md:max-h-[90vh] md:max-w-[90vw] md:rounded-xl lg:max-w-xl",
        ].join(" ")}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <header className="shrink-0 border-b border-[#e2e0db] px-4 pb-3 pt-2 md:px-5 md:py-4">
          <div className="mb-3 flex justify-center md:hidden" aria-hidden>
            <span className="h-1 w-10 shrink-0 rounded-full bg-[#d0cdc7]" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <h3 id="modal-title" className="text-[17px] font-semibold text-[#1a1916]">
              {title}
            </h3>
            <button
              type="button"
              className="rounded-md px-2 py-1 text-[#6b6860] transition hover:bg-[#f5f4f1] hover:text-[#1a1916] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8]/[0.08]"
              onClick={onClose}
              aria-label="Cerrar modal"
            >
              x
            </button>
          </div>
        </header>
        <section className="modal-body min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-5">{children}</section>
        {footer ? (
          <footer className="shrink-0 border-t border-[#e2e0db] bg-[#f5f4f1] px-4 py-3 md:px-5 max-md:[&>div]:flex max-md:[&>div]:w-full max-md:[&>div]:flex-col max-md:[&>div]:gap-2 max-md:[&_button]:w-full">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}

export default Modal;
