"use client";

import { useState } from "react";
import ProductCard from "./components/ProductCard";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAskGPT = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(data.message);
        router.push("/chat");
      } else {
        console.error("Failed to initialize system.");
      }
    } catch (error) {
      console.error("Error initializing system:", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full bg-gray-50 p-4">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">
        Document Chat App
      </h1>

      {loading ? (
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500"></div>
          <p>Initializing chat system, this may take a moment...</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 justify-items-center">
          <ProductCard
            image="https://shop.qmerit.com/cdn/shop/files/Emporia_White.png?v=1693670617"
            title="Emporia EV Charger Guide"
            description="Find out what Chat GPT Thinks!"
            buttons={[
              {
                text: "Ask Chat GPT!",
                onClick: handleAskGPT,
                style: "bg-blue-500 text-white hover:bg-blue-600",
              },
              {
                text: "Buy Now",
                href: "https://shop.qmerit.com/collections/residential-chargers/products/emporia-level-2-ev-charger",
                style: "bg-green-500 text-white hover:bg-green-600",
              },
            ]}
          />
          <ProductCard
            image="https://placehold.co/400"
            title="Product 2"
            description="Links don't work."
            buttons={[
              {
                text: "Doesn't Work",
                href: "/",
                style: "bg-red-500 text-white hover:bg-red-600",
              },
              {
                text: "Doesn't Work",
                href: "/",
                style: "bg-red-500 text-white hover:bg-red-600",
              },
            ]}
          />
          <ProductCard
            image="https://placehold.co/400"
            title="Product 3"
            description="Links don't work."
            buttons={[
              {
                text: "Doesn't Work",
                href: "/",
                style: "bg-red-500 text-white hover:bg-red-600",
              },
              {
                text: "Doesn't Work",
                href: "/",
                style: "bg-red-500 text-white hover:bg-red-600",
              },
            ]}
          />{" "}
        </div>
      )}
    </div>
  );
}
