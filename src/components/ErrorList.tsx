import { useState } from 'react';
import {
    Box,
    Chip,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Badge,
    Tooltip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterListIcon from '@mui/icons-material/FilterList';
import type { FixChange } from '../api/yaml-fixer-api';

interface ErrorListProps {
    changes: FixChange[];
    onLineClick?: (line: number) => void;
}

const severityColors = {
    critical: { bg: '#fee', color: '#c00', border: '#fcc' },
    error: { bg: '#fee', color: '#c00', border: '#fcc' },
    warning: { bg: '#fff3cd', color: '#856404', border: '#ffeaa7' },
    info: { bg: '#e3f2fd', color: '#0277bd', border: '#bbdefb' }
};

const typeLabels: Record<string, string> = {
    'INDENT': 'Indentation',
    'KEY_FIX': 'Typo Fix',
    'COLON': 'Missing Colon',
    'LIST': 'List Spacing',
    'QUOTE': 'Quote Fix',
    'STRUCTURE': 'Structure',
    'NUMERIC': 'Type Conversion',
    'DUPLICATE': 'Duplicate Key',
    'ANCHOR': 'Anchor/Alias'
};

export function ErrorList({ changes, onLineClick }: ErrorListProps) {
    const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
    const [expandedType, setExpandedType] = useState<string | false>(false);

    // Group changes by type
    const groupedChanges = changes.reduce((acc, change) => {
        if (!acc[change.type]) {
            acc[change.type] = [];
        }
        acc[change.type].push(change);
        return acc;
    }, {} as Record<string, FixChange[]>);

    // Filter changes
    const filteredGroups = Object.entries(groupedChanges).reduce((acc, [type, items]) => {
        const filtered = items.filter(item =>
            filter === 'all' || item.severity === filter
        );
        if (filtered.length > 0) {
            acc[type] = filtered;
        }
        return acc;
    }, {} as Record<string, FixChange[]>);

    const handleAccordionChange = (type: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
        setExpandedType(isExpanded ? type : false);
    };

    if (changes.length === 0) {
        return (
            <Box className="p-6 text-center text-gray-500">
                <Typography variant="body2">No issues found</Typography>
            </Box>
        );
    }

    return (
        <Box className="h-full overflow-auto">
            {/* Filter Bar */}
            <Box className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3 flex items-center gap-2 z-10">
                <FilterListIcon fontSize="small" className="text-gray-500" />
                <Typography variant="caption" className="text-gray-600 dark:text-gray-400 mr-2">
                    Filter:
                </Typography>
                <Chip
                    label="All"
                    size="small"
                    onClick={() => setFilter('all')}
                    color={filter === 'all' ? 'primary' : 'default'}
                    variant={filter === 'all' ? 'filled' : 'outlined'}
                />
                <Chip
                    label="Critical"
                    size="small"
                    onClick={() => setFilter('critical')}
                    sx={{
                        bgcolor: filter === 'critical' ? severityColors.critical.bg : 'transparent',
                        color: filter === 'critical' ? severityColors.critical.color : 'inherit',
                        borderColor: filter === 'critical' ? severityColors.critical.border : 'inherit'
                    }}
                    variant="outlined"
                />
                <Chip
                    label="Warning"
                    size="small"
                    onClick={() => setFilter('warning')}
                    sx={{
                        bgcolor: filter === 'warning' ? severityColors.warning.bg : 'transparent',
                        color: filter === 'warning' ? severityColors.warning.color : 'inherit',
                        borderColor: filter === 'warning' ? severityColors.warning.border : 'inherit'
                    }}
                    variant="outlined"
                />
                <Chip
                    label="Info"
                    size="small"
                    onClick={() => setFilter('info')}
                    sx={{
                        bgcolor: filter === 'info' ? severityColors.info.bg : 'transparent',
                        color: filter === 'info' ? severityColors.info.color : 'inherit',
                        borderColor: filter === 'info' ? severityColors.info.border : 'inherit'
                    }}
                    variant="outlined"
                />
            </Box>

            {/* Grouped Error List */}
            <Box className="p-4">
                {Object.entries(filteredGroups).map(([type, items]) => (
                    <Accordion
                        key={type}
                        expanded={expandedType === type}
                        onChange={handleAccordionChange(type)}
                        className="mb-2"
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Box className="flex items-center gap-3 w-full">
                                <Badge badgeContent={items.length} color="primary">
                                    <Chip
                                        label={typeLabels[type] || type}
                                        size="small"
                                        color="default"
                                    />
                                </Badge>
                                <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
                                    {items.length} {items.length === 1 ? 'fix' : 'fixes'}
                                </Typography>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box className="space-y-3">
                                {items.map((changeItem, idx) => (
                                    <Box
                                        key={`${changeItem.line}-${idx}`}
                                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
                                        onClick={() => onLineClick?.(changeItem.line)}
                                    >
                                        {/* Header */}
                                        <Box className="flex items-center gap-2 mb-2">
                                            <Tooltip title={`Line ${changeItem.line}`}>
                                                <Box
                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                                                    sx={{
                                                        bgcolor: severityColors[changeItem.severity].bg,
                                                        color: severityColors[changeItem.severity].color,
                                                        border: `1px solid ${severityColors[changeItem.severity].border}`
                                                    }}
                                                >
                                                    {changeItem.line}
                                                </Box>
                                            </Tooltip>
                                            <Chip
                                                label={changeItem.severity.toUpperCase()}
                                                size="small"
                                                sx={{
                                                    bgcolor: severityColors[changeItem.severity].bg,
                                                    color: severityColors[changeItem.severity].color,
                                                    fontWeight: 'bold',
                                                    fontSize: '0.7rem'
                                                }}
                                            />
                                            <Typography variant="body2" className="flex-1 text-gray-700 dark:text-gray-300">
                                                {changeItem.reason}
                                            </Typography>
                                        </Box>

                                        {/* Code Diff */}
                                        {changeItem.original && changeItem.fixed && changeItem.type !== 'structure' && (
                                            <Box className="mt-2 space-y-1">
                                                <Box className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-2 rounded">
                                                    <Typography variant="caption" className="text-red-700 dark:text-red-300 font-mono block">
                                                        - {changeItem.original.trim()}
                                                    </Typography>
                                                </Box>
                                                <Box className="flex items-center justify-center">
                                                    <Typography variant="caption" className="text-gray-400">↓</Typography>
                                                </Box>
                                                <Box className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-2 rounded">
                                                    <Typography variant="caption" className="text-green-700 dark:text-green-300 font-mono block">
                                                        + {changeItem.fixed.trim()}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        )}
                                    </Box>
                                ))}
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                ))}
            </Box>
        </Box>
    );
}
