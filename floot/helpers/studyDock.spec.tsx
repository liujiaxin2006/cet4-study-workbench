import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { Bookmark } from 'lucide-react';
import { StudyDock } from '../components/StudyDock';

const items = ['首页', '背词', '练习', '我的'].map(label => ({ id: label, label, icon: Bookmark }));

function setup() {
  const select = jasmine.createSpy('select');
  const view = render(<StudyDock items={items} active="首页" onSelect={select} />);
  const dock = view.getByRole('navigation');
  const buttons = view.getAllByRole('button');
  Object.defineProperty(dock, 'setPointerCapture', { value: () => {} });
  buttons.forEach(button => spyOn(button, 'getBoundingClientRect').and.returnValue({ width: 80 } as DOMRect));
  function pointer(target: Element, type: string, x: number, y = 10) {
    const event = new window.MouseEvent(type, { bubbles: true, clientX: x, clientY: y });
    Object.defineProperties(event, { pointerId: { value: 1 }, isPrimary: { value: true } });
    fireEvent(target, event);
  }
  return { dock, buttons, select, pointer };
}

describe('mobile study dock', () => {
  afterEach(cleanup);

  it('follows the pointer without navigating, then selects once on release', () => {
    const { dock, buttons, select, pointer } = setup();
    pointer(buttons[0], 'pointerdown', 40);
    pointer(dock, 'pointermove', 166);
    expect(dock.style.getPropertyValue('--dock-offset')).toBe('157.5%');
    expect(buttons[2].dataset.highlighted).toBe('true');
    expect(buttons[0].getAttribute('aria-current')).toBe('page');
    expect(select).not.toHaveBeenCalled();
    pointer(dock, 'pointerup', 166);
    fireEvent.click(buttons[0], { detail: 1 });
    expect(select.calls.allArgs()).toEqual([['练习']]);
  });

  it('cancels a gesture and still accepts a later tap or keyboard click', () => {
    const { dock, buttons, select, pointer } = setup();
    pointer(buttons[0], 'pointerdown', 40);
    pointer(dock, 'pointermove', 111);
    pointer(dock, 'pointercancel', 111);
    expect(dock.dataset.dragging).toBeUndefined();
    expect(buttons[0].dataset.highlighted).toBe('true');
    expect(select).not.toHaveBeenCalled();
    pointer(buttons[1], 'pointerdown', 120);
    pointer(buttons[1], 'pointerup', 120);
    fireEvent.click(buttons[1], { detail: 1 });
    fireEvent.click(buttons[3], { detail: 0 });
    expect(select.calls.allArgs()).toEqual([['背词'], ['我的']]);
  });

  it('does not start a swipe for vertical motion', () => {
    const { dock, buttons, select, pointer } = setup();
    pointer(buttons[0], 'pointerdown', 40);
    pointer(dock, 'pointermove', 44, 32);
    pointer(dock, 'pointerup', 100, 44);
    expect(dock.style.getPropertyValue('--dock-offset')).toBe('');
    expect(select).not.toHaveBeenCalled();
  });
});
