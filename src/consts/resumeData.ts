export const summary = {
  name: "Richard Franks",
  title: "Principal Full Stack Engineer | AI-Driven Systems Architect",
  location: "Boston, MA",
  contact: {
    linkedin: "https://www.linkedin.com/in/richardfranksjr",
    email: "richardfranksjr@hotmail.com",
  },
  blurb:
    "Innovative Principal Full Stack Engineer with 15+ years of experience designing, building, and scaling enterprise-grade software across healthcare, fintech, and cloud platforms. Recognized as a \u201c10x developer\u201d and trusted problem-solver by colleagues, consistently delivering high-impact solutions under tight deadlines.",
};

export const competencies = {
  categories: [
    {
      title: "AI/LLM & RAG Systems",
      items: [
        "Retrieval-augmented generation",
        "LangChain integration",
        "Clinical NLP with ICD-10/SNOMED/LOINC/RxNorm",
      ],
    },
    {
      title: "Frontend",
      items: ["React", "Next.js", "TypeScript", "Design systems", "Monorepos (single-spa)"],
    },
    {
      title: "Backend",
      items: [
        "Python (Django, Flask, FastAPI)",
        "Java (Spring Boot/Hibernate)",
        "TypeScript APIs",
      ],
    },
    {
      title: "Cloud & DevOps",
      items: [
        "Azure Functions",
        "CosmosDB",
        "GitHub Actions CI/CD",
        "Containerized deployments",
      ],
    },
    {
      title: "Data & Integration",
      items: [
        "REST APIs",
        "Event-driven microservices",
        "PostgreSQL",
        "MongoDB",
        "MySQL",
      ],
    },
    {
      title: "Leadership",
      items: [
        "Architecture board member",
        "Engineering mentor",
        "Cross-functional collaboration with product, UX, QA, and DevOps",
      ],
    },
  ],
  skills: [
    "React.js",
    "TypeScript",
    "Software Architecture",
    "Python (Programming Language)",
    "Team Leadership",
    "Web Services",
    "JavaScript",
    "Agile",
    "Spring Boot",
    "Java",
    "Spring",
    "JSP",
    "Python",
    "Django",
    "MySQL",
    "REST",
    "Backbone.js",
    "jQuery",
    "AJAX",
    "HTML",
    "CSS",
    "J2EE",
    "Swagger",
    "Hibernate",
    "JUnit",
    "Ant",
    "Subversion",
    "Linux",
    "Apache",
    "Tomcat",
    "XML",
    "Servlets",
    "Git",
    "Google Analytics",
    "IntelliJ IDEA",
    "Eclipse",
    "Maven",
    "Github",
    "UML",
    "Windows",
    "Mac OS X",
    "PostgreSQL",
    "Oracle SQL",
    "Cascading Style Sheets (CSS)",
    "Jenkins",
    "JPA",
    "SQL",
    "Leadership",
    "Handlebars.js",
    "Liferay",
    "Portlets",
    "Mercurial",
    "TestNG",
    "MVC",
  ],
};

export const coreCompetencies = competencies.skills;

export const experience = [
  {
    company: "Commure",
    position: "Senior Software Architect / Principal Full Stack Engineer",
    location: "Waltham, MA",
    start: "June 2022",
    end: "July 2025",
    details: [
      "Architected and delivered a GenAI Copilot for physicians, integrating LLMs + RAG pipelines to summarize EHRs, extract problems/risk factors, and recommend labs/medications.",
      "Built scalable Python and TypeScript Azure Functions APIs with CosmosDB persistence.",
      "Developed Next.js/React dashboards for real-time clinical insights, seamlessly integrated into physician workflows.",
      "Mentored engineers across UI and backend teams, shaping cloud-native deployment strategies.",
    ],
    achievements: [
      "Delivered multiple AI-powered clinical tools now in production use.",
      "Accelerated delivery pipelines via GitHub Actions automation.",
    ],
  },
  {
    company: "PatientKeeper",
    position: "Principal Software Engineer / Architect",
    location: "Waltham, MA",
    start: "2013",
    end: "2022",
    details: [
      "Re-architected a legacy physician portal into a customizable dashboard framework with 200+ gadgets, modernizing UX and performance.",
      "Built enterprise-wide React/TypeScript monorepo libraries for reusable components.",
      "Designed and implemented REST APIs using Spring and Hibernate, powering core EHR features.",
      "Served on the Architecture Board, influencing technology direction and engineering best practices.",
    ],
    achievements: [
      "Recognized with STAR Award (2020).",
      "Employee of the Quarter nomination (2018).",
    ],
  },
  {
    company: "CashStar",
    position: "Engineer",
    location: "Portland, ME",
    start: "2009",
    end: "2010",
    details: [
      "Designed and implemented a Java REST service layer integrating with 36+ gift card/payment processors.",
      "Achieved 99.88% uptime, praised by partners for record-fast certification turnaround.",
    ],
  },
  {
    company: "REZ-1",
    position: "Engineer",
    details: [
      "Enterprise UI + backend engineering with Spring, Hibernate, Vaadin.",
    ],
  },
  {
    company: "IDEXX",
    position: "Consultant",
    details: ["Consultant on veterinary practice management platform."],
  },
  {
    company: "Fetch Enterprises",
    position: "Full-stack Developer",
    details: ["Full-stack developer (Java, Django)."],
  },
];

