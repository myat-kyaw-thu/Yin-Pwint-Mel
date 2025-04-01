import { useState, useCallback } from 'react';

interface Toast {
    id: string;
    title?: string;
    description?: string;
    variant?: 'default' | 'success' | 'error' | 'warning' | 'info' | 'destructive';
}

const TOAST_REMOVE_DELAY = 2000;

export function useToast() {
    const [toast, setToast] = useState<Toast | null>(null);

    const showToast = useCallback(
        ({ title, description, variant = 'default' }: Toast) => {
            const id = Math.random().toString(36).substr(2, 9);
            const newToast = { id, title, description, variant };
            setToast(newToast);
            setTimeout(() => {
                setToast(null);
            }, TOAST_REMOVE_DELAY);
        },
        []
    );

    return { toast, showToast };
}
