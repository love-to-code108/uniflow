"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicCalanderCell from './PublicCalanderCell';
import { getPublicEvents } from '@/actions/calendar';

export default function PublicCalander() {
    const now = new Date();
    const [currentMonth, setCurrentMonth] = useState(now.getMonth());
    const [currentYear, setCurrentYear] = useState(now.getFullYear());
    const [monthData, setMonthData] = useState({});

    const getCalendarGrid = (year, month) => {
        const dates = [];
        const firstDay = new Date(year, month, 1);
        const startOffset = firstDay.getDay();
        const lastDay = new Date(year, month + 1, 0).getDate();
        const totalSlotsNeeded = startOffset + lastDay;
        const numCells = totalSlotsNeeded <= 35 ? 35 : 42;

        const startDate = new Date(firstDay);
        startDate.setDate(firstDay.getDate() - startOffset);

        for (let i = 0; i < numCells; i++) {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() + i);
            dates.push({
                day: d.getDate(),
                month: d.getMonth() + 1,
                year: d.getFullYear(),
                isCurrentMonth: d.getMonth() === month,
                isToday: d.toDateString() === new Date().toDateString(),
            });
        }
        return dates;
    };

    const monthName = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const calander = useMemo(() => getCalendarGrid(currentYear, currentMonth), [currentYear, currentMonth]);

    useEffect(() => {
        const fetchData = async () => {
            const res = await getPublicEvents(currentYear, currentMonth + 1);
            if (res.status === "SUCCESS") {
                setMonthData(res.data);
            }
        };
        fetchData();
    }, [currentMonth, currentYear]);

    const nextMonth = () => {
        const nextDate = new Date(currentYear, currentMonth + 1, 1);
        setCurrentMonth(nextDate.getMonth());
        setCurrentYear(nextDate.getFullYear());
    };

    const prevMonth = () => {
        const prevDate = new Date(currentYear, currentMonth - 1, 1);
        setCurrentMonth(prevDate.getMonth());
        setCurrentYear(prevDate.getFullYear());
    };

    return (
        <div className='w-full max-w-screen-2xl mx-auto'>
            <div className='flex mt-4 mb-8 px-4 justify-between items-center'>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">College Events</h2>
                    <p className="text-muted-foreground mt-1 text-sm">Discover and register for upcoming events.</p>
                </div>

                <div className='flex w-[300px] justify-around items-center'>
                    <Button variant='outline' className="rounded-full" onClick={prevMonth}>
                        <ChevronLeft />
                    </Button>
                    <div className='flex justify-center items-center text-xl font-semibold w-[160px]'>
                        <span className='mr-2'>{monthName[currentMonth]}</span>
                        <span>{currentYear}</span>
                    </div>
                    <Button variant='outline' className="rounded-full" onClick={nextMonth}>
                        <ChevronRight />
                    </Button>
                </div>
            </div>

            <div className='w-full h-full border rounded-lg shadow-sm overflow-hidden bg-card'>
                <div className='grid grid-cols-7 py-3 bg-muted/50 border-b text-center text-sm font-semibold text-muted-foreground'>
                    <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                </div>

                <div className='w-full grid grid-cols-7'>
                    {calander.map((value, index) => {
                        const dateKey = `${value.year}-${String(value.month).padStart(2, '0')}-${String(value.day).padStart(2, '0')}`;
                        return (
                            <PublicCalanderCell
                                key={index}
                                value={value}
                                dayData={monthData[dateKey] || []}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}