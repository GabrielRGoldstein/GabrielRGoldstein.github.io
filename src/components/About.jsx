import React from 'react';
import { motion } from 'framer-motion';
import { styles } from '../styles';
import { services } from '../constants';
import { fadeIn, textVariant } from '../utils/motion';
import { SectionWrapper } from '../hoc';

const ServiceCard = ({ index, title, icon }) => {
  return (
    <motion.div
      variants={fadeIn('right', 'spring', 0.5 * index, 0.75)}
      className="xs:w-[250px] w-full card-gradient p-[1px] rounded-[20px] shadow-card">
      <div
        options={{
          max: 45,
          scale: 1,
          speed: 450,
        }}
        className="bg-jetLight rounded-[20px] py-5 px-12 min-h-[280px] flex justify-evenly items-center flex-col">
        <img src={icon} alt={title} className="w-16 h-16 object-contain" />
        <h3 className="text-taupe text-[18px] font-bold text-center">
          {title}
        </h3>
      </div>
    </motion.div>
  );
};

const About = () => {
  return (
  <div className="flex justify-center">
    <div className="mb-[6rem]">
      <motion.div variants={textVariant()}>
        <h2 className={styles.sectionHeadTextLight}>OVERVIEW</h2>
      </motion.div>

      <motion.p
        variants={fadeIn('', '', 0.1, 1)}
        className="mt-4 text-timberWolf text-[18px] max-w-3xl leading-[30px]">
Professionally, I am a versatile individual with a strong track record. 
As a Software Engineer at General Motors, I developed a PySpark predictive model using past data to anticipate 2023 Actual vs. Scheduled Vehicle Production. Integral to the Global Production and Supply Chain planning team, we significantly reduced company expenses by nearly $10 million. 
Individually, I crafted 20+ PowerBi reports, optimized Oracle SQL databases, executed ETL jobs, and facilitated Python-based testing automation via Azure DevOps, while also initiating CI/CD groundwork. 
Serving as a Data Intelligence team resource, I shared insights on our project's data structure and actively contributed to their winning hackathon. 

Freelance, I adeptly designed, built, and maintained websites with diverse tools and libraries, including Elementor, HTML, CSS, JavaScript, three.js, motion.js, reactJS, vueJS, MongoDB, nodeJS, and SpringBoot. 
As a Research Assistant, I helped manage Educational Effectiveness and Institutional Research database, enriching statistical research with Python-based automated workflows using Selenium and Pandas, as well as data visualation and analysis. 
      </motion.p>

      <div className="mt-20 flex flex-wrap justify-center gap-10">
        {services.map((service, index) => (
          <ServiceCard key={service.title} index={index} {...service} />
        ))}
      </div>
    </div>
  </div>
  );
};

export default SectionWrapper(About, 'about');
