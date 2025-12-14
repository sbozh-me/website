import { render, screen } from "@testing-library/react";
import { ProjectCard } from "./ProjectCard";
import type { Project } from "@/lib/projects/types";

const mockProject: Project = {
  slug: "test-project",
  title: "Test Project",
  tagline: "A test project\nwith multiline tagline",
  status: "active",
  heroImage: {
    src: "/test-image.jpg",
    alt: "Test image alt text",
    position: "center",
  },
  meta: [
    { label: "Type", value: "Web App" },
    { label: "Stack", value: "Next.js" },
  ],
  tabs: [
    { id: "about", label: "About", enabled: true },
  ],
  version: "1.0.0",
};

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

describe("ProjectCard", () => {
  describe("rendering", () => {
    it("should render project title", () => {
      render(<ProjectCard project={mockProject} />);
      expect(screen.getByText("Test Project")).toBeInTheDocument();
    });

    it("should render multiline tagline correctly", () => {
      render(<ProjectCard project={mockProject} />);
      const tagline = screen.getByText(/A test project.*with multiline tagline/s);
      expect(tagline).toBeInTheDocument();
      expect(tagline).toHaveClass("whitespace-pre-line");
    });

    it("should render all meta items", () => {
      render(<ProjectCard project={mockProject} />);
      expect(screen.getByText("Type:")).toBeInTheDocument();
      expect(screen.getByText("Web App")).toBeInTheDocument();
      expect(screen.getByText("Stack:")).toBeInTheDocument();
      expect(screen.getByText("Next.js")).toBeInTheDocument();
    });

    it("should render version when provided", () => {
      render(<ProjectCard project={mockProject} />);
      expect(screen.getByText("Version:")).toBeInTheDocument();
      expect(screen.getByText("1.0.0")).toBeInTheDocument();
    });

    it("should not render version when not provided", () => {
      const projectWithoutVersion = { ...mockProject, version: undefined };
      render(<ProjectCard project={projectWithoutVersion} />);
      expect(screen.queryByText("Version:")).not.toBeInTheDocument();
    });

    it("should render hero image with correct props", () => {
      render(<ProjectCard project={mockProject} />);
      const image = screen.getByAltText("Test image alt text");
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute("src", "/test-image.jpg");
    });

    it("should render status badge", () => {
      render(<ProjectCard project={mockProject} />);
      expect(screen.getByText("Active")).toBeInTheDocument();
    });
  });

  describe("linking", () => {
    it("should link to correct project page", () => {
      render(<ProjectCard project={mockProject} />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "/projects/test-project");
    });
  });

  describe("accessibility", () => {
    it("should have accessible link with aria-label", () => {
      render(<ProjectCard project={mockProject} />);
      const link = screen.getByLabelText("View Test Project project details");
      expect(link).toBeInTheDocument();
    });

    it("should have focus styles", () => {
      render(<ProjectCard project={mockProject} />);
      const link = screen.getByRole("link");
      expect(link).toHaveClass("focus:outline-none", "focus:ring-2", "focus:ring-primary");
    });
  });

  describe("styling", () => {
    it("should have hover styles", () => {
      render(<ProjectCard project={mockProject} />);
      const link = screen.getByRole("link");
      expect(link).toHaveClass("hover:border-primary");
    });

    it("should have correct layout classes", () => {
      render(<ProjectCard project={mockProject} />);
      const link = screen.getByRole("link");
      expect(link).toHaveClass("flex", "flex-col", "h-full");
    });
  });
});