import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

let openCount = 0;

/**
 * Comportement modal accessible : focus initial, piège à focus (Tab), Échap pour fermer,
 * blocage du défilement de la page, restauration du focus à la fermeture.
 */
export function useModal(open: boolean, onClose: () => void): RefObject<HTMLDivElement> {
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const node = ref.current;
    openCount++;
    document.body.style.overflow = 'hidden';

    const focusFirst = () => {
      if (!node) return;
      const auto = node.querySelector<HTMLElement>('[data-autofocus]');
      const first = auto ?? node.querySelector<HTMLElement>(FOCUSABLE) ?? node;
      first.focus({ preventScroll: true });
    };
    const raf = requestAnimationFrame(focusFirst);

    const onKey = (e: KeyboardEvent) => {
      if (!node) return;
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    node?.addEventListener('keydown', onKey);

    return () => {
      cancelAnimationFrame(raf);
      node?.removeEventListener('keydown', onKey);
      openCount--;
      if (openCount <= 0) {
        openCount = 0;
        document.body.style.overflow = '';
      }
      previous?.focus?.({ preventScroll: true });
    };
  }, [open]);

  return ref;
}
