'use client'

import React from 'react';
import { VerticalTimeline, VerticalTimelineElement } from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';
import Image, { StaticImageData } from 'next/image';
import { experiences } from '@/app/constants'; // Ensure the path is correct
import { Button } from '@headlessui/react';
import Link from 'next/link';

interface Experience {
  title: string;
  company_name: string;
  icon: StaticImageData;
  date: string;
}

const ExperienceCard: React.FC<{ experience: Experience }> = ({ experience }) => {
  return (
    <VerticalTimelineElement
      contentStyle={{
        background: '#1B122B',
        color: '#ffffff',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'left',
        padding: '1.5rem 2rem',
        visibility: 'visible'
      }}
      contentArrowStyle={{
        borderRight: '7px solid #74246d',
        visibility: 'visible'
      }}
      date={experience.date}
      icon={<Image src={experience.icon} alt={experience.company_name} className="rounded-full" fill={true} sizes='400px' />}
      iconStyle={{
        background: '#fff',
        color: '#fff',
        visibility: 'visible'
      }}
    >
      <h3 className="text-2xl font-bold text-pixel_blue">{experience.title}</h3>
      <h4 className="text-xl text-white">{experience.company_name}</h4>
    </VerticalTimelineElement>
  );
};

const ExperienceTimeline: React.FC = () => {
  return (
    <div className="bg-pixel_bg_darker pt-20 pb-10" id='experience'>
      <div className="container mx-auto">
        <h2 className="text-2xl md:text-4xl font-bold text-center text-white mb-20 MOOD">Experience</h2>
        <VerticalTimeline className='MiniMOOD'>
          {experiences.map((experience, index) => (
            <ExperienceCard key={index} experience={experience} />
          ))}
          {/* Resume Element */}
            <VerticalTimelineElement
            contentStyle={{
              background: '#1B122B',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'left',
              padding: '1.5rem 2rem',
              visibility: 'visible'
            }}
            contentArrowStyle={{
              borderRight: '7px solid #74246d',
              visibility: 'visible'
            }}
            icon={<Image src={"/images/icons/resume.png"} alt={""} className="rounded-full" fill={true} sizes='400px' />}
            iconStyle={{
              background: '#71093A',
              color: '#fff',
              visibility: 'visible'
            }}
            >
              <Button className={"underline resume"}><Link href={"Gabriel Goldstein Resume.pdf"} target="_blank">Download Resume</Link></Button>

            </VerticalTimelineElement>
          
        </VerticalTimeline>
      </div>
    </div>
  );
};

export default ExperienceTimeline;