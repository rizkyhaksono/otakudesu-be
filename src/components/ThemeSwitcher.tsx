"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { IoMoon, IoSunny } from "react-icons/io5";

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <div className="flex gap-3 text-xl">
      <button className="flex items-center" onClick={toggleTheme}>
        {theme === "light" ? (
          <IoMoon className="text-black transition-all hover:text-neutral-400 hover:scale-100 duration-300 ease-in-out" />
        ) : (
          <IoSunny className="text-white transition-all hover:text-neutral-400 hover:scale-100 duration-300 ease-in-out" />
        )}
      </button>
    </div>
  );
}
