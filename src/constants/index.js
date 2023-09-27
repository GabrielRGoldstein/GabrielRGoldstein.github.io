import {
  frontend,
  backend,
  ux,
  prototyping,
  javascript,
  typescript,
  html,
  css,
  reactjs,
  redux,
  tailwind,
  nodejs,
  git,
  figma,
  docker,
  postgresql,
  rubyrails,
  graphql,
  discordclone,
  math,
  movie,
  space,
  gm,
  clu,
  ai,
  gglogo,
  netflixclone,
} from '../assets';

export const navLinks = [
  {
    id: 'about',
    title: 'About',
  },
  {
    id: 'projects',
    title: 'Projects',
  },
  {
    id: 'contact',
    title: 'Contact',
  },
];

const services = [
  {
    title: 'Frontend Developer',
    icon: frontend,
  },
  {
    title: 'Backend Developer',
    icon: backend,
  },
  {
    title: 'AI/Machine Learning',
    icon: ai,
  },
  {
    title: 'Software Prototyping',
    icon: prototyping,
  },
];

const technologies = [
  {
    name: 'HTML 5',
    icon: html,
  },
  {
    name: 'CSS 3',
    icon: css,
  },
  {
    name: 'JavaScript',
    icon: javascript,
  },
  {
    name: 'TypeScript',
    icon: typescript,
  },
  {
    name: 'React JS',
    icon: reactjs,
  },
  {
    name: 'Redux Toolkit',
    icon: redux,
  },
  {
    name: 'Tailwind CSS',
    icon: tailwind,
  },
  {
    name: 'Node JS',
    icon: nodejs,
  },
  {
    name: 'graphql',
    icon: graphql,
  },
  {
    name: 'postgresql',
    icon: postgresql,
  },
  {
    name: 'git',
    icon: git,
  },
  {
    name: 'figma',
    icon: figma,
  },
  {
    name: 'docker',
    icon: docker,
  },
];

const experiences = [
  {
    title: 'Research Assistant',
    company_name: 'California Lutheran University',
    icon: clu,
    iconBg: '#333333',
    date: 'October 2019 - Jan 2021',
  },
  {
    title: 'Front-End Engineer',
    company_name: 'Freelance',
    icon: gglogo,
    iconBg: '#333333',
    date: 'Dec 2020 - Jun 2022',
  },
  {
    title: 'Software Engineer',
    company_name: 'General Motors',
    icon: gm,
    iconBg: '#333333',
    date: 'Jun 2022 - Present',
  },
];

const projects = [
  {
    id: 'project-1',
    name: 'Discord Clone',
    description: 'End-to-end fullstack and real-time discord clone, all with servers, channels, video calls, audio calls, editing and deleting messages as well as member roles',
    tags: [
      {
        name: 'react',
        color: 'blue-text-gradient',
      },
      {
        name: 'mongodb',
        color: 'green-text-gradient',
      },
      {
        name: 'tailwind',
        color: 'pink-text-gradient',
      },
    ],
    image: discordclone,
    repo: 'https://github.com/GabrielRGoldstein/DiscordClone',
    demo: 'https://discordclone-production-5eb1.up.railway.app',
  },
  {
    id: 'project-2',
    name: 'React Netflix Clone',
    description:
      'React app that imitates Netflix, previously hosted using Firebase, but no longer online. Functioning components: search, log-in, sign-up, video player UI, back-end to import a fake library.',
    tags: [
      {
        name: 'react',
        color: 'blue-text-gradient',
      },
      {
        name: 'restapi',
        color: 'green-text-gradient',
      },
      {
        name: 'scss',
        color: 'pink-text-gradient',
      },
    ],
    image: netflixclone,
    repo: 'https://github.com/GabrielRGoldstein/netflix-react-clone/tree/master',
    demo: 'https://github.com/GabrielRGoldstein/netflix-react-clone/tree/master',
  },
  {
    id: 'project-3',
    name: 'Godot Action RPG',
    description: '2D action RPG demo created in Godot game engine. Fully animated character, small game world, character states, enemies with: AI, functioning attacks, and a wander state, player has stats that is represented in the UI. Player Camera + custom sounds.',
    tags: [
      {
        name: 'nextjs',
        color: 'blue-text-gradient',
      },
      {
        name: 'supabase',
        color: 'green-text-gradient',
      },
      {
        name: 'css',
        color: 'pink-text-gradient',
      },
    ],
    image: math,
    repo: 'https://github.com/GabrielRGoldstein/Godot-Action-RPG-Test',
    demo: 'https://github.com/GabrielRGoldstein/Godot-Action-RPG-Test',
  },
  {
    id: 'project-4',
    name: 'More Incoming',
    description: `Stand by for more projects with links to demos and repos.`,
    tags: [
      {
        name: 'nextjs',
        color: 'blue-text-gradient',
      },
      {
        name: 'supabase',
        color: 'green-text-gradient',
      },
      {
        name: 'css',
        color: 'pink-text-gradient',
      },
    ],
    image: movie,
    repo: '',
    demo: '',
  },
  {
    id: 'project-5',
    name: 'More Incoming',
    description: `Stand by for more projects with links to demos and repos.`,
    tags: [
      {
        name: 'nextjs',
        color: 'blue-text-gradient',
      },
      {
        name: 'supabase',
        color: 'green-text-gradient',
      },
      {
        name: 'css',
        color: 'pink-text-gradient',
      },
    ],
    image: movie,
    repo: '',
    demo: '',
  },
  
];

export { services, technologies, experiences, projects };
