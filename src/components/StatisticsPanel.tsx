import React, { useEffect, useState } from 'react';

interface StatisticsPanelProps {
    totalIssues: number;
    fixedCount: number;
    processingTimeMs?: number;
    confidence?: number;
}

interface StatCardProps {
    label: string;
    value: string | number;
    subtext?: string;
    icon?: React.ReactNode;
    color?: string;
    delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, subtext, icon, color = 'var(--color-blue)', delay = 0 }) => {
    const [displayValue, setDisplayValue] = useState(0);
    const numericValue = typeof value === 'number' ? value : parseInt(value.toString().replace(/[^0-9]/g, '')) || 0;
    const isPercentage = value.toString().includes('%');

    useEffect(() => {
        let start = 0;
        const end = numericValue;
        const duration = 1000;
        const increment = end / (duration / 16);

        if (end === 0) {
            setDisplayValue(0);
            return;
        }

        const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
                setDisplayValue(end);
                clearInterval(timer);
            } else {
                setDisplayValue(Math.floor(start));
            }
        }, 16);

        return () => clearInterval(timer);
    }, [numericValue]);

    return (
        <div
            className="bg-[var(--color-bg-secondary)]/40 rounded-xl p-4 border border-[var(--glass-border)] animate-fade-in-soft hover:bg-[var(--color-bg-secondary)]/60 transition-all"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="flex items-start justify-between mb-2">
                <span className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">{label}</span>
                {icon && <div className={`text-[${color}] opacity-80`}>{icon}</div>}
            </div>
            <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-[var(--color-text-primary)]" style={{ color }}>
                    {isPercentage ? `${displayValue}%` : displayValue}
                </span>
                {subtext && <span className="text-[10px] text-[var(--color-text-tertiary)]">{subtext}</span>}
            </div>
        </div>
    );
};

export const StatisticsPanel: React.FC<StatisticsPanelProps> = ({
    totalIssues,
    fixedCount,
    processingTimeMs = 0,
    confidence = 0
}) => {
    return (
        <div className="grid grid-cols-2 gap-3 mb-4">
            <StatCard
                label="Total Issues"
                value={totalIssues}
                icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                }
                color={totalIssues > 0 ? 'var(--color-orange)' : 'var(--color-green)'}
                delay={0}
            />

            <StatCard
                label="Fixes Applied"
                value={fixedCount}
                subtext={fixedCount > 0 ? "Automatically resolved" : "No changes needed"}
                icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                }
                color="var(--color-blue)"
                delay={100}
            />

            <StatCard
                label="Confidence"
                value={`${Math.round(confidence * 100)}%`}
                subtext="AI Certainty Score"
                icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                }
                color={confidence >= 0.9 ? 'var(--color-green)' : confidence >= 0.7 ? 'var(--color-orange)' : 'var(--color-red)'}
                delay={200}
            />

            <StatCard
                label="Processing Time"
                value={processingTimeMs}
                subtext="milliseconds"
                icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                }
                color="var(--color-text-secondary)"
                delay={300}
            />
        </div>
    );
};
