import { CARDS } from "@/lib/constants";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const Home = () => {
  return (
    <>
      <header className="bg-secondary text-secondary-foreground rounded-lg">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-center">
          <h1 className="text-4xl font-bold">Library Management System</h1>
        </div>
      </header>
      <section>
        <div className="max-w-6xl mx-auto py-4">
          <div className="grid grid-cols-2 gap-6">
            {CARDS.map((card, i) => (
              <Link key={i} href={card.path}>
                <div
                  className={`h-80 w-full ${card.color} rounded-lg shadow-md p-2`}
                >
                  <div className="flex flex-col items-center justify-center">
                    <Image
                      src={card.img}
                      height={250}
                      width={250}
                      alt="Dashboard"
                    />
                    <h2 className="text-4xl font-bold text-white tracking-tight">
                      {card.title}
                    </h2>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
