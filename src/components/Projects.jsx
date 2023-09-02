import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SectionWrapper } from '../hoc';
import { styles } from '../styles';
import { github, pineapple, pineappleHover } from '../assets';
import { projects } from '../constants';
import { fadeIn, textVariant, staggerContainer } from '../utils/motion';

const ProjectCard = ({
  id,
  name,
  description,
  image,
  repo,
  demo,
  index,
  active,
  handleClick,
}) => {
  return (
    <motion.div
      variants={fadeIn('right', 'spring', index * 0.5, 0.75)}
      className={`relative ${
        active === id ? 'lg:flex-[3.5] flex-[10]' : 'lg:flex-[0.5] flex-[2]'
      } flex items-center justify-center min-w-[170px] 
      h-[420px] cursor-pointer card-shadow`}
      onClick={() => handleClick(id)}>
      <div
        className="absolute top-0 left-0 z-10 bg-jetLight 
      h-full w-full opacity-[0.5] rounded-[24px]"></div>

      <img
        src={image}
        alt={name}
        className="absolute w-full h-full object-cover rounded-[24px]"
      />

      {active !== id ? (
        <div className="flex items-center justify-start pr-[4.5rem]">
          <h3
            className="font-extrabold font-beckman uppercase w-[200px] h-[30px] 
        whitespace-nowrap sm:text-[27px] text-[18px] text-timberWolf tracking-[1px]
        absolute z-0 lg:bottom-[7rem] lg:rotate-[-90deg] lg:origin-[0,0]
        leading-none">
            {name}
          </h3>
        </div>
      ) : (
        <>

<div className="relative p-8 flex flex-col justify-between bg-opacity-50 rounded-b-24 z-20 h-full">
    <h2
      className="font-bold text-2xl sm:text-3xl text-timberWolf uppercase font-beckman mt-4">
      {name}
    </h2>
    <p
      className="text-silver text-sm sm:text-base max-w-3xl sm:leading-24 leading-18 font-poppins tracking-1 mb-5">
      {description}
    </p>
    <div className="flex justify-between items-end">
        <button
          className="flex justify-between text-sm sm:text-base text-timberWolf font-bold font-beckman 
          items-center py-1 pl-2 pr-3 whitespace-nowrap gap-1 rounded-10 glassmorphism hover:bg-battleGray
          hover:text-eerieBlack transition duration-200 ease-in-out"
          onClick={() => window.open(demo, '_blank')}
          onMouseOver={() => {
            document
              .querySelector('.btn-icon')
              .setAttribute('src', pineappleHover);
          }}
          onMouseOut={() => {
            document
              .querySelector('.btn-icon')
              .setAttribute('src', pineapple);
          }}>
          <img
            src={pineapple}
            alt="pineapple"
            className="btn-icon w-10 h-10 sm:w-12 sm:h-12 object-contain"
          />
          LIVE DEMO
        </button>

        <div
          onClick={() => window.open(repo, '_blank')}
          className="bg-night w-14 h-14 rounded-full flex justify-center items-center cursor-pointer opacity-80 sm:opacity-90 ml-3  hover:bg-battleGray transition duration-200 ease-in-out">
          <img
            src={github}
            alt="source code"
            className="object-contain"
          />
        </div>
    </div>
            
</div>
        </>
      )}
    </motion.div>
  );
};

const Projects = () => {
  const [active, setActive] = useState('project-2');

  return (
    <div className="-mt-[6rem]">
      <motion.div variants={textVariant()}>
        <h2 className={`${styles.sectionHeadTextLight}`}>PROJECTS</h2>
      </motion.div>

      {/* <div className="w-full flex">
        <motion.p
          variants={fadeIn('', '', 0.1, 1)}
          className="mt-4 text-taupe text-[18px] max-w-3xl leading-[30px]">
          These projects demonstrate my expertise with practical examples of
          some of my work, including brief descriptions and links to code
          repositories and live demos. They showcase my ability to tackle
          intricate challenges, adapt to various technologies, and efficiently
          oversee projects.
        </motion.p>
      </div> */}

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: false, amount: 0.25 }}
        className={`${styles.innerWidth} mx-auto flex flex-col`}>
        <div className="mt-[50px] flex lg:flex-row flex-col min-h-[70vh] gap-5">
          {projects.map((project, index) => (
            <ProjectCard
              key={project.id}
              index={index}
              {...project}
              active={active}
              handleClick={setActive}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default SectionWrapper(Projects, 'projects');
