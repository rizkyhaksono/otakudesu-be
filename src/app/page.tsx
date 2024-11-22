"use client"

import Image from "next/image"
// import BaseLayout from "@/components/BaseLayout"
import { Code, Link } from "@nextui-org/react"

export default function Home() {
  return (
    // <BaseLayout>
    <div className="relative mx-auto max-w-full">
      <Image className="w-full h-full object-cover" src={"https://images6.alphacoders.com/112/1128080.jpg"} alt="Hero" width={1000} height={1000} priority />
      <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 flex flex-col justify-center items-center text-center text-white">
        <p className="xl:mt-[-300px] lg:mt-[-200px] xl:text-5xl lg:text-4xl md:text-3xl sm:text-2xl max-[640px]:text-xl font-semibold mb-4 text-slate-100 transition-all hover:text-neutral-400 hover:scale-105 duration-300 ease-in-out">
          Otakudesu API 1.0 is out!
        </p>
        <div className="hover:text-neutral-400 transition duration-300 ease-in-out">
          <Link href="/api">
            <Code className="mt-5" size="lg">
              Get Started
            </Code>
          </Link>
        </div>
      </div>
    </div>
    // </BaseLayout>
  )
}
