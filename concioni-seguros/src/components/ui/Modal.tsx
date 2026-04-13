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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-xl min-h-0 flex-col overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-[#e2e0db] px-5 py-4">
          <h3 className="text-[17px] font-semibold text-[#1a1916]">{title}</h3>
          <button
            type="button"
            className="rounded-md px-2 py-1 text-[#6b6860] transition hover:bg-[#f5f4f1] hover:text-[#1a1916] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8]/[0.08]"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            x
          </button>
        </header>
        <section className="modal-body min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</section>
        {footer ? (
          <footer className="shrink-0 border-t border-[#e2e0db] bg-[#f5f4f1] px-5 py-3">{footer}</footer>
        ) : null}
      </div>
    </div>
  );
}

export default Modal;
