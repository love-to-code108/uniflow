import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"


const Workspace = () => {



    return (
        <SidebarProvider>
            <AppSidebar/>
            <div className=" w-full">
                The workspace page
            </div>
        </SidebarProvider>
    )
}


export default Workspace