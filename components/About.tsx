import React from 'react'
import { technologies } from '../app/constants'
import BallCanvas from './canvas/Ball' // Ensure you have this component or import it correctly

const About = () => {
  return (
    <div className='bg-pixel_bg text-white pt-20 pb-10 ' id='about'>
      <h1 className="text-center text-2xl md:text-4xl text-white MOOD drop-shadow uppercase">About</h1>
      <div className='mt-5 lg:mt-16 lg:flex lg:justify-center lg:gap-6 w-90percent mx-auto'>
        <div className='lg:w-1/2'>
          <p className='py-5'>
            I&apos;m a passionate software engineer with a B.S. in Computer Science from California Lutheran University.
            My experience spans from data engineering to full-stack engineering, having worked on various innovative projects, including
            real-time communication platforms and machine learning trading bots. I thrive in Agile environments, where I have successfully
            led teams to achieve significant improvements in efficiency and performance.
          </p>
          <p className='py-5'>
            During my tenure at General Motors, I played a key role in reducing expenses by approximately $10 million
            through data optimization and automation. My contributions included delivering PowerBi reports, streamlining Oracle SQL databases,
            and implementing CI/CD practices, which enhanced project delivery times and data accuracy. Previously, as a freelance front-end engineer,
            I developed and maintained over eight websites, boosting user experience and client revenues significantly.
          </p>
          <p className='py-5'>
            I have a strong passion for game design and development, reflected in my projects like a full-stack Discord clone and a sophisticated Figma clone.
            In my free time, I enjoy playing and creating video games, cooking, and engaging in Dungeons and Dragons sessions.
            I&apos;m also an avid fan of Breaking Bad and love playing basketball to stay active.
          </p>
        </div>
        <div className='lg:w-1/2'>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 justify-items-center gap-10 py-5">
            {technologies.map((technology) => (
              <div key={technology.name} className="text-center">
                <p className="font-medium capitalize">{technology.name}</p>
                <div className="w-28 h-28">
                  <BallCanvas icon={technology.icon} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default About
