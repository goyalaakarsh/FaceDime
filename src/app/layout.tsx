import type { Metadata } from "next";
import { Raleway } from 'next/font/google';
import "./globals.css";
import { SocketProvider } from '@/providers/Socket';
import { PeerProvider } from '@/providers/Peer';


const raleway = Raleway({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-raleway',
});

export const metadata: Metadata = {
  title: "FaceDime"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark  ${raleway.variable} font-sans`}>
      <body
        className={`${raleway.variable} font-raleway antialiased dark`}
      >
        <SocketProvider>
          <PeerProvider>
            {children}
          </PeerProvider>
        </SocketProvider>
      </body>
    </html>
  );
}
