export const siteConfig = {
  name: "sbozh.me",
  email: "sem.bozhyk@sbozh.me",
  links: {
    github: "https://github.com/sbozh",
    linkedin: "https://www.linkedin.com/in/sbozhyk",
    x: "https://x.com/sbozhme",
    substackAccount: "https://substack.com/@sbozhme"
  },
} as const;

export const contactEmail = siteConfig.email;
export const contactMailto = `mailto:${siteConfig.email}`;
