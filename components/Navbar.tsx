import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Navbar = () => {
  return (
    <nav className="bg-pixel_bg_darkest fixed w-full z-20 top-0 start-0 border-b border-gray-600">
      <div className="container mx-auto flex justify-between items-center p-5">
        <div className="text-pixel_blue text-xl">
          <Link href="#hero">
            <Image src={"/gglogo.png"} alt="Gabriel Goldstein's Site Logo" width={45} height={45}/>
          </Link>
        </div>
        <div className="flex space-x-4 text-pixel_blue text-lg MiniMOOD gap-6">
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
      </div>
    </nav>
  );
};

export default Navbar;
