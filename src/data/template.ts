export interface Template {
  id: string;
  name: string;
  tag: string;
  description?: string;
  icon?: string;
  questions?: string[];
}

export const getQuestionsForTemplate = (template: Template) => {
  return templateQuestions[template.id as keyof typeof templateQuestions] || [];
};

// Template-specific questions to guide the building process
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
