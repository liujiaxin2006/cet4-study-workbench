import { useEffect, useRef, useState, type PointerEvent } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Button } from './Button';
import styles from './StudyDock.module.css';

type Item = { id: string; label: string; icon: LucideIcon };
type Gesture = { pointer: number; captureTarget: HTMLButtonElement; x: number; y: number; from: number; width: number; dragging: boolean };

export function StudyDock({ items, active, onSelect }: {
  items: Item[];
  active: string;
  onSelect: (id: string) => void;
}) {
  const track = useRef<HTMLElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const suppressClick = useRef(false);
  const [preview, setPreview] = useState<number | null>(null);
  const activeIndex = Math.max(0, items.findIndex(item => item.id === active));
  const [requested, setRequested] = useState<{ from: string; to: number } | null>(null);
  const selected = requested?.from === active ? requested.to : activeIndex;

  useEffect(() => {
    setRequested(current => current?.from === active ? current : null);
  }, [active]);

  function select(index: number) {
    setRequested(index === activeIndex ? null : { from: active, to: index });
    onSelect(items[index].id);
  }

  function start(event: PointerEvent<HTMLElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    suppressClick.current = false;
    const buttons = Array.from(event.currentTarget.querySelectorAll('button'));
    const from = buttons.findIndex(button => button.contains(event.target as Node));
    const captureTarget = buttons[from];
    const width = captureTarget?.getBoundingClientRect().width;
    if (!width) return;
    // Capture on the pressed button from the start so tap activation keeps its target.
    captureTarget.setPointerCapture(event.pointerId);
    gesture.current = { pointer: event.pointerId, captureTarget, x: event.clientX, y: event.clientY, from, width, dragging: false };
  }

  function position(current: Gesture, x: number) {
    return Math.max(0, Math.min(items.length - 1, current.from + (x - current.x) / current.width));
  }

  function move(event: PointerEvent<HTMLElement>) {
    const current = gesture.current;
    if (!current || current.pointer !== event.pointerId) return;
    const dx = Math.abs(event.clientX - current.x);
    const dy = Math.abs(event.clientY - current.y);
    if (!current.dragging) {
      if (dy >= 8 && dy >= dx) {
        gesture.current = null;
        return;
      }
      if (dx < 8) return;
      current.dragging = true;
      event.currentTarget.dataset.dragging = 'true';
    }
    const offset = position(current, event.clientX);
    track.current?.style.setProperty('--dock-offset', `${offset * 100}%`);
    setPreview(Math.round(offset));
  }

  function finish(event: PointerEvent<HTMLElement>, cancelled = false) {
    const current = gesture.current;
    if (!current || current.pointer !== event.pointerId) return;
    gesture.current = null;
    if (!current.dragging) return;
    suppressClick.current = true;
    delete event.currentTarget.dataset.dragging;
    track.current?.style.removeProperty('--dock-offset');
    setPreview(null);
    if (!cancelled) {
      const target = Math.round(position(current, event.clientX));
      if (target !== selected) select(target);
    }
  }

  return (
    <nav ref={track} className={styles.dock} aria-label="底部导航"
      onPointerDown={start} onPointerMove={move}
      onPointerUp={event => finish(event)}
      onPointerCancel={event => finish(event, true)}
      onLostPointerCapture={event => {
        if (event.target === gesture.current?.captureTarget) finish(event, true);
      }}
      onContextMenu={event => { if (gesture.current) event.preventDefault(); }}
      onClickCapture={event => {
        if (suppressClick.current && event.detail > 0) {
          event.preventDefault();
          event.stopPropagation();
          suppressClick.current = false;
        }
      }}>
      <span className={styles.highlight} aria-hidden="true"
        style={{ transform: `translate3d(var(--dock-offset, ${selected * 100}%), 0, 0)` }} />
      {items.map(({ id, label, icon: Icon }, index) => (
        <Button key={id} variant="ghost" aria-current={id === active ? 'page' : undefined}
          data-highlighted={(preview ?? selected) === index} onClick={() => select(index)}>
          <Icon size={21} aria-hidden="true" /><span>{label}</span>
        </Button>
      ))}
    </nav>
  );
}
