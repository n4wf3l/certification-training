import { useState } from 'react';

/**
 * SVG line chart : percentage per attempt with a passing-score reference line.
 * No external chart dependency — pure math + SVG.
 *
 * Props:
 *   - points: [{ index, percentage, passed, completed_at }]
 *   - passingPercentage: horizontal reference line
 */
export default function EvolutionChart({ points, passingPercentage = 65 }) {
    const [hover, setHover] = useState(null); // index of hovered point
    const W = 640;
    const H = 240;
    const PAD_LEFT = 44;
    const PAD_RIGHT = 24;
    const PAD_TOP = 24;
    const PAD_BOTTOM = 32;
    const innerW = W - PAD_LEFT - PAD_RIGHT;
    const innerH = H - PAD_TOP - PAD_BOTTOM;
    const n = points.length;

    if (n === 0) return null;

    const xAt = (i) => PAD_LEFT + (n === 1 ? innerW / 2 : (innerW * i) / (n - 1));
    const yAt = (pct) => PAD_TOP + innerH - (innerH * Math.max(0, Math.min(100, pct))) / 100;

    const linePath = points
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(2)} ${yAt(p.percentage).toFixed(2)}`)
        .join(' ');
    // Area fill under the curve
    const areaPath = `${linePath} L ${xAt(n - 1).toFixed(2)} ${(PAD_TOP + innerH).toFixed(2)} L ${xAt(0).toFixed(2)} ${(PAD_TOP + innerH).toFixed(2)} Z`;

    const yGridValues = [0, 25, 50, 75, 100];
    const passingY = yAt(passingPercentage);

    const fmtDate = (iso) => {
        if (!iso) return '';
        const d = new Date(iso);
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    };

    return (
        <div className="relative">
            <svg
                viewBox={`0 0 ${W} ${H}`}
                className="h-auto w-full select-none"
                preserveAspectRatio="xMidYMid meet"
                onMouseLeave={() => setHover(null)}
            >
                <defs>
                    <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Y grid lines + labels */}
                {yGridValues.map((v) => {
                    const y = yAt(v);
                    return (
                        <g key={v}>
                            <line
                                x1={PAD_LEFT}
                                x2={W - PAD_RIGHT}
                                y1={y}
                                y2={y}
                                stroke="currentColor"
                                strokeOpacity="0.08"
                                strokeDasharray="3 3"
                            />
                            <text
                                x={PAD_LEFT - 8}
                                y={y}
                                textAnchor="end"
                                dominantBaseline="central"
                                className="fill-current text-[10px] opacity-40"
                                style={{ fontFamily: 'JetBrains Mono, monospace' }}
                            >
                                {v}%
                            </text>
                        </g>
                    );
                })}

                {/* Passing threshold line */}
                <line
                    x1={PAD_LEFT}
                    x2={W - PAD_RIGHT}
                    y1={passingY}
                    y2={passingY}
                    stroke="#f59e0b"
                    strokeWidth="1.5"
                    strokeDasharray="6 4"
                />
                <text
                    x={W - PAD_RIGHT}
                    y={passingY - 6}
                    textAnchor="end"
                    className="fill-amber-500 text-[10px] font-semibold"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                >
                    Seuil {passingPercentage}%
                </text>

                {/* Area fill (below the line) */}
                <path
                    d={areaPath}
                    fill="url(#area-fill)"
                    className="text-brand-500"
                />

                {/* Main line */}
                <path
                    d={linePath}
                    fill="none"
                    stroke="url(#line-gradient)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <defs>
                    <linearGradient id="line-gradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#12ccb0" />
                        <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                </defs>

                {/* Points */}
                {points.map((p, i) => {
                    const cx = xAt(i);
                    const cy = yAt(p.percentage);
                    const active = hover === i;
                    return (
                        <g key={p.attempt_id ?? i}>
                            {/* Invisible larger hit-target */}
                            <rect
                                x={cx - innerW / (n * 2)}
                                y={PAD_TOP}
                                width={innerW / Math.max(1, n)}
                                height={innerH}
                                fill="transparent"
                                onMouseEnter={() => setHover(i)}
                            />
                            <circle
                                cx={cx}
                                cy={cy}
                                r={active ? 6 : 4}
                                fill={p.passed ? '#12ccb0' : '#f43f5e'}
                                stroke="var(--tw-bg-opacity, white)"
                                strokeWidth="2"
                                className="transition-all"
                            />
                        </g>
                    );
                })}

                {/* X labels (attempt number) */}
                {points.map((p, i) => {
                    if (n > 12 && i % Math.ceil(n / 8) !== 0 && i !== n - 1) return null;
                    return (
                        <text
                            key={i}
                            x={xAt(i)}
                            y={H - PAD_BOTTOM + 16}
                            textAnchor="middle"
                            className="fill-current text-[10px] opacity-50"
                            style={{ fontFamily: 'JetBrains Mono, monospace' }}
                        >
                            #{p.index}
                        </text>
                    );
                })}

                {/* Tooltip */}
                {hover !== null && (() => {
                    const p = points[hover];
                    const cx = xAt(hover);
                    const cy = yAt(p.percentage);
                    const boxW = 148;
                    const boxH = 60;
                    let boxX = cx - boxW / 2;
                    if (boxX < PAD_LEFT) boxX = PAD_LEFT;
                    if (boxX + boxW > W - PAD_RIGHT) boxX = W - PAD_RIGHT - boxW;
                    const boxY = Math.max(PAD_TOP, cy - boxH - 12);
                    return (
                        <g pointerEvents="none">
                            <line
                                x1={cx}
                                x2={cx}
                                y1={PAD_TOP}
                                y2={PAD_TOP + innerH}
                                stroke="currentColor"
                                strokeOpacity="0.2"
                                strokeDasharray="3 3"
                            />
                            <rect
                                x={boxX}
                                y={boxY}
                                width={boxW}
                                height={boxH}
                                rx="8"
                                fill="#0b0f17"
                                fillOpacity="0.95"
                                stroke="#ffffff"
                                strokeOpacity="0.08"
                            />
                            <text x={boxX + 12} y={boxY + 18} className="fill-white text-[11px]" style={{ fontFamily: 'Inter, system-ui' }}>
                                Tentative <tspan className="font-mono font-bold">#{p.index}</tspan>
                            </text>
                            <text x={boxX + 12} y={boxY + 34} className="fill-white text-[13px] font-bold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                                {p.percentage}%
                                <tspan className={p.passed ? 'fill-emerald-400' : 'fill-rose-400'} dx="8">
                                    {p.passed ? 'réussi' : 'échoué'}
                                </tspan>
                            </text>
                            <text x={boxX + 12} y={boxY + 50} className="fill-white/60 text-[10px]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                                {fmtDate(p.completed_at)}
                            </text>
                        </g>
                    );
                })()}
            </svg>
        </div>
    );
}
