'use client'
import React from 'react'
import Carousel from './project_components/Carousel'



const Projects = () => {
  return (
    <div className='pt-20 bg-pixel_bg_darkest pb-10 ' id='projects'>
      <h1 className= "text-center text-2xl md:text-4xl text-white MOOD drop-shadow uppercase" >Projects</h1>
      <div className='mt-10 lg:mt-20 text-white'>
        <Carousel/>
      </div>
    </div>
  )
}

export default Projects