import { createContext, useContext, cloneElement, isValidElement, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

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

export function DialogContent({
  className = '',
  overlayClassName = '',
  children,
  onClose,
}: {
  className?: string;
  overlayClassName?: string;
  children: ReactNode;
  onClose?: () => void;
}) {
  const ctx = useContext(DialogContext);

  useEffect(() => {
    if (ctx?.open) {
      const originalStyle = window.getComputedStyle(document.body).overflow;  
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [ctx?.open]);

  if (!ctx || !ctx.open) return null;
  return createPortal(
    <>
      <div
        className={`fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm transition-all ${overlayClassName}`}
        onClick={() => { ctx.setOpen(false); onClose?.(); }}
        aria-hidden
      />
      <div
        role="dialog"
        className={`fixed inset-x-0 bottom-0 top-auto z-[100] max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-palette-border/60 bg-white p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-glass transition-all sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:overflow-y-auto sm:rounded-3xl sm:p-8 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </>,
    document.body
  );
}

export function DialogHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mb-4 sm:mb-6 ${className}`}>{children}</div>;
}

export function DialogTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h2 className={`text-xl font-brand font-bold text-palette-text tracking-tight sm:text-2xl ${className}`}>{children}</h2>;
}
