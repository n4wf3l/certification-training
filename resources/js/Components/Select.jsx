import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import Icon from '@/Components/Icons';
import CertLogo from '@/Components/CertLogo';

/**
 * Accessible dropdown/select built on Headless UI v2 Listbox.
 *
 * options: [
 *   { value, label, logo?: {title, logo_path}, description?: string }
 * ]
 */
export default function Select({
    value,
    onChange,
    options = [],
    placeholder = 'Choisir…',
    className = '',
    disabled = false,
    size = 'md',
    hideLogoInButton = false,
}) {
    const selected = options.find((o) => String(o.value) === String(value));

    const padding = size === 'sm' ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm';
    const logoSize = size === 'sm' ? 'sm' : 'md';

    return (
        <Listbox value={value} onChange={onChange} disabled={disabled}>
            <ListboxButton
                className={`
                    group flex w-full items-center gap-2.5 rounded-xl border border-ink-200 bg-white text-left shadow-sm outline-none transition
                    hover:border-ink-300
                    focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15
                    disabled:cursor-not-allowed disabled:opacity-50
                    dark:border-ink-800 dark:bg-ink-950/60 dark:hover:border-ink-700 dark:focus:border-brand-500
                    data-[open]:border-brand-500 data-[open]:ring-4 data-[open]:ring-brand-500/15
                    ${padding} ${className}
                `}
            >
                {selected?.logo && !hideLogoInButton && <CertLogo certification={selected.logo} size={logoSize} />}
                <span className={`min-w-0 flex-1 truncate ${selected ? 'text-ink-900 dark:text-white' : 'text-ink-400'}`}>
                    {selected ? selected.label : placeholder}
                </span>
                <Icon.ChevronDown className="h-4 w-4 shrink-0 text-ink-400 transition group-data-[open]:rotate-180 group-data-[open]:text-ink-700 dark:group-data-[open]:text-ink-200" />
            </ListboxButton>
            <ListboxOptions
                anchor={{ to: 'bottom start', gap: 6 }}
                transition
                modal={false}
                className="
                    z-50 w-[var(--button-width)] max-h-72 origin-top overflow-auto rounded-xl border border-ink-200 bg-white p-1 shadow-xl focus:outline-none
                    transition duration-100 ease-out
                    data-[closed]:scale-95 data-[closed]:opacity-0
                    dark:border-ink-800 dark:bg-ink-900
                "
            >
                {options.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-ink-400">Aucune option</div>
                ) : (
                    options.map((option) => (
                        <ListboxOption
                            key={String(option.value)}
                            value={option.value}
                            className="
                                group flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-700
                                data-[focus]:bg-ink-100 data-[focus]:text-ink-900
                                data-[selected]:bg-brand-500/10 data-[selected]:font-semibold data-[selected]:text-brand-600
                                dark:text-ink-200
                                dark:data-[focus]:bg-ink-800 dark:data-[focus]:text-white
                                dark:data-[selected]:bg-brand-500/15 dark:data-[selected]:text-brand-300
                            "
                        >
                            {option.logo && <CertLogo certification={option.logo} size="sm" />}
                            <div className="min-w-0 flex-1">
                                <div className="truncate">{option.label}</div>
                                {option.description && (
                                    <div className="mt-0.5 truncate text-xs font-normal text-ink-500 dark:text-ink-400">
                                        {option.description}
                                    </div>
                                )}
                            </div>
                            <Icon.Check className="h-4 w-4 shrink-0 opacity-0 group-data-[selected]:opacity-100" />
                        </ListboxOption>
                    ))
                )}
            </ListboxOptions>
        </Listbox>
    );
}
