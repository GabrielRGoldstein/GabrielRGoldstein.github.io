import React, { useCallback, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Button, Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import Image, { StaticImageData } from 'next/image';
import { projects } from '@/app/constants';

interface ProjectProps {
  id: string;
  title: string;
  description: string;
  image: StaticImageData;
  repo: string;
  demo: string;
  hasDemo: boolean;
}

const slideStyle = {
  objectFit: 'cover',
} as const;

const Carousel = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel();
  const [selectedProject, setSelectedProject] = useState<ProjectProps | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const openModal = (project: ProjectProps) => {
    setSelectedProject(project);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setSelectedProject(null);
  };

  const handleKeyDown = (event: React.KeyboardEvent, project: ProjectProps) => {
    if (event.key === 'Enter') {
      openModal(project);
    }
  };

  return (
    <div className="embla">
      <div className="embla__viewport" ref={emblaRef}>
        <div className="embla__container MiniMOOD flex">
          {projects.map((project) => (
            <div
            className="embla__slide flex-none w-full "
            key={project.id}
            onClick={() => openModal(project)}
            tabIndex={0}
            onKeyDown={(event) => handleKeyDown(event, project)}
          >
              <div className="relative w-full h-96">
                <Image
                  src={project.image}
                  alt={project.title}
                  fill={true}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw,"
                  style={slideStyle}
                />
                <div className="overlay">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-10 h-10"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 5a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H6a1 1 0 110-2h5V6a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <p className="pt-10 text-center">{project.title}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="slide-navigation pt-10" id="slide-navigation">
        <Button className="embla__prev mr-5 border-4 is_square" onClick={scrollPrev}>
          <svg width="25" height="21" viewBox="0 0 25 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <title>Previous</title>
            <path d="M24.5 10.5L2 10.5M2 10.5L11.5 20M2 10.5L11.5 0.999999" stroke="#FFFDE5" strokeWidth="2"></path>
          </svg>
        </Button>
        <Button className="embla__next ml-5 border-4 is_square" onClick={scrollNext}>
          <svg width="24" height="21" viewBox="0 0 24 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <title>Next</title>
            <path d="M0 10.5H22.5M22.5 10.5L13 1M22.5 10.5L13 20" stroke="#FFFDE5" strokeWidth="2"></path>
          </svg>
        </Button>
      </div>

      <Dialog open={isOpen} as="div" className="relative z-10" onClose={closeModal}>
        <div className="fixed inset-0 bg-black bg-opacity-50" aria-hidden="true"></div>
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <DialogPanel
              className="transition-all transform ease-out duration-300 w-full max-w-md rounded-xl bg-pixel_bg p-6 shadow-lg"
              >
              {selectedProject && (
                <>
                  <DialogTitle as="h3" className="text-lg font-medium leading-6 text-white">
                    {selectedProject.title}
                  </DialogTitle>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      {selectedProject.description}
                    </p>
                  </div>
                  <div className="mt-4">
                    <a href={selectedProject.repo} target="_blank" rel="noopener noreferrer" className="text-pixel_blue hover:underline">
                      View Repository
                    </a>
                    {selectedProject.hasDemo && (
                      <a href={selectedProject.demo} target="_blank" rel="noopener noreferrer" className="ml-4 text-pixel_blue hover:underline">
                        View Demo
                      </a>
                    )}
                  </div>
                  <div className="mt-4">
                    <Button
                      className="inline-flex justify-center px-4 py-2 text-sm font-medium text-pixel_blue border border-transparent rounded-md hover:bg-pixel_bg_darkest"
                      onClick={closeModal}
                    >
                      Close
                    </Button>
                  </div>
                </>
              )}
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default Carousel;
