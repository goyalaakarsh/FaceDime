"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react"
import { use, useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSocket } from "@/providers/Socket"
import { usePeer } from "@/providers/Peer"

interface CallEvent {
    from: string;
    offer?: RTCSessionDescriptionInit;
    answer?: RTCSessionDescriptionInit;
}

interface PageParams {
    params: Promise<{ room: string }>
}

export default function RoomPage({ params }: PageParams) {
    const { room } = use(params)
    const router = useRouter()
    const { socket } = useSocket()
    const { peer, createOffer, createAnswer, setRemoteAnswer, addIceCandidate } = usePeer()
    const [isMuted, setIsMuted] = useState(false)
    const [isCameraOff, setIsCameraOff] = useState(false)
    const localVideoRef = useRef<HTMLVideoElement>(null)
    const remoteVideoRef = useRef<HTMLVideoElement>(null)
    const [localStream, setLocalStream] = useState<MediaStream | null>(null)

    // Initialize local media stream
    useEffect(() => {
        const initializeMedia = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
                
                setLocalStream(stream);
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }

                // Add each track to the peer connection
                stream.getTracks().forEach(track => {
                    peer.addTrack(track, stream);
                });

                // Now join the room
                socket?.emit('join', { user: localStorage.getItem('userName'), room });
            } catch (error) {
                console.error('Error accessing media devices:', error);
            }
        };

        initializeMedia();
    }, []);

    // Handle socket events
    useEffect(() => {
        if (!socket || !peer) return;

        // Set up peer connection event handlers
        peer.oniceconnectionstatechange = () => {
            console.log('ICE Connection State:', peer.iceConnectionState);
        };

        peer.onconnectionstatechange = () => {
            console.log('Connection State:', peer.connectionState);
        };

        peer.ontrack = (event) => {
            console.log('Got remote track:', event.streams[0]);
            if (remoteVideoRef.current && event.streams[0]) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };

        socket.on('user-joined', async ({ user }) => {
            console.log('User joined, creating offer for:', user);
            const offer = await createOffer();
            if (offer) {
                socket.emit('call-user', { room, user, offer });
            }
        });

        socket.on('incoming-call', async (data: CallEvent) => {
            console.log('Received call from:', data.from);
            if (data.offer) {
                const answer = await createAnswer(data.offer);
                if (answer) {
                    socket.emit('call-accepted', { room, user: data.from, answer });
                }
            }
        });

        socket.on('call-accepted', async (data: CallEvent) => {
            console.log('Call accepted, setting remote answer');
            if (data.answer) {
                await setRemoteAnswer(data.answer);
            }
        });

        // Handle ICE candidates
        peer.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('Sending ICE candidate');
                socket.emit('ice-candidate', {
                    room,
                    candidate: event.candidate
                });
            }
        };

        socket.on('ice-candidate', async ({ candidate }) => {
            try {
                if (candidate) {
                    await peer.addIceCandidate(new RTCIceCandidate(candidate));
                    console.log('Added ICE candidate');
                }
            } catch (err) {
                console.error('Error adding ICE candidate:', err);
            }
        });

        return () => {
            peer.ontrack = null;
            peer.onicecandidate = null;
            peer.oniceconnectionstatechange = null;
            peer.onconnectionstatechange = null;
            socket.off('user-joined');
            socket.off('incoming-call');
            socket.off('call-accepted');
            socket.off('ice-candidate');
        };
    }, [socket, peer, room]);

    const handleMediaToggle = (type: 'audio' | 'video') => {
        if (!localStream) return;
        
        localStream.getTracks().forEach(track => {
            if (type === 'audio' && track.kind === 'audio') {
                track.enabled = isMuted;
                setIsMuted(!isMuted);
            }
            if (type === 'video' && track.kind === 'video') {
                track.enabled = isCameraOff;
                setIsCameraOff(!isCameraOff);
            }
        });
    };

    const handleLeaveCall = () => {
        localStream?.getTracks().forEach(track => track.stop());
        socket?.emit('leave-room', { room });
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br p-4">
            <div className="max-w-7xl mx-auto h-[calc(100vh-2rem)] flex flex-col gap-4">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="relative overflow-hidden bg-slate-950">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1.5 rounded-lg">
                            <p className="text-sm font-medium text-white">You</p>
                        </div>
                    </Card>
                    <Card className="relative overflow-hidden bg-slate-950">
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1.5 rounded-lg">
                            <p className="text-sm font-medium text-white">Remote User</p>
                        </div>
                    </Card>
                </div>

                <div className="flex justify-center items-center gap-4 p-4">
                    <Button
                        size="icon"
                        variant={isMuted ? "destructive" : "secondary"}
                        onClick={() => handleMediaToggle('audio')}
                    >
                        {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </Button>

                    <Button
                        size="icon"
                        variant={isCameraOff ? "destructive" : "secondary"}
                        onClick={() => handleMediaToggle('video')}
                    >
                        {isCameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                    </Button>

                    <Button
                        size="icon"
                        variant="destructive"
                        onClick={handleLeaveCall}
                    >
                        <PhoneOff className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}