import { Sidebar } from "@/components/Sidebar";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark" suppressHydrationWarning>
            <body className={`${inter.className} bg-stone-950 text-stone-100 antialiased`}>
                <div className="flex">
                    <Sidebar />
                    <main className="flex-1 h-screen overflow-y-auto bg-stone-950 p-8">
                        {children}
                    </main>
                </div>
            </body>
        </html>
    );
}
