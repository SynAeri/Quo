'use client';
import Image from "next/image";
import Head from "next/head";
import styles from "./styles/home.module.css";
import Typewriter from "typewriter-effect";
import Treeview from 'react-accessible-treeview';
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
              <div className="sm:col-span-2 md:col-span-2 border p-4 md:p-6 min-h-[calc(100vh-200px)]"
                style={{
                  boxShadow: 'inset 0 0 15px rgba(0,0,0, .4), inset 0 0 50px rgba(0,0,0, .3)'
                }}
              >

                <div className="ml-15 mt-15 flex items-center">
                  <h1><span className="text-4xl">SynAeri</span> A Cybersecurity Networks Student</h1>
                </div>
                <div className="flex items-center mt-10 ml-10">
                  <div className="striped-content">
                    <Typewriter options={{
                      strings: "I am a Developer in Sydney, Australia. I enjoy making projects on anything that interests me",
                      autoStart: true,
                      delay: 50,
                      }}
                    />

                  </div>
                </div>
              </div>
              {/* smaller rectangles */}
              <div className="flex flex-col gap-6 h-full">
                <div className="flex-1 border border-black-500">
                <div className="ml-5 mt-5">
                <h1>Activity</h1>
                </div>
                </div>

                <div className="flex-1 border border-black-500 shadow-lg">
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

