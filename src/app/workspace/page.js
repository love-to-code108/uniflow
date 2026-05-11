"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import Calander from "@/components/personal-components/Calander/Calander"
import ActionCenter from "@/components/personal-components/ActionCenter/ActionCenter" // NEW
import { useAppStore } from "@/store/globalStates"

const Workspace = () => {
    const currentView = useAppStore((state) => state.currentView);

    return (
        <SidebarProvider>
            <AppSidebar/>
            <div className="w-full h-screen overflow-y-auto">
                {currentView === "calendar" && <Calander />}
                {currentView === "action-center" && <ActionCenter />}
            </div>
        </SidebarProvider>
    )
}

export default Workspace;