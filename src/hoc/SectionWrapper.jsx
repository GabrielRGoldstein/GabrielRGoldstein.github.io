import { motion } from 'framer-motion';
import { styles } from '../styles';
import { staggerContainer } from '../utils/motion';

const SectionWrapper = (Component, idName) => {
  function HOC() {
    return (
      <motion.section
        variants={staggerContainer()}
        initial="hidden"
        whileInView="show"
        viewport={{ once: false, amount: 0.25 }}
        className={`${styles.padding} max-w-7xl mx-auto relative z-0`}
      >
        {idName !== 'about' && ( // this fixes the about section's spacing
          <span className="hash-span" id={idName}>
            &nbsp;
          </span>
        )}

        {idName === 'about' && ( // navigation section jank, in order to fix navigation and maintain proper spacing. I should've built my own site from scratch instead of working around this template LOL. 
          <span className="hash-span" id={idName}>
          </span>
        )}

        <Component />
      </motion.section>
    );
  }

  return HOC;
};

export default SectionWrapper;