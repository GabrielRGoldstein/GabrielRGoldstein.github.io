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
        <img src={icon} alt={title} className="w-16h-16 object-contain" />
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
As a Software Engineer at General Motors, I significantly contributed to developing a PySpark predictive model, leading to a substantial $10 million cost saving for the company. My responsibilities included detailed data analysis, crafting over 20 insightful PowerBi reports, optimizing Oracle SQL databases for performance efficiency, and implementing automated testing processes using Python. I also played a pivotal role in laying the groundwork for CI/CD processes, showcasing my ability to improve and streamline development workflows. <br/>

Beyond my corporate role, I have a rich freelance experience in web design and development. I've successfully designed and maintained multiple websites, employing a broad range of tools and technologies such as HTML, CSS, JavaScript, and advanced frameworks like ReactJS, VueJS, and nodeJS. This work demonstrates my versatility and adaptability in different tech environments. <br/>

In my tenure as a Research Assistant, I managed and improved databases for Educational Effectiveness and Institutional Research. This role involved enhancing data analysis and visualization, where I integrated Python-based automated workflows using tools like Selenium and Pandas to streamline research processes. <br/>

My career path is marked by a consistent pursuit of technical excellence, innovative problem-solving, and a deep commitment to leveraging technology for efficient business solutions. <br/>
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
