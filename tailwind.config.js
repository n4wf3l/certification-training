import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', ...defaultTheme.fontFamily.sans],
                mono: ['"JetBrains Mono"', ...defaultTheme.fontFamily.mono],
            },
            colors: {
                ink: {
                    50: '#f7f8fa',
                    100: '#eef0f4',
                    200: '#d9dde5',
                    300: '#b6bcca',
                    400: '#8a92a5',
                    500: '#646c81',
                    600: '#4a5165',
                    700: '#363c4c',
                    800: '#1f2431',
                    900: '#141822',
                    950: '#0b0f17',
                },
                brand: {
                    50: '#eefefa',
                    100: '#d0fbf1',
                    200: '#a2f6e5',
                    300: '#64e9d1',
                    400: '#2fd4b7',
                    500: '#12ccb0',
                    600: '#0aa189',
                    700: '#0f7f6f',
                    800: '#12655a',
                    900: '#14544c',
                },
                iris: {
                    500: '#06b6d4',
                    600: '#0891b2',
                },
            },
            backgroundImage: {
                'grid-dark': "linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)",
                'grid-light': "linear-gradient(rgba(15,23,42,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,.05) 1px, transparent 1px)",
                'radial-brand': 'radial-gradient(ellipse at top, rgba(18,204,176,.25), transparent 60%)',
                'aurora': 'conic-gradient(from 180deg at 50% 50%, #12ccb0 0deg, #06b6d4 120deg, #22d3ee 240deg, #12ccb0 360deg)',
            },
            boxShadow: {
                'glow': '0 0 40px -8px rgba(18, 204, 176, 0.40)',
                'glow-lg': '0 0 80px -12px rgba(6, 182, 212, 0.45)',
                'inset-line': 'inset 0 1px 0 0 rgba(255,255,255,.06)',
            },
            keyframes: {
                'shimmer': {
                    '0%, 100%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                },
                'float': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-6px)' },
                },
                'fade-up': {
                    '0%': { opacity: '0', transform: 'translateY(12px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                'scale-in': {
                    '0%': { opacity: '0', transform: 'scale(.96)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                'toast-in': {
                    '0%': { opacity: '0', transform: 'translateX(120%)' },
                    '80%': { opacity: '1', transform: 'translateX(-4px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                'toast-out': {
                    '0%': { opacity: '1', transform: 'translateX(0)' },
                    '100%': { opacity: '0', transform: 'translateX(120%)' },
                },
                'toast-progress': {
                    '0%': { width: '100%' },
                    '100%': { width: '0%' },
                },
                'stagger-in': {
                    '0%': { opacity: '0', transform: 'translateY(16px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
            animation: {
                'shimmer': 'shimmer 6s ease-in-out infinite',
                'float': 'float 4s ease-in-out infinite',
                'fade-up': 'fade-up .45s cubic-bezier(.22,1,.36,1) both',
                'fade-in': 'fade-in .3s ease-out both',
                'scale-in': 'scale-in .35s cubic-bezier(.22,1,.36,1) both',
                'toast-in': 'toast-in .35s cubic-bezier(.22,1,.36,1) both',
                'toast-out': 'toast-out .22s ease-in both',
                'toast-progress': 'toast-progress linear forwards',
                'stagger-in': 'stagger-in .5s cubic-bezier(.22,1,.36,1) both',
            },
        },
    },

    plugins: [forms],
};
