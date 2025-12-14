import { render, screen } from "@testing-library/react";
import { StatusBadge } from "./StatusBadge";

describe("StatusBadge", () => {
  describe("rendering", () => {
    it("should render active status correctly", () => {
      render(<StatusBadge status="active" />);
      const badge = screen.getByText("Active");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass("bg-accent", "text-accent-foreground");
    });

    it("should render beta status correctly", () => {
      render(<StatusBadge status="beta" />);
      const badge = screen.getByText("Beta");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass("bg-secondary", "text-secondary-foreground");
    });

    it("should render coming-soon status correctly", () => {
      render(<StatusBadge status="coming-soon" />);
      const badge = screen.getByText("Coming Soon");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass("bg-muted", "text-muted-foreground");
    });

    it("should render archived status correctly", () => {
      render(<StatusBadge status="archived" />);
      const badge = screen.getByText("Archived");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass("bg-muted", "text-muted-foreground");
    });
  });

  describe("accessibility", () => {
    it("should have correct aria-label for active status", () => {
      render(<StatusBadge status="active" />);
      const badge = screen.getByLabelText("Project status: Active");
      expect(badge).toBeInTheDocument();
    });

    it("should have correct aria-label for beta status", () => {
      render(<StatusBadge status="beta" />);
      const badge = screen.getByLabelText("Project status: Beta");
      expect(badge).toBeInTheDocument();
    });

    it("should have correct aria-label for coming-soon status", () => {
      render(<StatusBadge status="coming-soon" />);
      const badge = screen.getByLabelText("Project status: Coming Soon");
      expect(badge).toBeInTheDocument();
    });
  });

  describe("styling", () => {
    it("should apply additional className when provided", () => {
      render(<StatusBadge status="active" className="custom-class" />);
      const badge = screen.getByText("Active");
      expect(badge).toHaveClass("custom-class");
    });

    it("should merge custom className with default styles", () => {
      render(<StatusBadge status="beta" className="ml-4" />);
      const badge = screen.getByText("Beta");
      expect(badge).toHaveClass("bg-secondary", "text-secondary-foreground", "ml-4");
    });
  });
});