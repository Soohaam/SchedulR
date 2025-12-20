'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export type CalendarProps = {
    mode?: 'single';
    selected?: Date;
    onSelect?: (date: Date | undefined) => void;
    disabled?: (date: Date) => boolean;
    className?: string;
};

export function Calendar({
    mode = 'single',
    selected,
    onSelect,
    disabled,
    className = '',
}: CalendarProps) {
    const [currentMonth, setCurrentMonth] = React.useState(new Date());

    const daysInMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        0
    ).getDate();

    const firstDayOfMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        1
    ).getDay();

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    const previousMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const selectDate = (day: number) => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        if (disabled && disabled(date)) return;
        onSelect?.(date);
    };

    const isSelected = (day: number) => {
        if (!selected) return false;
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        return (
            date.getDate() === selected.getDate() &&
            date.getMonth() === selected.getMonth() &&
            date.getFullYear() === selected.getFullYear()
        );
    };

    const isDisabled = (day: number) => {
        if (!disabled) return false;
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        return disabled(date);
    };

    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(<div key={`empty-${i}`} className="p-2" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const isSelectedDay = isSelected(day);
        const isDisabledDay = isDisabled(day);

        days.push(
            <button
                key={day}
                onClick={() => selectDate(day)}
                disabled={isDisabledDay}
                className={`
          p-2 text-sm rounded-md transition-colors
          ${isSelectedDay
                        ? 'bg-accent text-accent-foreground font-semibold'
                        : 'hover:bg-secondary'
                    }
          ${isDisabledDay
                        ? 'text-muted-foreground/40 cursor-not-allowed hover:bg-transparent'
                        : 'text-foreground cursor-pointer'
                    }
        `}
            >
                {day}
            </button>
        );
    }

    return (
        <div className={`p-4 bg-card rounded-lg ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={previousMonth}
                    className="h-8 w-8 p-0"
                >
                    <ChevronLeft className="w-4 h-4" />
                </Button>
                <h2 className="text-lg font-semibold text-primary">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h2>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={nextMonth}
                    className="h-8 w-8 p-0"
                >
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>

            {/* Day names */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map((name) => (
                    <div
                        key={name}
                        className="p-2 text-center text-xs font-medium text-muted-foreground"
                    >
                        {name}
                    </div>
                ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-1">
                {days}
            </div>
        </div>
    );
}
