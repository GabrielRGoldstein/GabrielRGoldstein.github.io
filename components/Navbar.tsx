'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="bg-pixel_bg_darkest fixed w-full z-20 top-0 start-0 border-b border-gray-600 ">
      <div className="container mx-auto flex justify-between items-center p-5">
        <div className="text-pixel_blue text-xl">
          <Link href="#hero">
            <Image src={"/gglogo.png"} alt="Gabriel Goldstein's Site Logo" width={45} height={45}/>
          </Link>
        </div>
        <div className="hidden md:flex space-x-4 text-pixel_blue text-lg MiniMOOD gap-6">
          <Link href="#about" className='hover:text-pixel_pink'>
            About
          </Link>
          <Link href="#experience" className='hover:text-pixel_pink'>
            Experience
          </Link>
          <Link href="#projects" className='hover:text-pixel_pink'>
            Projects
          </Link>
        </div>
        <div className="md:hidden">
          <button onClick={toggleMenu} className="text-pixel_blue focus:outline-none">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
            </svg>
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="md:hidden bg-pixel_bg_darkest px-2 pt-2 pb-3 space-y-1 sm:px-3 MiniMOOD">
          <Link href="#about" className='block text-pixel_blue hover:text-pixel_pink p-5'>
            About
          </Link>
          <Link href="#experience" className='block text-pixel_blue hover:text-pixel_pink p-5'>
            Experience
          </Link>
          <Link href="#projects" className='block text-pixel_blue hover:text-pixel_pink p-5'>
            Projects
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
