"use client"

import LoginForm from "@/components/personal-components/Auth/loginForm";
import { ModeToggle } from "@/components/mode-toggle";
import { toast } from "sonner";




const LoginPage = () => {



  return(
    <div className=" w-full h-[100vh] flex flex-col justify-center items-center relative">
      


      {/* dark and light mode toggle */}
      <div className=" w-full flex justify-end absolute top-4 right-4">
        <ModeToggle/>
      </div>



      <LoginForm/>
    </div>
  );
}


export default LoginPage