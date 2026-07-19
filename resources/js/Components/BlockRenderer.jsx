import Icon from '@/Components/Icons';

// Inline text renderer — supports **bold**, *italic*, `code`, [text](url)
function renderInline(text) {
    if (typeof text !== 'string') return text;
    const parts = [];
    const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
    let last = 0;
    let m;
    let key = 0;
    while ((m = re.exec(text)) !== null) {
        if (m.index > last) parts.push(text.slice(last, m.index));
        const tok = m[0];
        if (tok.startsWith('**')) {
            parts.push(<strong key={key++} className="font-semibold text-ink-900 dark:text-white">{tok.slice(2, -2)}</strong>);
        } else if (tok.startsWith('*')) {
            parts.push(<em key={key++}>{tok.slice(1, -1)}</em>);
        } else if (tok.startsWith('`')) {
            parts.push(
                <code key={key++} className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[0.9em] text-ink-900 dark:bg-ink-800 dark:text-ink-100">
                    {tok.slice(1, -1)}
                </code>
            );
        } else if (tok.startsWith('[')) {
            const linkMatch = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
            if (linkMatch) {
                parts.push(
                    <a key={key++} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-brand-600 underline underline-offset-2 hover:text-brand-500 dark:text-brand-300">
                        {linkMatch[1]}
                    </a>
                );
            }
        }
        last = m.index + tok.length;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts.length ? parts : text;
}

function Heading({ level = 2, text, id }) {
    const styles = {
        1: 'mt-14 text-3xl font-bold tracking-tight text-ink-900 dark:text-white sm:text-4xl',
        2: 'mt-12 text-2xl font-semibold tracking-tight text-ink-900 dark:text-white sm:text-3xl',
        3: 'mt-8 text-lg font-semibold tracking-tight text-ink-900 dark:text-white sm:text-xl',
    };
    const Tag = `h${Math.min(4, Math.max(1, level)) + 1}`; // shift down (h1 → h2 to keep page h1)
    return (
        <Tag id={id} className={styles[level] || styles[2]}>
            {level === 1 && (
                <span className="mr-3 inline-block font-mono text-sm font-medium text-ink-400">§</span>
            )}
            {renderInline(text)}
        </Tag>
    );
}

function Paragraph({ text }) {
    return (
        <p className="mt-4 text-base leading-relaxed text-ink-700 dark:text-ink-300">
            {renderInline(text)}
        </p>
    );
}

function List({ style = 'bulleted', items = [] }) {
    const Tag = style === 'numbered' ? 'ol' : 'ul';
    const listStyle = style === 'numbered' ? 'list-decimal' : 'list-disc';
    return (
        <Tag className={`mt-4 ml-5 space-y-2 ${listStyle} text-base text-ink-700 dark:text-ink-300 marker:text-ink-400`}>
            {items.map((it, i) => (
                <li key={i} className="pl-1 leading-relaxed">{renderInline(String(it))}</li>
            ))}
        </Tag>
    );
}

const CALLOUT_STYLES = {
    info: {
        border: 'border-brand-500/30',
        bg: 'bg-brand-500/5',
        text: 'text-brand-600 dark:text-brand-300',
        label: 'text-brand-700 dark:text-brand-200',
        icon: Icon.Sparkles,
    },
    success: {
        border: 'border-emerald-500/30',
        bg: 'bg-emerald-500/5',
        text: 'text-emerald-600 dark:text-emerald-300',
        label: 'text-emerald-700 dark:text-emerald-200',
        icon: Icon.Check,
    },
    warn: {
        border: 'border-amber-500/30',
        bg: 'bg-amber-500/5',
        text: 'text-amber-600 dark:text-amber-300',
        label: 'text-amber-700 dark:text-amber-200',
        icon: Icon.Bolt,
    },
    danger: {
        border: 'border-rose-500/30',
        bg: 'bg-rose-500/5',
        text: 'text-rose-600 dark:text-rose-300',
        label: 'text-rose-700 dark:text-rose-200',
        icon: Icon.Close,
    },
};

function Callout({ variant = 'info', title, body }) {
    const s = CALLOUT_STYLES[variant] || CALLOUT_STYLES.info;
    const I = s.icon;
    return (
        <div className={`mt-6 rounded-2xl border ${s.border} ${s.bg} p-5`}>
            <div className={`flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] ${s.text}`}>
                <I className="h-3.5 w-3.5" />
                {variant === 'info' && 'À retenir'}
                {variant === 'success' && 'Bonne pratique'}
                {variant === 'warn' && 'Attention'}
                {variant === 'danger' && 'Piège fréquent'}
            </div>
            {title && (
                <div className={`mt-2 text-base font-semibold ${s.label}`}>
                    {renderInline(title)}
                </div>
            )}
            {body && (
                <div className="mt-1.5 text-sm leading-relaxed text-ink-700 dark:text-ink-200">
                    {renderInline(body)}
                </div>
            )}
        </div>
    );
}

function KeyTerms({ items = [] }) {
    return (
        <dl className="mt-6 divide-y divide-ink-200 rounded-2xl border border-ink-200 dark:divide-ink-800 dark:border-ink-800">
            {items.map((it, i) => (
                <div key={i} className="grid gap-1 px-5 py-4 sm:grid-cols-3 sm:gap-4">
                    <dt className="font-mono text-sm font-semibold uppercase tracking-wider text-ink-900 dark:text-white">
                        {it.term}
                    </dt>
                    <dd className="text-sm leading-relaxed text-ink-700 dark:text-ink-300 sm:col-span-2">
                        {renderInline(it.definition)}
                    </dd>
                </div>
            ))}
        </dl>
    );
}

function Steps({ items = [] }) {
    return (
        <ol className="mt-6 space-y-4">
            {items.map((it, i) => (
                <li key={i} className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-900 font-mono text-xs font-semibold text-white dark:bg-white dark:text-ink-900">
                        {String(i + 1).padStart(2, '0')}
                    </div>
                    <div className="min-w-0 flex-1 pt-1">
                        {it.title && (
                            <div className="font-semibold text-ink-900 dark:text-white">
                                {renderInline(it.title)}
                            </div>
                        )}
                        {it.body && (
                            <div className="mt-1 text-sm leading-relaxed text-ink-700 dark:text-ink-300">
                                {renderInline(it.body)}
                            </div>
                        )}
                    </div>
                </li>
            ))}
        </ol>
    );
}

function Comparison({ columns = [], rows = [] }) {
    return (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-ink-200 dark:border-ink-800">
            <table className="w-full min-w-[600px] text-sm">
                <thead className="bg-ink-50 text-left font-mono text-[10px] uppercase tracking-widest text-ink-500 dark:bg-ink-900/60">
                    <tr>
                        <th className="px-4 py-3 font-medium"></th>
                        {columns.map((c, i) => (
                            <th key={i} className="px-4 py-3 font-medium text-ink-900 dark:text-white">
                                {c}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-ink-200 dark:divide-ink-800">
                    {rows.map((r, i) => (
                        <tr key={i}>
                            <td className="px-4 py-3 font-semibold text-ink-900 dark:text-white">
                                {renderInline(r.label)}
                            </td>
                            {(r.values || []).map((v, j) => (
                                <td key={j} className="px-4 py-3 text-ink-700 dark:text-ink-300">
                                    {renderInline(String(v))}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function Example({ title, body }) {
    return (
        <div className="mt-6 rounded-2xl border-l-4 border-ink-900 bg-ink-50/60 py-4 pl-5 pr-4 dark:border-white dark:bg-ink-900/40">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500">
                Exemple
            </div>
            {title && (
                <div className="mt-1 text-base font-semibold text-ink-900 dark:text-white">
                    {renderInline(title)}
                </div>
            )}
            {body && (
                <div className="mt-1 text-sm leading-relaxed text-ink-700 dark:text-ink-300">
                    {renderInline(body)}
                </div>
            )}
        </div>
    );
}

function Code({ language, content }) {
    return (
        <div className="mt-6 overflow-hidden rounded-2xl border border-ink-200 dark:border-ink-800">
            {language && (
                <div className="border-b border-ink-200 bg-ink-50/60 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-ink-500 dark:border-ink-800 dark:bg-ink-900/60">
                    {language}
                </div>
            )}
            <pre className="overflow-x-auto bg-ink-950 p-4 text-xs leading-relaxed text-ink-100">
                <code>{content}</code>
            </pre>
        </div>
    );
}

function Summary({ title = 'À retenir', items = [] }) {
    return (
        <div className="mt-8 rounded-2xl border border-ink-900 bg-ink-900 p-6 text-white dark:border-white dark:bg-white dark:text-ink-900">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] opacity-70">
                <Icon.Target className="h-3.5 w-3.5" />
                {title}
            </div>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed">
                {items.map((it, i) => (
                    <li key={i} className="flex gap-2">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current opacity-70" />
                        <span>{renderInline(String(it))}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function Block({ block }) {
    if (!block || typeof block !== 'object') return null;
    switch (block.type) {
        case 'heading':
            return <Heading level={block.level} text={block.text} id={block.id} />;
        case 'paragraph':
            return <Paragraph text={block.text} />;
        case 'list':
            return <List style={block.style} items={block.items} />;
        case 'callout':
            return <Callout variant={block.variant} title={block.title} body={block.body} />;
        case 'key_terms':
            return <KeyTerms items={block.items} />;
        case 'steps':
            return <Steps items={block.items} />;
        case 'comparison':
            return <Comparison columns={block.columns} rows={block.rows} />;
        case 'example':
            return <Example title={block.title} body={block.body} />;
        case 'code':
            return <Code language={block.language} content={block.content} />;
        case 'summary':
            return <Summary title={block.title} items={block.items} />;
        default:
            return null;
    }
}

export default function BlockRenderer({ blocks = [] }) {
    if (!Array.isArray(blocks) || blocks.length === 0) return null;
    return (
        <div className="prose-none">
            {blocks.map((b, i) => <Block key={i} block={b} />)}
        </div>
    );
}

export { renderInline };
