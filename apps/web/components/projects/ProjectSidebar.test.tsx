import { render, screen } from "@testing-library/react";
import { ProjectSidebar } from "./ProjectSidebar";
import type { ProjectTab } from "@/lib/projects/types";

// Mock Next.js navigation hooks
const mockPathname = "/projects/test-project";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
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

const mockTabs: ProjectTab[] = [
  { id: "about", label: "About", enabled: true },
  { id: "features", label: "Features", enabled: true },
  { id: "disabled", label: "Disabled Tab", enabled: false },
  { id: "roadmap", label: "Roadmap", enabled: true },
];

describe("ProjectSidebar", () => {
  describe("rendering", () => {
    it("should render enabled tabs only", () => {
      render(<ProjectSidebar slug="test-project" tabs={mockTabs} />);

      expect(screen.getByText("About")).toBeInTheDocument();
      expect(screen.getByText("Features")).toBeInTheDocument();
      expect(screen.getByText("Roadmap")).toBeInTheDocument();
      expect(screen.queryByText("Disabled Tab")).not.toBeInTheDocument();
    });

    it("should be hidden on mobile", () => {
      render(<ProjectSidebar slug="test-project" tabs={mockTabs} />);
      const aside = screen.getByRole("complementary");
      expect(aside).toHaveClass("hidden", "lg:block");
    });
  });

  describe("navigation", () => {
    it("should generate correct href for about tab", () => {
      render(<ProjectSidebar slug="test-project" tabs={mockTabs} />);
      const aboutLink = screen.getByRole("tab", { name: "About" });
      expect(aboutLink).toHaveAttribute("href", "/projects/test-project");
    });

    it("should generate correct href for other tabs", () => {
      render(<ProjectSidebar slug="test-project" tabs={mockTabs} />);
      const featuresLink = screen.getByRole("tab", { name: "Features" });
      expect(featuresLink).toHaveAttribute("href", "/projects/test-project/features");

      const roadmapLink = screen.getByRole("tab", { name: "Roadmap" });
      expect(roadmapLink).toHaveAttribute("href", "/projects/test-project/roadmap");
    });
  });

  describe("active state", () => {
    it("should mark about tab as active when on project root", () => {
      render(<ProjectSidebar slug="test-project" tabs={mockTabs} />);
      const aboutLink = screen.getByRole("tab", { name: "About" });

      expect(aboutLink).toHaveAttribute("aria-selected", "true");
      expect(aboutLink).toHaveAttribute("aria-current", "page");
      expect(aboutLink).toHaveClass("bg-primary/10", "text-primary");
    });

    it("should mark non-active tabs correctly", () => {
      render(<ProjectSidebar slug="test-project" tabs={mockTabs} />);
      const featuresLink = screen.getByRole("tab", { name: "Features" });

      expect(featuresLink).toHaveAttribute("aria-selected", "false");
      expect(featuresLink).not.toHaveAttribute("aria-current");
      expect(featuresLink).toHaveClass("text-muted-foreground");
    });
  });

  describe("accessibility", () => {
    it("should have proper ARIA attributes", () => {
      render(<ProjectSidebar slug="test-project" tabs={mockTabs} />);

      const nav = screen.getByRole("navigation");
      expect(nav).toHaveAttribute("aria-label", "Project navigation");

      const tablist = screen.getByRole("tablist");
      expect(tablist).toBeInTheDocument();

      const tabs = screen.getAllByRole("tab");
      expect(tabs).toHaveLength(3); // Only enabled tabs
    });

    it("should have focus styles", () => {
      render(<ProjectSidebar slug="test-project" tabs={mockTabs} />);
      const tabs = screen.getAllByRole("tab");

      tabs.forEach(tab => {
        expect(tab).toHaveClass("focus:outline-none", "focus:ring-2", "focus:ring-primary");
      });
    });
  });

  describe("styling", () => {
    it("should have sticky positioning", () => {
      render(<ProjectSidebar slug="test-project" tabs={mockTabs} />);
      const aside = screen.getByRole("complementary");
      expect(aside).toHaveClass("sticky", "top-24");
    });

    it("should have hover styles on non-active tabs", () => {
      render(<ProjectSidebar slug="test-project" tabs={mockTabs} />);
      const featuresLink = screen.getByRole("tab", { name: "Features" });
      expect(featuresLink).toHaveClass("hover:text-foreground", "hover:bg-muted");
    });
  });
});