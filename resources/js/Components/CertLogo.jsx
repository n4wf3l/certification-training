export default function CertLogo({ certification, size = 'md', className = '' }) {
    const dims = {
        sm: 'h-6 w-6 text-[9px]',
        md: 'h-10 w-10 text-xs',
        lg: 'h-14 w-14 text-sm',
        xl: 'h-20 w-20 text-base',
    }[size] || 'h-10 w-10 text-xs';

    if (certification?.logo_path) {
        return (
            <img
                src={`/storage/${certification.logo_path}`}
                alt={certification.title || 'logo'}
                className={`${dims} shrink-0 rounded-lg object-contain ${className}`}
            />
        );
    }

    const initials = (certification?.title || '?')
        .replace(/[^A-Za-z0-9 ]/g, '')
        .split(' ')
        .filter(Boolean)
        .map((w) => w[0])
        .slice(0, 3)
        .join('')
        .toUpperCase();

    return (
        <div className={`${dims} flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-iris-500 font-mono font-bold tracking-tighter text-white ${className}`}>
            {initials || '?'}
        </div>
    );
}
