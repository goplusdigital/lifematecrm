'use client'
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface StoreContextType {
    data: Record<string, any>;
    setData: (key: string, value: any) => void;
    clearData: (key?: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [data, setDataState] = useState<Record<string, any>>({});

    const setData = (key: string, value: any) => {
        setDataState((prev) => ({ ...prev, [key]: value }));
    };

    const clearData = (key?: string) => {
        if (key) {
            setDataState((prev) => {
                const newData = { ...prev };
                delete newData[key];
                return newData;
            });
        } else {
            setDataState({});
        }
    };

    return (
        <StoreContext.Provider value={{ data, setData, clearData }}>
            {children}
        </StoreContext.Provider>
    );
};

export const useStore = () => {
    const context = useContext(StoreContext);
    if (!context) {
        throw new Error('useStore must be used within StoreProvider');
    }
    return context;
};