'use client';

import { useState, useEffect, useRef } from 'react';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from './Input';
import { Button } from './Button';

interface Option {
    id: string;
    label: string;
    subLabel?: string;
}

interface MultiSelectProps {
    options: Option[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
    label?: string;
}

export function MultiSelect({
    options,
    selected,
    onChange,
    placeholder = 'Select items...',
    label
}: MultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    // Handle outside click to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleSelection = (id: string) => {
        if (selected.includes(id)) {
            onChange(selected.filter((item) => item !== id));
        } else {
            onChange([...selected, id]);
        }
    };

    const filteredOptions = options.filter((option) =>
        option.label.toLowerCase().includes(search.toLowerCase()) ||
        (option.subLabel && option.subLabel.toLowerCase().includes(search.toLowerCase()))
    );

    const selectedLabels = selected
        .map((id) => options.find((o) => o.id === id)?.label)
        .filter(Boolean);

    return (
        <div className="relative space-y-2" ref={containerRef}>
            {label && <label className="text-sm font-medium">{label}</label>}

            <div
                className="flex min-h-[40px] w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex flex-wrap gap-1">
                    {selected.length > 0 ? (
                        selectedLabels.map((label, idx) => (
                            <span key={idx} className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs">
                                {label}
                            </span>
                        ))
                    ) : (
                        <span className="text-muted-foreground">{placeholder}</span>
                    )}
                </div>
                <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-50 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none bg-white dark:bg-slate-950 mt-1"
                    >
                        <div className="flex items-center border-b px-3">
                            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            <input
                                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Search..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                        <div className="max-h-[200px] overflow-y-auto p-1">
                            {filteredOptions.length === 0 ? (
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                    No items found.
                                </div>
                            ) : (
                                filteredOptions.map((option) => {
                                    const isSelected = selected.includes(option.id);
                                    return (
                                        <div
                                            key={option.id}
                                            className={`relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${isSelected ? 'bg-accent/50' : ''}`}
                                            onClick={() => toggleSelection(option.id)}
                                        >
                                            <div className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary ${isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible'}`}>
                                                <Check className="h-4 w-4" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span>{option.label}</span>
                                                {option.subLabel && <span className="text-xs text-muted-foreground">{option.subLabel}</span>}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
