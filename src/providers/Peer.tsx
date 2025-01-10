"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type PeerContextType = {
    peer: RTCPeerConnection;
    localDescription: RTCSessionDescriptionInit | null;
    createOffer: () => Promise<RTCSessionDescriptionInit | null>;
    createAnswer: (offer: RTCSessionDescriptionInit) => Promise<RTCSessionDescriptionInit | null>;
    setRemoteAnswer: (answer: RTCSessionDescriptionInit) => Promise<void>;
    addIceCandidate: (candidate: RTCIceCandidate) => Promise<void>;
};

const PeerContext = createContext<PeerContextType>({
    peer: new RTCPeerConnection(),
    localDescription: null,
    createOffer: async () => null,
    createAnswer: async () => null,
    setRemoteAnswer: async () => {},
    addIceCandidate: async () => {},
});

export function PeerProvider({ children }: { children: React.ReactNode }) {
    const [localDescription, setLocalDescription] = useState<RTCSessionDescriptionInit | null>(null);
    
    const peer = useMemo(() => new RTCPeerConnection({
        iceServers: [
            { 
                urls: [
                    'stun:stun.l.google.com:19302',
                    'stun:stun1.l.google.com:19302',
                    'stun:stun2.l.google.com:19302'
                ]
            }
        ],
        iceCandidatePoolSize: 10
    }), []);

    useEffect(() => {
        const handleIceCandidate = (event: RTCPeerConnectionIceEvent) => {
            if (event.candidate) {
                console.log('ICE candidate:', event.candidate);
            }
        };
        const handleNegotiationNeeded = () => {
            console.log('Negotiation needed');
        };
        peer.onicecandidate = handleIceCandidate;
        peer.onnegotiationneeded = handleNegotiationNeeded;

        peer.oniceconnectionstatechange = () => {
            console.log('ICE connection state:', peer.iceConnectionState);
        };

        peer.onconnectionstatechange = () => {
            console.log('Connection state:', peer.connectionState);
        };

        return () => {
            peer.onicecandidate = null;
            peer.onnegotiationneeded = null;
            peer.oniceconnectionstatechange = null;
            peer.onconnectionstatechange = null;
        };
    }, [peer]);

    const createOffer = async () => {
        try {
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);
            setLocalDescription(offer);
            console.log('Offer:', offer);
            return offer;
        } catch (error) {
            console.error('Error creating offer:', error);
            return null;
        }
    };

    const createAnswer = async (offer: RTCSessionDescriptionInit) => {
        try {
            await peer.setRemoteDescription(offer);
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            setLocalDescription(answer);
            console.log('Answer:', answer);
            return answer;
        } catch (error) {
            console.error('Error creating answer:', error);
            return null;
        }
    };

    const setRemoteAnswer = async (answer: RTCSessionDescriptionInit) => {
        try {
            await peer.setRemoteDescription(answer);
            console.log('Remote answer set:', answer);
        } catch (error) {
            console.error('Error setting remote answer:', error);
        }
    };

    const addIceCandidate = async (candidate: RTCIceCandidate) => {
        try {
            await peer.addIceCandidate(candidate);
            console.log('Added ICE candidate:', candidate);
        } catch (error) {
            console.error('Error adding ICE candidate:', error);
        }
    };

    return (
        <PeerContext.Provider value={{ 
            peer, 
            localDescription, 
            createOffer, 
            createAnswer, 
            setRemoteAnswer,
            addIceCandidate 
        }}>
            {children}
        </PeerContext.Provider>
    );
}

export function usePeer() {
    return useContext(PeerContext);
}
