
//technologies
import html from '../public/images/icons/html.png';
import css from '../public/images/icons/css.png';
import javascript from '../public/images/icons/javascript.png';
import typescript from '../public/images/icons/typescript.png';
import reactjs from '../public/images/icons/reactjs.png';
import redux from '../public/images/icons/redux.png';
import tailwind from '../public/images/icons/tailwind.png';
import nodejs from '../public/images/icons/nodejs.png';
import graphql from '../public/images/icons/graphql.png';
import postgresql from '../public/images/icons/postgresql.png';
import git from '../public/images/icons/git.png';
import figma from '../public/images/icons/figma.png';
import docker from '../public/images/icons/docker.png';

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
      name: 'Graphql',
      icon: graphql,
    },
    {
      name: 'PostgreSQL',
      icon: postgresql,
    },
    {
      name: 'Git',
      icon: git,
    },
    {
      name: 'Figma',
      icon: figma,
    },
    {
      name: 'Docker',
      icon: docker,
    },
  ];

  // experiences
  import clu from '../public/images/companies/cal_lutheran.svg'
  import gglogo from '../public/images/companies/gg_logo.svg'
  import gm from '../public/images/companies/gm.svg'

  const experiences = [
    {
      title: 'Research Assistant',
      company_name: 'California Lutheran University',
      icon: clu,
      iconBg: '#333333',
      date: 'Oct 2019 - Jan 2021',
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
      date: 'Jun 2022 - Nov 2023',
    },
  ];

  // projects

  import discordclone from '../public/images/projects/discord-clone.png'
  import figmaclone from '../public/images/projects/figma-clone.png'
  import mltradingbot from '../public/images/projects/ml-trading-bot.png'

  const projects = [
    {
      id: 'project-1',
      title: 'Discord Clone',
      description: 'End-to-end fullstack and real-time discord clone, incorporating servers, channels, video calls, audio calls, editing and deleting messages, member roles, and auth.',
      image: discordclone,
      repo: 'https://github.com/GabrielRGoldstein/DiscordClone',
      demo: 'https://discordclone-production-5eb1.up.railway.app',
      hasDemo: true,
    },
    {
      id: 'project-2',
      title: 'ML Trading Bot',
      description: 'This project features an algorithmic trading strategy using sentiment analysis, implemented in Python with the Alpaca API. The MLTrader class employs FinBERT for sentiment analysis, making buy/sell decisions based on news sentiment and incorporating risk management through bracket orders.',
      image: mltradingbot,
      repo: 'https://github.com/GabrielRGoldstein/Python-Trading-Bot',
      demo: 'https://github.com/GabrielRGoldstein/Python-Trading-Bot',
      hasDemo: false,
    },
    {
      id: 'project-3',
      title: 'Figma Clone',
      description: `A minimalistic Figma clone adding real-world features like live collaboration with live cursors, chat, comments, 
      reactions, and drawing designs (shapes, image upload) on the canvas using fabric.js.`,
      image: figmaclone,
      repo: 'https://github.com/GabrielRGoldstein/FigmaClone',
      demo: 'https://figmaclone-production.up.railway.app/',
      hasDemo: true,
    },
    {
      id: 'project-4',
      title: 'Placeholder',
      description: `Placeholder to show that the carousel works. I'm currently working on a Virtual Tabletop that I'll showcase here.`,
      image: gglogo,
      repo: 'https://github.com/GabrielRGoldstein/FigmaClone',
      demo: 'https://figmaclone-production.up.railway.app/',
      hasDemo: true,
    },
  ]


  export {technologies, experiences, projects} 