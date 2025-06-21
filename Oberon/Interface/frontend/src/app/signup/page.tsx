
'use client';
import Image from "next/image";
import Head from "next/head";
import styles from "./styles/home.module.css";
import Typewriter from "typewriter-effect";
import ButtonMain from "./components/mainButtons";

{/* Main Page */}
export default function Home() {
  return (

    <div className="min-h-screen">
      {/* as */}
    <Head>
      <title>SynAeri</title>
      <link rel="icon" href="/favicon.ico" />

    </Head>

      <main>
        <section className="py-8 md:py-16">
          <div className="max-w-7x1 mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Big rectangle */}
              <div className="sm:col-span-2  md:p-6 min-h-[calc(100vh-200px)]">

                <div className="ml-15 mt-15 flex items-center">
                  <h1><span className="text-4xl">Signup</span></h1>
                </div>
                <div className="mt-10 ml-10 space-y-10">
                  <div className="striped-content">
                    <Typewriter options={{
                      strings: "Attempt at saving better",
                      autoStart: true,
                      delay: 50,
                      }} />
                    
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

