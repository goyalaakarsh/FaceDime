"use client"

import React, { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import io, { Socket } from 'socket.io-client';

interface SocketContextType {
    socket: Socket | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
    children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
    const socket = useMemo(() => {
        const s = io('http://localhost:3002', {
            reconnection: true,
            reconnectionDelay: 1000,
        });

        s.on('connect', () => {
            console.log('Socket connected:', s.id);
        });

        s.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        return s;
    }, []);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
}

export const useSocket = (): SocketContextType => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};