export const projects = [
  {
    name: "Warbirds",
    description: "Dogfight through the skies in this arcade shooter.",
    href: "/warbirds",
    image: "/images/projects/warbirds.svg",
  },
  {
    name: "ZombieFish",
    description: "Hook undead fish before they bite.",
    href: "/zombiefish",
    image: "/images/projects/zombiefish.svg",
  },
  {
    name: "Blackjack",
    description: "Classic twenty-one card game against the dealer.",
    href: "/blackjack",
    image: "/images/projects/blackjack.svg",
  },
  {
    name: "GeneBoard",
    description: "Interactive tools for exploring DNA sequences.",
    href: "/dna",
    image: "/images/projects/geneboard.svg",
  },
  {
    name: "Bookworm",
    description: "Word puzzle game built with React.",
    href: "/bookworm",
    image: "/images/projects/bookworm.svg",
  },
];

export const recognition = {
  snippets: [
    "Praised by colleagues as \"the most brilliant engineer I\u2019ve worked with… the closest to a 10x developer\" and a \"true team player and mentor.\"",
    "Trusted go-to for solving critical, high-stakes production issues with speed and quality.",
    "Recognized repeatedly for leadership, mentorship, and engineering excellence.",
  ],
  recommendations: [
    {
      name: "Stacey Leadbeater",
      title: "Product Management | Healthcare",
      date: "March 6, 2020",
      relationship: "worked with Richard on the same team",
      text: `I have had the pleasure of working closely with Richard for many years as a product manager. Richard has been a lead, integral part of completely rewriting a legacy physician-facing portal into a customizable dashboard framework with modern technology - no small or easy feat.

Richard always goes out of his way to truly understand workflows and the end user problems, as well as consider technical aspects in order to implement the right solution. He is a true team player: working with product and UX to design the right changes; consulting with other developers and providing documentation to ensure they are following best implementation practices and agreed-upon methods; working with QA to ensure chagnes are fully tested and automation has what they need; and reviewing end user documenation.

Richard is a leader, and as an architect is often called on to advise on the right technical chagnes to make. He is diligent about documenting his work, which allows other engineers to more easily come on board. He is always willing to provide guidance and input to others in development.

Richard is so good that he's in the sometimes unenviable position of being the go-to person to fix any problem. This means he solves many of the toughest problems, which are often critical in nature and requiring a solution ASAP, and which pull him away from other items he may be working on. He is an excellent multi-tasker and able to jump in to help in almost any situation.

I enjoy working with Richard very much, and would choose to be on a team with him in a heartbeat!`,
    },
    {
      name: "Richard Tang",
      title: "Senior Software Engineer | Front-end Software Engineer",
      date: "March 5, 2020",
      relationship: "was senior to Richard but didn't manage him directly",
      text: `Richard is truly the most brilliant software engineer/developer/architect I have worked with. We have worked together since 2015 (~5 years at the time of this writing). I used to think the "10x developer" was a myth, but he is the closest to that I have seen! It's amazing how quickly he is able to build features/functionality while still achieving high quality and flexibility. Being able to work with him on the same team ("core" code/functionality) has allowed me to learn so much about design, architecture, and best practices. I have definitely become a much better UI/front-end and full-stack developer because of him... he is the go-to guy, so whether it's asking him questions (he's very helpful), or just looking at his code, there is a lot to learn from him.`,
    },
    {
      name: "Satyajeet Nandekar",
      title: "Software Engineer at Amazon Web Services (AWS)",
      date: "February 24, 2020",
      relationship: "worked with Richard on the same team",
      text: `It is pleasure to work with Richard Franks in the same team for more than 5 years. During this time, we worked very closely on multiple successful projects from start to finish. He is creative, energetic, solution oriented, highly motivated with great communication skills and aims for excellence all the time.

Richards’s deeper understanding of the technical nuances always helped us during the tough time of our project. His inputs in design discussions and architecture meetings have always been valuable. From my past experience, I can easily say that a problem assigned to him is already half solved. He is an asset to any company.`,
    },
    {
      name: "Jane Florins",
      title: "UX/UI Leader | Elevating User Experiences & Driving Business Growth through Innovative Designs.",
      date: "February 20, 2020",
      relationship: "was senior to Richard but didn't manage him directly",
      text: `I worked with Richard on a number of projects and features at Patient Keeper. What makes him stand out is his deep care about his work and the overall success of the company. He is willing to take risks and responsibilities when he sees an opportunity to improve the project. Richard's approach to work is innovative. He is constantly coming up with new ideas, he does his research before attacking a problem. Richard is a meticulous perfectionist who doesn't give up unless his work is done to the highest quality. He is a good team player who is always ready to jump in and help his co-workers. He cares about UX/UI, and he cares about our customers and their experience. He made a significant effort to make our product look polished and work faster. I would highly recommend Richard for his personality and skills.`,
    },
    {
      name: "Ritika Nanda",
      title: "Senior Software Engineer at Google",
      date: "August 8, 2016",
      relationship: "Richard was senior to Ritika but didn't manage her directly",
      text: `It was a pleasure working with Richard at Patient Keeper. He is one of the best developers and architecture designers I have ever worked with.

He was very helpful to co-workers. He always came up with creative and out of the box ideas for solving problems.

Richard came up with robust design and code for all the projects I worked with him.

He is a great developer and a team worker. I got a chance to learn a lot from him.`,
    },
    {
      name: "Amisha Thakkar Kashyap",
      title: "Head of AI Products - Product Management",
      date: "January 18, 2015",
      relationship: "worked with Richard but on different teams",
      text: `Richard is an uber-talented architect and development lead. He leads by example by setting high standards. He is a rare engineer who thinks both about smart software development and the user.

He designs intuitive software. He builds scalable, extendible products that are user-friendly. He leverages the latest in technology and design patterns. His code is elegant, built with reliable, extendible foundations and great frameworks.

In all aspects of software development Richard is superb - design, testing and documentation. He delivers high quality products on-time which have unit-tests and code documentation even under tough deadlines. He thinks not just about product design and features but also about the maintenance of the code in the future. He writes self testing code that prevents regressive defects. In the time I worked with him I saw him introduce new frameworks, unit tests, self documenting capabilities in an older stringent code base.

He is an excellent mentor. He works incredibly hard and it is a pleasure to work with him. Richard is an invaluable asset to any team he leads!`,
    },
    {
      name: "Dave Tran",
      title: "Mission-Driven Engineering Leader | Unlocking Team Superpowers and Turning Challenges into Triumphs!",
      date: "November 3, 2013",
      relationship: "worked with Richard on the same team",
      text: `Rich was an amazing team member to work with and was instrumental in helping the team deliver the next generation patient list solution. Rich was not only laser focused on implementing the web portion of the solution but he was also equally focused on improving the UI architecture of the overall application. He incorporated industry best practices and reusable web components to facilitate better design decisions for multiple development teams moving forward. Rich understands how to meet and exceed client's expectations with innovative web solutions and if given another opportunity to work with Rich, I would jump at the chance to do so!`,
    },
    {
      name: "Melissa Snyder",
      title: "Software Design Architect at COCC",
      date: "January 20, 2012",
      relationship: "worked with Richard on the same team",
      text: `I had the opportunity to work with Richard for over a year as part of a full application rewrite. He is extremely conscientious and consistently offers up suggestions for how to make coding more efficient, to improve code quality and to improve the end-user experience. He was also able to help me and others without coding backgrounds to understand the possibilities and constraints of the system we were building. Richard is always willing to help a coworker by answering a question, troubleshooting an issue, or brainstorming product solutions. He is a great person to work with and always delivers a quality product.`,
    },
    {
      name: "Paul Russell",
      title: "Software Engineer at WiseTech Global",
      date: "January 8, 2012",
      relationship: "worked with Richard on the same team",
      text: `Richard is a brilliant software developer. He has exceptional design skills and continuously searches for ways to improve the quality of the software.

He takes the time to answer questions from colleagues and is always available when there is a problem.`,
    },
    {
      name: "Nathan Babb",
      title: "Software Consultant at IDEXX",
      date: "January 5, 2012",
      relationship: "worked with Richard on the same team",
      text: `Richard is a personable colleague, a talented software engineer and it has been a pleasure working with him. He is committed to writing quality code, and it shows in his practical, concise designs. Richard has very high personal standards and integrity, and he often goes out of his way to help others and take on challenging tasks. I've enjoyed collaborating with Richard, where his focus is towards producing the best design possible. He is diligent with coding standards, and is very productive as well. He gets my hearty recommendation!`,
    },
    {
      name: "Jim Levin",
      title: "Senior Product Analyst with a specific expertise in analysis, user experience and user interface design",
      date: "December 30, 2011",
      relationship: "worked with Richard on the same team",
      text: `Rich is a professional, thorough and thoughtful developer - that I would recommend/refer without hesitation.`,
    },
    {
      name: "Phelps Peeler",
      title: "Proven Product and Technology Leadership",
      date: "October 22, 2010",
      relationship: "managed Richard directly",
      text: `Richard is an exceptionally talented engineer. Very early in his career he has demonstrated the ability to resolve the type of complex issues that can stymie gifted developers with significantly more experience. During the time Richard worked for me he consistently performed above the expectations that were set for him, even as those expectations were raised with each additional success.

Richard is methodical when attacking a problem -- he consistently identifies and addresses edge-cases that are missed in the business requirements and he shows a greater dedication than any engineer I've ever worked with to developing and implementing test cases that mirror production as closely as is possible. This significantly reduced risk, and rendered deployments that could have been nerve-wracking stress-free.

Richard's work required constant interaction with critical external business partners. Richard excelled both at the immediate task at hand and at developing lasting relationships with these partners. First Data, a giant organization that has run literally thousands of companies through a particular, complicated certification process, reported that Richard completed the necessary tasks more quickly than anyone before him. Multiple partners reached out to tell me how much they enjoyed working with Richard, and the relationships Richard developed enabled us to convince these partners to accelerate their standard timeline in ways that allowed us to accomplish things we couldn't have otherwise.

Richard is bursting with talent, and I'm very excited to see where his career will take him, and I'm confident that he'll excel wherever he ends up.`,
    },
    {
      name: "Bill Hardwick",
      title: "Software Engineering Leader",
      date: "July 14, 2010",
      relationship: "worked with Richard on the same team",
      text: `Richard is a very skilled developer with a passion for technology. He is a creative problem-solver and is always looking to utilize the latest tools, frameworks, and design patterns to keep him on the cutting edge of the industry. His work ethic is outstanding and he gets the job done fast and efficiently, without sacrificing the quality of his code. I would recommend Richard to anyone looking for a talented developer who works well with others or independently.`,
    },
    {
      name: "Mat Young",
      title: "Art Director at Transparent Audio",
      date: "July 7, 2009",
      relationship: "worked with Richard on the same team",
      text: `Richard is a creative problem solver who will always look for the best solution.

He is willing to go the extra mile and endeavor in new areas for the sake of the best possible product.

He is very easy to work with and you can count on him to follow through.

I highly recommend Richard.`,
    },
    {
      name: "Joe Myers",
      title: "Head of Product Design & User Experience @ Gannett | USA TODAY NETWORK — Driving clean, enjoyable, and accessible solutions at scale",
      date: "October 2, 2008",
      relationship: "worked with Richard on the same team",
      text: `Please do not talk to Richard about other jobs. He is an indispensable member of OUR development team. We found him first and he's not allowed to leave. Richard breezes through complicated work with a can-do attitude while adding invaluable insight. He brings his "A-Game" every day, and if there's any doubt in his mind, he'll step back, slam a Monster™ Energy Drink® before high-stepping into the end-zone. Too bad he's not allowed to talk to you.`,
    },
  ],
};

export const education = [
  {
    school: "University of Southern Maine",
    degree: "M.S. Computer Science",
  },
  {
    school: "Boston University",
    degree: "B.S. Biomedical Engineering",
  },
];
