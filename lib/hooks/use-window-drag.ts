'use client';

import { useCallback, useEffect, useRef, type KeyboardEvent, type MouseEvent, type PointerEvent, type RefObject } from 'react';

type Point = { x: number; y: number };
const origin = () => ({ x: 0, y: 0 });
const limit = (n: number, low: number, high: number) => Math.max(low, Math.min(high, n));

// Keep the normal layout slot. CSS translate composes with the window's
// existing minimize transform, and pointer movement never re-renders the app.
export function useWindowDrag(ref: RefObject<HTMLElement>, disabled = false, clearance = 44) {
  const offset = useRef<Point>(origin());
  const held = useRef<{ id: number; start: Point; from: Point } | null>(null);
  const reset = useCallback(() => {
    held.current = null;
    offset.current = origin();
    if (ref.current) {
      ref.current.style.removeProperty('translate');
      delete ref.current.dataset.dragging;
    }
  }, [ref]);

  const move = useCallback((x: number, y: number) => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const baseX = rect.left - offset.current.x, baseY = rect.top - offset.current.y;
    const top = clearance + 4;
    const left = limit(baseX + x, 4, window.innerWidth - rect.width - 4);
    const upper = Math.max(top, window.innerHeight - rect.height - 4);
    const positionY = rect.height > window.innerHeight - top - 4 ? baseY : limit(baseY + y, top, upper);
    offset.current = { x: Math.round(left - baseX), y: Math.round(positionY - baseY) };
    node.style.translate = `${offset.current.x}px ${offset.current.y}px`;
  }, [clearance, ref]);

  useEffect(() => {
    reset();
    const observer = new ResizeObserver(() => {
      const { x, y } = offset.current;
      if (x || y) move(x, y);
    });
    if (ref.current && !disabled) observer.observe(ref.current);
    window.addEventListener('resize', reset);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', reset);
    };
  }, [disabled, move, ref, reset]);

  function start(event: PointerEvent<HTMLElement>) {
    if (disabled || !event.isPrimary || event.button !== 0 ||
      (event.target instanceof Element && event.target.closest('button, a, input, select'))) return;
    held.current = { id: event.pointerId, start: { x: event.clientX, y: event.clientY }, from: { ...offset.current } };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function drag(event: PointerEvent<HTMLElement>) {
    const hold = held.current;
    if (!hold || hold.id !== event.pointerId || !ref.current) return;
    const dx = event.clientX - hold.start.x, dy = event.clientY - hold.start.y;
    if (!ref.current.dataset.dragging && Math.hypot(dx, dy) < 3) return;
    ref.current.dataset.dragging = 'true';
    move(hold.from.x + dx, hold.from.y + dy);
  }
  function finish(event: PointerEvent<HTMLElement>) {
    if (held.current?.id !== event.pointerId) return;
    held.current = null;
    if (ref.current) delete ref.current.dataset.dragging;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function key(event: KeyboardEvent<HTMLElement>) {
    if (disabled || event.target !== event.currentTarget) return;
    const steps: Record<string, Point> = { ArrowLeft: { x: -16, y: 0 }, ArrowRight: { x: 16, y: 0 }, ArrowUp: { x: 0, y: -16 }, ArrowDown: { x: 0, y: 16 } };
    if (event.key === 'Home') { event.preventDefault(); reset(); }
    if (steps[event.key]) {
      event.preventDefault();
      move(offset.current.x + steps[event.key].x, offset.current.y + steps[event.key].y);
    }
  }
  return {
    handle: {
      tabIndex: disabled ? -1 : 0,
      title: disabled ? undefined : 'Drag to move · arrow keys to move · Home to centre',
      onPointerDown: start, onPointerMove: drag, onPointerUp: finish,
      onPointerCancel: finish, onLostPointerCapture: finish, onKeyDown: key,
      onDoubleClick: (event: MouseEvent<HTMLElement>) => {
        if (!disabled && !(event.target instanceof Element && event.target.closest('button'))) reset();
      }
    }
  };
}
