"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import CalanderCell from './calanderCell';
import { calanderStore } from '@/store/globalStates';






































export default function Calendar() {





  // the calander function

  const getCalendarGrid = (year, month) => {
    const dates = [];
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay(); // 0 (Sun) to 6 (Sat)

    console.log("calander function");

    // Calculate the last day of the month
    // (Month + 1 with day 0 gives the last day of the current month)
    const lastDay = new Date(year, month + 1, 0).getDate();

    // Determine if we need 5 rows (35) or 6 rows (42)
    // If the starting offset + the total days fits in 35, use 35.
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










  // useEffect(() => {

  // }, [year, month])


  const year = calanderStore((state) => state.year)
  const month = calanderStore((state) => state.month);

  console.log(month, year);

  const nextMonth = calanderStore((state) => state.nextMonth)
  const prevMonth = calanderStore((state) => state.prevMonth);

  



  const calendarGrid = useMemo(() => {
    console.log("running useMemo");
    return getCalendarGrid(year, month);
  }, [year,month]);



  















  return (
    <div className='w-full h-full'>


      {/* calander */}
      {/* the container */}
      <div>






        {/* upper container */}
        {/* the upper bar containing the filters and the month and the year */}
        <div className=' flex mt-4 mb-4 px-[20px]'>

          {/* the filters */}
          <div className=' w-[50%] flex justify-start'>

            <div className=' w-[300px] flex justify-around items-center'>
              {/* events */}
              <Button className={""} variant='outline' size='sm'>Events</Button>

              {/* vehicles */}
              <Button className={""} variant='outline' size='sm'>Vehicles</Button>


              {/* Guests */}
              <Button className={""} variant='outline' size='sm'>Guests</Button>


              {/* all */}
              <Button className={""} variant='outline' size='sm'>All</Button>
            </div>



          </div>





          {/* the second half with the date */}
          <div className=' w-[50%] flex justify-end'>

            {/* container */}
            <div className=' flex w-[300px] justify-around items-center'>

              {/* button with left arrow */}
              <Button variant='outline' className={"rounded-full"}><ChevronLeft /></Button>


              {/* current month and year */}
              <div className=' flex justify-center items-center text-2xl'>
                <h1 className=' mr-2'>April</h1>
                <h1>2026</h1>
              </div>


              {/* button with right arrow */}
              <Button
                variant='outline'
                className={"rounded-full"}
                onClick={nextMonth}
              ><ChevronRight /></Button>
            </div>


          </div>

        </div>

















        {/* lower container */}
        {/* the calander container */}
        <div className=' w-full h-full'>




          {/* the week headings */}
          <div className=' flex text-neutral-500 font-bold w-full justify-between
          '>
            <div className='calanderWeekHeading'>
              Sun
            </div>
            <div className='calanderWeekHeading'>
              Mon
            </div>
            <div className='calanderWeekHeading'>
              Tues
            </div>
            <div className='calanderWeekHeading'>
              Wed
            </div>
            <div className='calanderWeekHeading'>
              Thur
            </div>
            <div className='calanderWeekHeading'>
              Fri
            </div>
            <div className='calanderWeekHeading'>
              Sat
            </div>

          </div>



          {/* the days */}
          <div className='w-full grid grid-cols-7'>





            {
              calendarGrid.map((value, index) => {
                return (
                  <CalanderCell key={index} value={value} />
                )
              })
            }




          </div>


        </div>



      </div>

    </div>
  );
}









