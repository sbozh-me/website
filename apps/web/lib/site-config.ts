export const siteConfig = {
  name: "sbozh.me",
  email: "sem.bozhyk@sbozh.me",
  links: {
    github: "https://github.com/sbozh",
    linkedin: "#",
    discord: "/projects/discord-community",
  },
} as const;

export const contactEmail = siteConfig.email;
export const contactMailto = `mailto:${siteConfig.email}`;
