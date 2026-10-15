"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Accessible modal dialog.
 *
 * Replaces the hand-rolled `fixed inset-0` overlays this app used to ship.
 * The primitive supplies the parts that are tedious to get right by hand and
 * were all missing: focus is trapped inside the popup, Escape closes it, the
 * page behind it stops scrolling, focus returns to whatever opened it, and the
 * popup is announced as a dialog rather than as an anonymous div.
 */
const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

function DialogBackdrop({ className, ...props }: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-backdrop"
      className={cn(
        "fixed inset-0 z-50 bg-black/65 backdrop-blur-[2px]",
        "transition-opacity duration-200 ease-[var(--ease-out-quint)]",
        "data-starting-style:opacity-0 data-ending-style:opacity-0",
        className
      )}
      {...props}
    />
  )
}

interface DialogContentProps extends DialogPrimitive.Popup.Props {
  /** Hides the built-in corner close button for dialogs that must be resolved by choosing an action. */
  hideClose?: boolean
  /** Accessible name for the close button. */
  closeLabel?: string
}

function DialogContent({
  className,
  children,
  hideClose = false,
  closeLabel = "Close dialog",
  ...props
}: DialogContentProps) {
  return (
    <DialogPortal>
      <DialogBackdrop />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          "fixed z-50 bg-card text-card-foreground shadow-2xl outline-none",
          "transition-[opacity,transform] duration-200 ease-[var(--ease-out-quint)]",
          // Mobile: Bottom-sheet ergonomics (reachable by thumb, keyboard-safe)
          "inset-x-0 bottom-0 top-auto w-full max-h-[90svh] overflow-y-auto overscroll-contain",
          "rounded-t-2xl rounded-b-none border-t border-border border-x-0 border-b-0 p-5 pb-safe",
          "data-starting-style:translate-y-full data-starting-style:opacity-100",
          "data-ending-style:translate-y-full data-ending-style:opacity-100",
          // Desktop & Tablet (sm:): Centered modal dialog
          "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100vw-1.5rem)] sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2",
          "sm:max-h-[min(92svh,52rem)] sm:rounded-2xl sm:border sm:border-border sm:p-6 sm:pb-6",
          "sm:data-starting-style:scale-96 sm:data-starting-style:translate-y-[-50%] sm:data-starting-style:opacity-0",
          "sm:data-ending-style:scale-96 sm:data-ending-style:translate-y-[-50%] sm:data-ending-style:opacity-0",
          className
        )}
        {...props}
      >
        {/* Mobile drag handle affordance */}
        <div
          className="mx-auto -mt-2 mb-3 h-1.5 w-10 rounded-full bg-muted-foreground/25 sm:hidden"
          aria-hidden="true"
        />

        {children}

        {!hideClose && (
          <DialogPrimitive.Close
            aria-label={closeLabel}
            className={cn(
              "absolute right-3.5 top-3.5 sm:right-4 sm:top-4 inline-flex size-10 sm:size-9 items-center justify-center rounded-lg",
              "text-muted-foreground transition-colors",
              "hover:bg-muted hover:text-foreground",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            )}
          >
            <XIcon className="size-4" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      // Right padding clears the absolutely positioned close button so a long
      // title wraps before it collides with the X.
      className={cn("flex flex-col gap-1.5 pr-10", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      // Stacked and reversed on mobile so the confirming action sits on top,
      // under the thumb; side by side from `sm` up.
      className={cn(
        "flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg font-semibold tracking-tight text-foreground", className)}
      {...props}
    />
  )
}

function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogBackdrop,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
}
