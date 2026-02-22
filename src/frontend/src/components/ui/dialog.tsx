import { createContext, useContext, cloneElement, isValidElement, type ReactNode } from 'react';

interface DialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <DialogContext.Provider value={{ open, setOpen: onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}

export function DialogTrigger({
  asChild,
  children,
}: {
  asChild?: boolean;
  children: ReactNode;
}) {
  const ctx = useContext(DialogContext);
  if (!ctx) return null;
  const open = () => ctx.setOpen(true);
  const child = Array.isArray(children) ? children[0] : children;
  if (asChild && isValidElement(child)) {
    return cloneElement(child as React.ReactElement<{ onClick?: () => void }>, { onClick: open });
  }
  return (
    <button type="button" onClick={open}>
      {children}
    </button>
  );
}

export interface DialogContentProps {
  className?: string;
  children: ReactNode;
  onClose?: () => void;
}

export function DialogContent({
  className = '',
  children,
  onClose,
}: DialogContentProps) {
  const ctx = useContext(DialogContext);
  if (!ctx || !ctx.open) return null;
  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={() => { ctx.setOpen(false); onClose?.(); }}
        aria-hidden
      />
      <div
        role="dialog"
        className={`fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-palette-mist bg-white p-6 shadow-lg ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </>
  );
}

export function DialogHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

export function DialogTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-lg font-semibold">{children}</h2>;
}
