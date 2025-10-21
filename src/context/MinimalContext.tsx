"use client";

import { createContext, useContext } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const MinimalContext = createContext(false);

export const MinimalProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const searchParams = useSearchParams();
  const isMinimal = searchParams.get("minimal") === "true";

  return (
    <MinimalContext.Provider value={isMinimal}>
      {/* if minimal is true, show navbar */}
      {!isMinimal && <Navbar />}
      {children}
      {!isMinimal && <Footer />}
    </MinimalContext.Provider>
  );
};

export const useMinimal = () => useContext(MinimalContext);