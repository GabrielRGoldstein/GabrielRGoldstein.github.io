import {
  frontend,
  backend,
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
  graphql,
  discordclone,
  math,
  movie,
  gm,
  clu,
  ai,
  gglogo,
  netflixclone,
  gglogo_pink,
  clu_pink,
  gm_pink,
  mltrader,
  figmaClone
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
    icon: clu_pink,
    iconBg: '#333333',
    date: 'October 2019 - Jan 2021',
  },
  {
    title: 'Front-End Engineer',
    company_name: 'Freelance',
    icon: gglogo_pink,
    iconBg: '#333333',
    date: 'Dec 2020 - Jun 2022',
  },
  {
    title: 'Software Engineer',
    company_name: 'General Motors',
    icon: gm_pink,
    iconBg: '#333333',
    date: 'Jun 2022 - Nov 2023',
  },
];

const projects = [
  {
    id: 'project-1',
    name: 'Discord Clone',
    description: 'End-to-end fullstack and real-time discord clone, incorporating servers, channels, video calls, audio calls, editing and deleting messages, member roles, and auth.',
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
    hasDemo: true,
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
    hasDemo: false,
  },
  {
    id: 'project-3',
    name: 'ML Trading Bot',
    description: 'This project features an algorithmic trading strategy using sentiment analysis, implemented in Python with the Alpaca API. The MLTrader class employs FinBERT for sentiment analysis, making buy/sell decisions based on news sentiment and incorporating risk management through bracket orders.',
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
    image: mltrader,
    repo: 'https://github.com/GabrielRGoldstein/Python-Trading-Bot',
    demo: 'https://github.com/GabrielRGoldstein/Python-Trading-Bot',
    hasDemo: false,
  },
  {
    id: 'project-4',
    name: 'Figma Clone',
    description: `A minimalistic Figma clone adding real-world features like live collaboration with live cursors, chat, comments, reactions, and drawing designs (shapes, image upload) on the canvas using fabric.js.`,
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
    image: figmaClone,
    repo: 'https://github.com/GabrielRGoldstein/FigmaClone',
    demo: 'https://figmaclone-production.up.railway.app/',
    hasDemo: true,
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
    hasDemo: false,
  },
  
];

export { services, technologies, experiences, projects };
