"use client"


import Image from "next/image";
import { useAuth } from "../authcontext"
import { Badge, Progress } from "flowbite-react";

export default function Privilege() {
  const { user } = useAuth()
  console.log(user)
  return (
    <>
      <div className="flex flex-col items-center mt-8">
        <div className="w-24 h-24 rounded-full bg-[#F5CBA7] flex items-center justify-center shadow-md overflow-hidden border-4 border-gray-200">
          <Image src="/logo.jpg" alt="Logo" width={48} height={48} className='w-full h-full object-cover' />
        </div>
        <h1 className="text-xl font-bold font-prompt text-gray-800 mt-4">
          {user.fullname}
        </h1>
        <Badge color="success" size="lg" className="mt-2">
          VIP Member
        </Badge>
      </div>

      <div className="max-w-md mx-auto mt-8 p-4 bg-white rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Membership Progress</h2>
        <Progress progress={70} color="green" />
        <p className="text-sm text-gray-600 mt-2">You are 70% of the way to the next membership level!</p>
      </div>
    </>
  );
}
