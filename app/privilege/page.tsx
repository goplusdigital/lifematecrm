"use client"


import { useAuth } from "./authcontext"


export default function Privilege() {
  const { user } = useAuth()
  console.log(user)
  return (
    <>Fail to load</>
  );
}
