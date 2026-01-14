export interface Template {
  id: string;
  name: string;
  tag: string;
  description?: string;
  icon?: string;
  questions?: string[];
}

export interface BlockTypeConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  questions: string[];
  suggestedConnectors?: string[];
}

export const getQuestionsForTemplate = (template: Template) => {
  return templateQuestions[template.id as keyof typeof templateQuestions] || [];
};

// Block type specific questions for the onboarding flow
export const blockTypeQuestions: Record<string, BlockTypeConfig> = {
  creator: {
    id: 'creator',
    name: 'Creator Block',
    icon: '🎨',
    description: 'Art, music, writing, culture, expression',
    questions: [
      "What kind of creative work do you do or want to showcase?",
      "Who is your audience — who do you want to reach with your work?",
      "How do you want people to experience or interact with your creations?",
      "Do you want to sell your work, share it freely, or build a following first?",
      "What tools or platforms do you currently use for your creative process?",
      "What would make this block feel authentically *you*?",
    ],
    suggestedConnectors: ['events', 'collab'],
  },
  community: {
    id: 'community',
    name: 'Community Block',
    icon: '🧠',
    description: 'Events, meetups, education, organizing',
    questions: [
      "What brings your community together — what's the shared purpose or passion?",
      "Who are the people you want to gather? Describe your ideal member.",
      "What kinds of activities or events will happen in your community?",
      "How will members connect with each other and build relationships?",
      "What does a thriving version of this community look like in 6 months?",
      "How will you welcome new members and maintain the culture?",
    ],
    suggestedConnectors: ['events', 'collab', 'gamenight'],
  },
  project: {
    id: 'project',
    name: 'Project / Product Block',
    icon: '🏗',
    description: 'Apps, tools, experiments, startups',
    questions: [
      "What are you building and what problem does it solve?",
      "Who will use this and why would they care?",
      "What exists today that people use instead? What's broken about it?",
      "What's the smallest version you could launch to learn something?",
      "What skills or resources do you need to make this real?",
      "How will you know if it's working — what does success look like?",
    ],
    suggestedConnectors: ['collab'],
  },
  business: {
    id: 'business',
    name: 'Business Block',
    icon: '🏪',
    description: 'Local services, venues, shops',
    questions: [
      "What does your business do? Describe it like you're telling a friend.",
      "Who are your customers and how do they find you today?",
      "What makes your business special — why should people choose you?",
      "What's the one thing you wish more people knew about your business?",
      "How do you want customers to interact with you through this block?",
      "What would help you serve your community better?",
    ],
    suggestedConnectors: ['events'],
  },
  game: {
    id: 'game',
    name: 'Game / Interactive Block',
    icon: '🎮',
    description: 'Experiences, quests, play',
    questions: [
      "What kind of experience are you creating — game, quest, interactive story?",
      "What's the core loop or mechanic that makes it fun?",
      "Who is this for and what will they feel while playing?",
      "How long should a typical session last?",
      "Will people play alone, together, or compete against each other?",
      "What makes someone want to come back and play again?",
    ],
    suggestedConnectors: ['gamenight', 'events'],
  },
  unsure: {
    id: 'unsure',
    name: 'Not Sure Yet',
    icon: '🌱',
    description: 'Help me shape it',
    questions: [
      "What's been on your mind lately — any ideas you keep coming back to?",
      "What are you good at or passionate about?",
      "Who do you want to help or connect with?",
      "Is there a problem you see in your community that bothers you?",
      "If you could wave a magic wand and create anything, what would it be?",
      "What would make you excited to work on this every day?",
    ],
    suggestedConnectors: [],
  },
};

// Legacy template questions (keeping for backwards compatibility)
export const templateQuestions = {
  webapp: [
    "What is the name of your web application?",
    "What problem does it solve for your users?",
    "Who is your primary target audience?",
    "What are the 3-5 core features you want to launch with?",
    "How will users discover and access your app?",
    "What does success look like in 30 days? 90 days?",
    "What existing tools or workflows will this integrate with?",
  ],
  marketplace: [
    "What type of marketplace are you building?",
    "Who are your buyers and who are your sellers?",
    "What makes your marketplace unique or better than existing options?",
    "How will you handle transactions and payments?",
    "What trust and safety measures will you implement?",
    "How will you attract your first 100 users on each side?",
  ],
  community: [
    "What is the purpose or mission of your community?",
    "Who is your ideal member?",
    "What value will members get from joining?",
    "How will members interact with each other?",
    "What content or events will drive engagement?",
    "How will you moderate and maintain community standards?",
  ],
  tool: [
    "What specific task or workflow does your tool improve?",
    "Who will use this tool and how often?",
    "What's the current manual or inefficient process it replaces?",
    "What are the key inputs and outputs?",
    "How will users know if the tool is working correctly?",
    "What integrations or APIs will you need?",
  ],
  content: [
    "What type of content platform are you building?",
    "Who are your content creators and who are your consumers?",
    "What makes your content approach unique?",
    "How will content be discovered and shared?",
    "What is your monetization strategy?",
    "How will you ensure content quality and relevance?",
  ],
  api: [
    "What service or data does your API provide?",
    "Who are the developers that will integrate with it?",
    "What are the primary endpoints and their purposes?",
    "How will you handle authentication and rate limiting?",
    "What documentation and support will you provide?",
    "How will you version and maintain backwards compatibility?",
  ],
  custom: [
    "Describe your project in a few sentences.",
    "What inspired you to build this?",
    "Who will benefit most from what you're building?",
    "What are the must-have features for launch?",
    "What's your timeline and key milestones?",
    "What resources or skills do you need?",
    "How will you know when it's successful?",
  ],
};

export const defaultTemplates = [
  {
    id: "webapp",
    name: "Build a Web Application",
    tag: "Popular",
    description:
      "Create a user-facing web application with authentication, data management, and a polished interface.",
  },
  {
    id: "marketplace",
    name: "Launch a Marketplace",
    tag: "Commerce",
    description:
      "Connect buyers and sellers with a platform for transactions, listings, and discovery.",
  },
  {
    id: "community",
    name: "Build a Community",
    tag: "Social",
    description:
      "Create a space for people to connect, share, and collaborate around a common interest.",
  },
  {
    id: "tool",
    name: "Create a Tool or Utility",
    tag: "Productivity",
    description:
      "Build something that solves a specific problem or automates a tedious task.",
  },
  {
    id: "content",
    name: "Build a Content Platform",
    tag: "Media",
    description:
      "Create a platform for publishing, discovering, or consuming content at scale.",
  },
  {
    id: "api",
    name: "Build an API Service",
    tag: "Developer",
    description:
      "Create a backend service or API that other developers can integrate with.",
  },
  {
    id: "custom",
    name: "Something Else",
    tag: "Open",
    description:
      "Have a unique idea? Start from scratch and define your own vision.",
  },
].map((t) => ({
  ...t,
  questions: getQuestionsForTemplate(t),
}));
