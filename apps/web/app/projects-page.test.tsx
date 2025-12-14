import { render, screen } from "@testing-library/react";
import ProjectsPage from "./(main)/projects/page";

// Mock the projects data
vi.mock("@/lib/projects/data", () => ({
  getProjects: vi.fn(() => [
    {
      slug: "sbozh-me",
      title: "sbozh.me",
      tagline: "Personal startup project",
      status: "beta",
      heroImage: { src: "/test1.jpg", alt: "Test 1" },
      meta: [{ label: "Type", value: "Web" }],
      tabs: [{ id: "about", label: "About", enabled: true }],
      version: "0.8.4",
    },
    {
      slug: "discord-community",
      title: "Discord Community",
      tagline: "Community project",
      status: "active",
      heroImage: { src: "/test2.jpg", alt: "Test 2" },
      meta: [{ label: "Type", value: "Community" }],
      tabs: [{ id: "about", label: "About", enabled: true }],
      version: "0.1.0",
    },
  ]),
}));

// Mock Next.js Image component
vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt} />;
  },
}));

// Mock Next.js Link component
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  },
}));

describe("ProjectsPage", () => {
  describe("rendering", () => {
    it("should render page heading", () => {
      render(<ProjectsPage />);
      const heading = screen.getByRole("heading", { level: 1, name: "Projects" });
      expect(heading).toBeInTheDocument();
    });

    it("should render page description", () => {
      render(<ProjectsPage />);
      const description = screen.getByText(/Things I'm building/i);
      expect(description).toBeInTheDocument();
    });

    it("should render all projects", () => {
      render(<ProjectsPage />);
      expect(screen.getByText("sbozh.me")).toBeInTheDocument();
      expect(screen.getByText("Discord Community")).toBeInTheDocument();
    });

    it("should render project cards with correct data", () => {
      render(<ProjectsPage />);

      // Check first project
      expect(screen.getByText("Personal startup project")).toBeInTheDocument();
      expect(screen.getByText("0.8.4")).toBeInTheDocument();

      // Check second project
      expect(screen.getByText("Community project")).toBeInTheDocument();
      expect(screen.getByText("0.1.0")).toBeInTheDocument();
    });
  });

  describe("layout", () => {
    it("should use grid layout for project cards", () => {
      render(<ProjectsPage />);
      const projectsSection = screen.getByText("sbozh.me").closest("section");
      expect(projectsSection?.parentElement).toHaveClass("grid");
    });

    it("should have responsive grid columns", () => {
      render(<ProjectsPage />);
      const gridContainer = screen.getByText("sbozh.me").closest("section")?.parentElement;
      expect(gridContainer).toHaveClass("md:grid-cols-2", "lg:grid-cols-3");
    });
  });

  describe("accessibility", () => {
    it("should have proper heading hierarchy", () => {
      render(<ProjectsPage />);
      const h1 = screen.getByRole("heading", { level: 1 });
      expect(h1).toBeInTheDocument();
    });

    it("should have accessible project links", () => {
      render(<ProjectsPage />);
      const sbozhLink = screen.getByLabelText(/View sbozh\.me project details/i);
      expect(sbozhLink).toBeInTheDocument();
      expect(sbozhLink).toHaveAttribute("href", "/projects/sbozh-me");
    });
  });
});