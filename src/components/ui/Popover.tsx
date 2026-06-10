'use client';

/**
 * Popover — portal-based popover anchored to a trigger element.
 * Adapted from bflowpos/src/components/SelectPopover.tsx.
 *
 * Handles: portal rendering, smart positioning (flips near viewport edge),
 * outside-click close, Escape close, focus trap, scroll/resize repositioning.
 *
 * Usage:
 *   const triggerRef = useRef<HTMLButtonElement>(null);
 *   const [open, setOpen] = useState(false);
 *
 *   <button ref={triggerRef} onClick={() => setOpen(true)}>Open</button>
 *   <Popover triggerRef={triggerRef} isOpen={open} onClose={() => setOpen(false)} width={280}>
 *     <p>Content goes here</p>
 *   </Popover>
 */

import { useRef, useEffect, useCallback, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE =
  'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function computePosition(
  trigger: HTMLElement,
  popover: HTMLElement,
  preferredWidth: number
): { top: number; left: number } {
  const rect = trigger.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  let left = rect.left + scrollX;
  // Flip if it would overflow the right edge
  if (left + preferredWidth > vw - 16 + scrollX) {
    left = rect.right + scrollX - preferredWidth;
  }
  if (left < 16 + scrollX) left = 16 + scrollX;

  const spaceBelow = vh - rect.bottom;
  const popoverH = popover.offsetHeight || 320;
  // Flip above trigger if there isn't enough space below
  const top = spaceBelow >= popoverH + 8
    ? rect.bottom + scrollY + 6
    : rect.top + scrollY - popoverH - 6;

  return { top, left };
}

export interface PopoverProps {
  triggerRef: RefObject<HTMLElement | null>;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: number;
  className?: string;
}

export function Popover({
  triggerRef,
  isOpen,
  onClose,
  children,
  width = 280,
  className = '',
}: PopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  const applyPosition = useCallback(() => {
    const popover = popoverRef.current;
    const trigger = triggerRef.current;
    if (!popover || !trigger) return;
    const { top, left } = computePosition(trigger, popover, width);
    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
  }, [triggerRef, width]);

  // Initial + deferred position (after paint so offsetHeight is known)
  useEffect(() => {
    if (!isOpen) return;
    const id = requestAnimationFrame(() => applyPosition());
    return () => cancelAnimationFrame(id);
  }, [isOpen, applyPosition]);

  // Reposition on scroll / resize
  useEffect(() => {
    if (!isOpen) return;
    const handler = () => applyPosition();
    window.addEventListener('scroll', handler, true);
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('scroll', handler, true);
      window.removeEventListener('resize', handler);
    };
  }, [isOpen, applyPosition]);

  // Outside click → close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (popoverRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose, triggerRef]);

  // Escape → close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !popoverRef.current) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !popoverRef.current) return;
      const focusables = Array.from(
        popoverRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={popoverRef}
      style={{ position: 'absolute', zIndex: 9999, width }}
      className={`rounded-2xl shadow-2xl border bg-card border-border overflow-hidden ${className}`}
    >
      {children}
    </div>,
    document.body
  );
}

export default Popover;
