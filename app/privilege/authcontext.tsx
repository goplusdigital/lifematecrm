'use client'

import { createContext, useContext } from 'react'

const AuthContext = createContext<any>(null)

export function AuthProvider({ user, token, children }: any) {
  return (
    <AuthContext.Provider value={{ user, token }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)