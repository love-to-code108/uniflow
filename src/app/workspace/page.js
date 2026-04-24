import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import Calander from "@/components/personal-components/Calander/Calander"

const Workspace = () => {



    return (
        <SidebarProvider>
            <AppSidebar/>
            <div className=" w-full">
                <Calander/>
            </div>
        </SidebarProvider>
    )
}


export default Workspace