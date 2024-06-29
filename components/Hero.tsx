
import Image from 'next/image'
import React from 'react'


const Hero = () => {
  return (
        <div className='w-full h-screen mt-16' id="hero">
            {/* Side Panels for Ultra-Wide Monitors */}
            {/* <div className="side-panel left">
                <Image src="/images/hero_background_L.jpg" alt="Side Panel Left" layout="fill" objectFit="cover" />
            </div>
            <div className="side-panel right">
                <Image src="/images/hero_background_R.jpg" alt="Side Panel Right" layout="fill" objectFit="cover" />
            </div>             */}

            {/* Use Styles to resolve error with text not showing above bg image*/}
            <div style={{
                zIndex: -1,
                position: 'absolute',
                width: "100%",
                height: "100vh",
                overflow:'hidden'
            }}>
                <Image id='heroImg' src={"/images/hero_background.webp"} alt="pixelart portal background" fill={true} unoptimized={true}/>
            </div>
            
            <main 
            className="MOOD text-center text-white text-2xl md:text-4xl pt-5 
            drop-shadow uppercase">
                <h1 className='pt-4 l:pt-0 md:mt-4 lg:mt-7 text-pixel_blue'>Gabriel<span className='block lg:pt-2'>Goldstein</span></h1>
                <h2 className='md:mt-2 text-white-500 MiniMOOD'>Software Engineer</h2>
            </main>
                
        </div>
  )
}

export default Hero