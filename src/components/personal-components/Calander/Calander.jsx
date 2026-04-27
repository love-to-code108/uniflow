"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import CalanderCell from './calanderCell';
import { calanderStore } from '@/store/globalStates';
import { getCalendarData } from '@/actions/calendar';

export default function Calendar() {
  const [printCalander, setPrintCalander] = useState([]);
  const [monthData, setMonthData] = useState({});
  
  // --- NEW: The Local Filter State ---
  const [activeFilter, setActiveFilter] = useState("all"); 

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
  }

  const year = calanderStore((state) => state.year)
  const month = calanderStore((state) => state.month);
  const refreshTrigger = calanderStore((state) => state.refreshTrigger);
  const nextMonth = calanderStore((state) => state.nextMonth)
  const prevMonth = calanderStore((state) => state.prevMonth);

  const monthName = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  var calander = useMemo(() => {
    return getCalendarGrid(year, month)
  }, [year, month])

  useEffect(() => {
    setPrintCalander(calander);
    const fetchData = async () => {
      const res = await getCalendarData(year, month + 1);
      if (res.status === "SUCCESS") {
        setMonthData(res.data);
      }
    };
    fetchData();
  }, [month, year, calander, refreshTrigger]);

  return (
    <div className='w-full'>
      <div>
        <div className=' flex mt-4 mb-4 px-[20px]'>

          {/* --- NEW: The Filter Buttons --- */}
          <div className=' w-[50%] flex justify-start'>
            <div className=' w-[300px] flex justify-around items-center'>
              <Button 
                variant={activeFilter === "event" ? "default" : "outline"} 
                size='sm' 
                onClick={() => setActiveFilter("event")}
              >Events</Button>

              <Button 
                variant={activeFilter === "vehicle" ? "default" : "outline"} 
                size='sm' 
                onClick={() => setActiveFilter("vehicle")}
              >Vehicles</Button>

              <Button 
                variant={activeFilter === "guest" ? "default" : "outline"} 
                size='sm' 
                onClick={() => setActiveFilter("guest")}
              >Guests</Button>

              <Button 
                variant={activeFilter === "all" ? "default" : "outline"} 
                size='sm' 
                onClick={() => setActiveFilter("all")}
              >All</Button>
            </div>
          </div>

          <div className=' w-[50%] flex justify-end'>
            <div className=' flex w-[300px] justify-around items-center'>
              <Button variant='outline' className={"rounded-full"} onClick={prevMonth}>
                <ChevronLeft />
              </Button>
              <div className=' flex justify-center items-center text-2xl'>
                <h1 className=' mr-2'>{monthName[month]}</h1>
                <h1>{year}</h1>
              </div>
              <Button variant='outline' className={"rounded-full"} onClick={nextMonth}>
                <ChevronRight />
              </Button>
            </div>
          </div>
        </div>

        <div className=' w-full h-full'>
          <div className=' flex text-neutral-500 font-bold w-full justify-between'>
            <div className='calanderWeekHeading'>Sun</div>
            <div className='calanderWeekHeading'>Mon</div>
            <div className='calanderWeekHeading'>Tues</div>
            <div className='calanderWeekHeading'>Wed</div>
            <div className='calanderWeekHeading'>Thur</div>
            <div className='calanderWeekHeading'>Fri</div>
            <div className='calanderWeekHeading'>Sat</div>
          </div>

          <div className='w-full grid grid-cols-7'>
            {
              printCalander.map((value, index) => {
                const dateKey = `${value.year}-${String(value.month).padStart(2, '0')}-${String(value.day).padStart(2, '0')}`;
                return (
                  <CalanderCell
                    key={index}
                    value={value}
                    dayData={monthData[dateKey] || []} 
                    activeFilter={activeFilter} // <-- Passing the filter down!
                  />
                )
              })
            }
          </div>
        </div>
      </div>
    </div>
  );
}