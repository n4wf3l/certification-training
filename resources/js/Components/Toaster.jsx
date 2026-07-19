import Icon from '@/Components/Icons';
import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

let idCounter = 0;
const listeners = new Set();
const state = { toasts: [] };

export function pushToast(toast) {
    const id = ++idCounter;
    state.toasts = [...state.toasts, { id, ...toast }];
    listeners.forEach((l) => l(state.toasts));
    const timeout = toast.duration ?? 4200;
    setTimeout(() => dismissToast(id), timeout);
    return id;
}

export function dismissToast(id) {
    state.toasts = state.toasts.map((t) => (t.id === id ? { ...t, leaving: true } : t));
    listeners.forEach((l) => l(state.toasts));
    setTimeout(() => {
        state.toasts = state.toasts.filter((t) => t.id !== id);
        listeners.forEach((l) => l(state.toasts));
    }, 220);
}

function useToasts() {
    const [toasts, setToasts] = useState(state.toasts);
    useEffect(() => {
        listeners.add(setToasts);
        return () => listeners.delete(setToasts);
    }, []);
    return toasts;
}

/** Écoute les flash Laravel et les convertit en toast. */
export function useFlashToasts() {
    const flash = usePage().props.flash;
    useEffect(() => {
        if (flash?.success) pushToast({ variant: 'success', message: flash.success });
    }, [flash?.success]);
    useEffect(() => {
        if (flash?.error) pushToast({ variant: 'error', message: flash.error });
    }, [flash?.error]);
}

export default function Toaster() {
    const toasts = useToasts();

    return (
        <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col-reverse gap-2 sm:bottom-6 sm:right-6">
            {toasts.map((t) => (
                <ToastItem key={t.id} toast={t} />
            ))}
        </div>
    );
}

function ToastItem({ toast }) {
    const variants = {
        success: {
            border: 'border-emerald-500/30',
            bg: 'bg-emerald-500/95',
            accent: 'bg-emerald-400',
            Icon: Icon.Check,
        },
        error: {
            border: 'border-rose-500/30',
            bg: 'bg-rose-500/95',
            accent: 'bg-rose-400',
            Icon: Icon.Close,
        },
        info: {
            border: 'border-brand-500/30',
            bg: 'bg-brand-500/95',
            accent: 'bg-brand-400',
            Icon: Icon.Sparkles,
        },
    };
    const v = variants[toast.variant] || variants.info;

    return (
        <div
            className={`pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-xl border ${v.border} bg-white/95 p-4 shadow-xl backdrop-blur-md text-ink-900 dark:bg-ink-900/95 dark:text-white ${
                toast.leaving ? 'animate-toast-out' : 'animate-toast-in'
            }`}
        >
            <span className={`absolute inset-y-0 left-0 w-1 ${v.accent}`} />
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${v.bg} text-white`}>
                <v.Icon className="h-4 w-4" />
            </span>
            <div className="flex-1 text-sm font-medium leading-relaxed">
                {toast.title && <div className="font-semibold">{toast.title}</div>}
                <div>{toast.message}</div>
            </div>
            <button
                onClick={() => dismissToast(toast.id)}
                className="shrink-0 rounded-lg p-1 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800 dark:hover:text-white"
                aria-label="Fermer"
            >
                <Icon.Close className="h-3.5 w-3.5" />
            </button>
            {toast.duration !== 0 && (
                <span className={`absolute bottom-0 left-0 h-0.5 ${v.accent} animate-toast-progress`} style={{ animationDuration: `${(toast.duration ?? 4200) - 220}ms` }} />
            )}
        </div>
    );
}
