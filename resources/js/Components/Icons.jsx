// Inline SVG icons (Lucide-inspired). Never use emojis in this codebase.
// Usage : <Icon.Check className="h-4 w-4" />

const base = 'shrink-0';

const wrap = (paths, extra = {}) => function IconComponent({ className = '', ...rest }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`${base} ${className}`}
            aria-hidden="true"
            {...extra}
            {...rest}
        >
            {paths}
        </svg>
    );
};

export const Check = wrap(<path d="M5 13l4 4L19 7" />);
export const Close = wrap(<path d="M6 6l12 12M18 6L6 18" />);
export const ArrowRight = wrap(<path d="M5 12h14M13 5l7 7-7 7" />);
export const ArrowLeft = wrap(<path d="M19 12H5M11 5l-7 7 7 7" />);
export const Refresh = wrap(<><path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 4v5h-5" /></>);
export const Book = wrap(<><path d="M4 4h11a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4V4z" /><path d="M4 16a4 4 0 0 1 4-4h11" /></>);
export const Cards = wrap(<><rect x="3" y="6" width="14" height="14" rx="2" /><path d="M7 6V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-2" /></>);
export const Timer = wrap(<><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2M9 2h6" /></>);
export const Trophy = wrap(<><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z" /><path d="M17 4h3v2a3 3 0 0 1-3 3M7 4H4v2a3 3 0 0 0 3 3" /></>);
export const Target = wrap(<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>);
export const Sparkles = wrap(<><path d="M12 3v3M12 18v3M3 12h3M18 12h3" /><path d="M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2" /><circle cx="12" cy="12" r="2.5" /></>);
export const Bolt = wrap(<path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z" />);
export const Hand = wrap(<path d="M7 11V6a2 2 0 1 1 4 0v5M11 11V4a2 2 0 1 1 4 0v7M15 11V6a2 2 0 1 1 4 0v9a6 6 0 0 1-6 6h-2a6 6 0 0 1-5.66-4L4 12a2 2 0 1 1 3.66-1.6l.34.6" />);
export const Shuffle = wrap(<><path d="M16 3h5v5M4 20l17-17M21 16v5h-5M15 15l6 6M4 4l5 5" /></>);
export const ChevronDown = wrap(<path d="M6 9l6 6 6-6" />);
export const Menu = wrap(<><path d="M4 7h16M4 12h16M4 17h16" /></>);
export const Logo = wrap(<path d="M4 14 8 10l4 4 8-8" />, { strokeWidth: 2.4 });
export const ArrowUp = wrap(<path d="M12 19V5M5 12l7-7 7 7" />);
export const ArrowDown = wrap(<path d="M12 5v14M5 12l7 7 7-7" />);
export const Equal = wrap(<path d="M5 9h14M5 15h14" />);
export const User = wrap(<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>);
export const LogOut = wrap(<><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><path d="M10 17l5-5-5-5M15 12H3" /></>);
export const Chart = wrap(<><path d="M3 3v18h18" /><path d="M7 15l4-4 3 3 5-6" /></>);
export const Sun = wrap(<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></>);
export const Moon = wrap(<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />);
export const Shield = wrap(<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></>);
export const Heart = wrap(<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />);
export const Mail = wrap(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>);
export const Github = wrap(<path d="M12 2a10 10 0 0 0-3.16 19.5c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.6 9.6 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z" />);

const Icon = { Check, Close, ArrowRight, ArrowLeft, ArrowUp, ArrowDown, Equal, Refresh, Book, Cards, Timer, Trophy, Target, Sparkles, Bolt, Hand, Shuffle, ChevronDown, Menu, Logo, User, LogOut, Chart, Sun, Moon, Shield, Heart, Mail, Github };
export default Icon;
