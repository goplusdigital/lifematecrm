"use client"


import Image from "next/image";
import { useAuth } from "./authcontext"


export default function Privilege() {
  const { user } = useAuth()
  console.log(user)
  return (
    <div className="flex-1 flex flex-row items-start justify-start p-5 gap-4 bg-[#0093e8] relative">
      {/* logo circle center - start */}
      <div className="w-16 h-16 rounded-full bg-[#F5CBA7] flex items-center justify-center shadow-md overflow-hidden border-4 border-gray-200">
        <Image src="/logo.jpg" alt="Logo" width={48} height={48} className='w-full h-full object-cover' />
      </div>
      {/* logo circle center - end */}
      {/* Name of Merchant */}
      <div>
        <h1 className="text-2xl font-bold font-prompt text-white mt-2">
          Lifematewellness
        </h1>
        <p className="text-white  font-prompt">สิทธิพิเศษสำหรับสมาชิก</p>
      </div>
      {/* Phone number */}
      

    </div>
  );
}
