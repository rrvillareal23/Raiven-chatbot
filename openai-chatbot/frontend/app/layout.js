import "./styles/globals.css";
import Navbar from "./components/Navbar";

export const metadata = {
  title: "AI Chat App",
  description: "Chat with AI-powered document assistant",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="icon"
          href="https://www.raiven.com/hubfs/android-chrome-192x192.png"
        />
      </head>

      <body className="flex flex-col h-screen">
        <Navbar />
        <main className="flex-1 overflow-auto">{children}</main>
      </body>
    </html>
  );
}
