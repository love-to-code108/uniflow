import EventCell from "./EventCell";


const CalanderCell = ({value}) => {



    return(
        <div 
        className=" flex justify-center items-center
        
        
        w-full min-h-[180px]
        border-r-[1px] border-b-[1px] border-border

        ">


            <div className="bg-background w-full h-full
            
            py-2 px-4
            hover:bg-primary-foreground
            ">


                {/* date */}
                <div className=" w-full flex justify-end">
                <p className={value.isCurrentMonth ? "text-foreground":"text-border"}
                
                >{value.day}</p>
                </div>

                <br />

                


                {/* events */}
                <EventCell/>
            </div>

        </div>
    )
}


export default CalanderCell;