"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSocket } from "@/providers/Socket";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const { socket } = useSocket();
  const router = useRouter();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !room || !socket) return;
    socket.emit('join', { user: name, room: room });
  };
  
  useEffect(() => {
    if (!socket) return;
    socket.on('joined', (data: { room: string, user: string }) => {
      console.log(`${data.user} joined room ${data.room}`);
      router.push(`/room/${data.room}`);
    });

    return () => {
      if (socket) socket.off('joined');
    };
  }, [socket, router]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <h1 className="text-4xl font-bold text-center">Welcome to FaceDime</h1>

      <form className="grid w-full max-w-sm gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="name">Name</Label>
          <Input type="text" id="name" onChange={(e) => setName(e.target.value)} placeholder="Enter your name" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="room">Room ID</Label>
          <Input id="room" onChange={(e) => setRoom(e.target.value)} placeholder="Enter a Room ID" />
        </div>
        <Button type="submit" className="w-full" onClick={handleSubmit} disabled={!name || !room}>Join Room</Button>
      </form>
    </div>
  );
}

