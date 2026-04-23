"use client";

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import CalanderCell from './calanderCell';




export default function Calendar() {
  


  const april2026Grid = [
  { day: 29, month: 3, year: 2026, weekday: "Sunday", isCurrentMonth: false },
  { day: 30, month: 3, year: 2026, weekday: "Monday", isCurrentMonth: false },
  { day: 31, month: 3, year: 2026, weekday: "Tuesday", isCurrentMonth: false },
  { day: 1, month: 4, year: 2026, weekday: "Wednesday", isCurrentMonth: true },
  { day: 2, month: 4, year: 2026, weekday: "Thursday", isCurrentMonth: true },
  { day: 3, month: 4, year: 2026, weekday: "Friday", isCurrentMonth: true },
  { day: 4, month: 4, year: 2026, weekday: "Saturday", isCurrentMonth: true },
  { day: 5, month: 4, year: 2026, weekday: "Sunday", isCurrentMonth: true },
  { day: 6, month: 4, year: 2026, weekday: "Monday", isCurrentMonth: true },
  { day: 7, month: 4, year: 2026, weekday: "Tuesday", isCurrentMonth: true },
  { day: 8, month: 4, year: 2026, weekday: "Wednesday", isCurrentMonth: true },
  { day: 9, month: 4, year: 2026, weekday: "Thursday", isCurrentMonth: true },
  { day: 10, month: 4, year: 2026, weekday: "Friday", isCurrentMonth: true },
  { day: 11, month: 4, year: 2026, weekday: "Saturday", isCurrentMonth: true },
  { day: 12, month: 4, year: 2026, weekday: "Sunday", isCurrentMonth: true },
  { day: 13, month: 4, year: 2026, weekday: "Monday", isCurrentMonth: true },
  { day: 14, month: 4, year: 2026, weekday: "Tuesday", isCurrentMonth: true },
  { day: 15, month: 4, year: 2026, weekday: "Wednesday", isCurrentMonth: true },
  { day: 16, month: 4, year: 2026, weekday: "Thursday", isCurrentMonth: true },
  { day: 17, month: 4, year: 2026, weekday: "Friday", isCurrentMonth: true },
  { day: 18, month: 4, year: 2026, weekday: "Saturday", isCurrentMonth: true },
  { day: 19, month: 4, year: 2026, weekday: "Sunday", isCurrentMonth: true },
  { day: 20, month: 4, year: 2026, weekday: "Monday", isCurrentMonth: true },
  { day: 21, month: 4, year: 2026, weekday: "Tuesday", isCurrentMonth: true },
  { day: 22, month: 4, year: 2026, weekday: "Wednesday", isCurrentMonth: true },
  { day: 23, month: 4, year: 2026, weekday: "Thursday", isCurrentMonth: true },
  { day: 24, month: 4, year: 2026, weekday: "Friday", isCurrentMonth: true },
  { day: 25, month: 4, year: 2026, weekday: "Saturday", isCurrentMonth: true },
  { day: 26, month: 4, year: 2026, weekday: "Sunday", isCurrentMonth: true },
  { day: 27, month: 4, year: 2026, weekday: "Monday", isCurrentMonth: true },
  { day: 28, month: 4, year: 2026, weekday: "Tuesday", isCurrentMonth: true },
  { day: 29, month: 4, year: 2026, weekday: "Wednesday", isCurrentMonth: true },
  { day: 30, month: 4, year: 2026, weekday: "Thursday", isCurrentMonth: true },
  { day: 1, month: 5, year: 2026, weekday: "Friday", isCurrentMonth: false },
  { day: 2, month: 5, year: 2026, weekday: "Saturday", isCurrentMonth: false },
];

















  return (
    <div className='w-full h-full'>


      {/* calander */}
      {/* the container */}
      <div>






        {/* upper container */}
        {/* the upper bar containing the filters and the month and the year */}
        <div className=' flex mt-4 mb-8'>

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
              <Button variant='outline' className={"rounded-full"}><ChevronRight /></Button>
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
            {april2026Grid.map((value,index) => {

              return(<CalanderCell key={index} day={value.day} isCurrentMonth={value.isCurrentMonth}/>);
            })}
          </div>


        </div>



      </div>

    </div>
  );
}