"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { XIcon } from "@/components/icons";

type ModalProps = {
  title: string;
  description?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  size?: "md" | "lg";
};

export function Modal({ title, description, onClose, children, size = "lg" }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className={`m-auto w-[calc(100%-2rem)] ${
        size === "lg" ? "max-w-2xl" : "max-w-md"
      } rounded-xl bg-white p-0 text-sm text-slate-900 shadow-2xl backdrop:bg-slate-900/40`}
    >
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-slate-500">{description}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-mr-2 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <XIcon />
        </button>
      </div>
      {children}
    </dialog>
  );
}

export function ModalFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-3">
      {children}
    </div>
  );
}
