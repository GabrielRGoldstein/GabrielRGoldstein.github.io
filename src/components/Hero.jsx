import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { styles } from '../styles';
import React, { useState, useEffect, useRef } from 'react';
import BIRDS from 'vanta/dist/vanta.birds.min'

const Hero = () => {
  const [vantaEffect, setVantaEffect] = useState(null);
  const heroRef = useRef(null);

  useEffect(() => {
    if (!vantaEffect) {
      setVantaEffect(BIRDS({
        el: heroRef.current,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 1,
        scaleMobile: 1,
        backgroundColor: 0x101B37, 
        color1: 0xE41376, 
        color2: 0xF47D6E, 
        quantity: 4.50
      }));
    }
    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [vantaEffect]);
  return (
    <>
<section ref={heroRef} className="relative flex sm:flex-row flex-col w-full h-screen mx-auto overflow-hidden">
  <div className={`absolute inset-0 sm:top-[250px] top-[150px] lg:top-[150px] xl:top-[250px] ${styles.paddingX} max-w-7xl mx-auto flex flex-row items-center justify-center gap-3`}>
    <div>
      <h1 className={`${styles.heroHeadText} text-neonBlue font-poppins uppercase text-center`}>
        Hi, I'm{' '} <br></br>
        <span className="sm:text-[90px] text-neonBlue text-[50px] font-mova font-extrabold uppercase">
          Gabriel <span>Goldstein</span>
        </span>
      </h1>
      <p className={`${styles.heroSubText} mt-2 text-neonBlue text-center`}>
        Software Engineer with interests spanning Full-Stack Engineering, Game Development, Artificial Intelligence, and more. 
      </p>
    </div>
  </div>
  <div className="absolute xs:bottom-10 bottom-32 w-full flex justify-center items-center">
    <a href="#about">
      <div className="w-[35px] h-[64px] rounded-3xl border-4 border-neonBlue flex justify-center items-start p-2">
        <motion.div
          animate={{
            y: [0, 24, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatType: 'loop',
          }}
          className="w-3 h-3 rounded-full bg-neonBlue mb-1"
        />
      </div>
    </a>
  </div>
</section>
    </>
  );
};

export default Hero;
