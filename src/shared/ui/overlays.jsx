'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Icon from './icon';

const responsiveWidth = (width) => width.replace(/\bmax-w-/g, 'sm:max-w-');

export const Modal = ({ isOpen, onClose, title, description, children, footer, width = 'max-w-xl' }) => (
  <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
    <DialogContent
      className={cn(
        'flex max-h-[calc(100vh-2rem)] flex-col gap-0 p-0',
        width,
        responsiveWidth(width),
      )}
    >
      <DialogHeader className="border-b px-5 py-4 pr-14">
        <DialogTitle>{title}</DialogTitle>
        {description ? <DialogDescription>{description}</DialogDescription> : null}
      </DialogHeader>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

      {footer ? (
        <DialogFooter className="mx-0 mb-0 border-t bg-muted/40 px-5 py-3 sm:justify-end">
          {footer}
        </DialogFooter>
      ) : null}
    </DialogContent>
  </Dialog>
);

const TONE_STYLE = {
  warning: { icon: 'alert', className: 'bg-warn-soft text-warn' },
  danger: { icon: 'alert', className: 'bg-danger-soft text-danger' },
  success: { icon: 'check', className: 'bg-brand-soft text-brand' },
  info: { icon: 'info', className: 'bg-info-soft text-info' },
};

export const ConfirmDialog = ({
  isOpen,
  tone = 'warning',
  title,
  description,
  confirmLabel = 'Lanjutkan',
  cancelLabel = 'Batal',
  onConfirm,
  onCancel,
  isSingleAction = false,
  isProcessing = false,
}) => {
  const style = TONE_STYLE[tone] ?? TONE_STYLE.warning;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel?.()}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader className="items-center text-center">
          <span className={cn('mx-auto grid size-12 place-items-center rounded-full', style.className)}>
            <Icon name={style.icon} className="size-5" strokeWidth={2} />
          </span>
          <AlertDialogTitle className="mt-3 text-center">{title}</AlertDialogTitle>
          {description ? (
            <AlertDialogDescription className="text-center">{description}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-2 sm:justify-center">
          {isSingleAction ? null : (
            <AlertDialogCancel className="flex-1" disabled={isProcessing}>
              {cancelLabel}
            </AlertDialogCancel>
          )}
          <AlertDialogAction
            className="flex-1"
            disabled={isProcessing}
            onClick={(event) => {
              event.preventDefault();
              onConfirm?.();
            }}
          >
            {isProcessing ? 'Memproses…' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export const useToast = () => ({
  showToast: (message, tone = 'success') =>
    tone === 'error' ? toast.error(message) : toast.success(message),
});

export const ToastProvider = ({ children }) => children;
