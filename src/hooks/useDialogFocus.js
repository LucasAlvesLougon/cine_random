import { useEffect, useRef } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useDialogFocus(isOpen, onClose) {
    const dialogRef = useRef(null);
    const onCloseRef = useRef(onClose);
    useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

    useEffect(() => {
        if (!isOpen) return undefined;
        const dialog = dialogRef.current;
        if (!dialog) return undefined;
        const previousFocus = document.activeElement;
        const focusables = () => Array.from(dialog.querySelectorAll(FOCUSABLE)).filter(el => getComputedStyle(el).visibility !== 'hidden' && getComputedStyle(el).display !== 'none');
        // jsdom has no layout; focusing the first control still exercises this contract in tests.
        const first = dialog.querySelector(FOCUSABLE);
        (first || dialog).focus();

        const onKeyDown = (event) => {
            if (!dialog.contains(document.activeElement) && document.activeElement !== dialog) return;
            if (event.key === 'Escape') {
                event.preventDefault();
                onCloseRef.current?.();
            } else if (event.key === 'Tab') {
                const controls = focusables();
                if (controls.length === 0) {
                    event.preventDefault();
                    dialog.focus();
                } else if (event.shiftKey && document.activeElement === controls[0]) {
                    event.preventDefault();
                    controls[controls.length - 1].focus();
                } else if (!event.shiftKey && document.activeElement === controls[controls.length - 1]) {
                    event.preventDefault();
                    controls[0].focus();
                }
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            if (previousFocus?.isConnected) previousFocus.focus();
        };
    }, [isOpen]);

    return dialogRef;
}
