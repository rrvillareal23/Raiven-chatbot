import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-blue-500 text-white py-4 px-8 shadow-md">
      <div className="flex justify-between items-center w-full">
        <div className="flex items-center">
          <img
            src="https://www.raiven.com/hs-fs/hubfs/Raiven/Logos/raiven-wordmark-white.png?width=200&height=50&name=raiven-wordmark-white.png"
            alt="Raiven Logo"
            className="h-10"
          />
        </div>

        <div>
          <Link
            href="/"
            className="text-xl font-bold hover:underline focus:underline"
          >
            Home
          </Link>
        </div>
      </div>
    </nav>
  );
}
