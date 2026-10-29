import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RenesansInterDemoPage, { metadata } from "./page";
import { contacts, faq, packages, treatments } from "./content";

describe("RenesansInterDemoPage", () => {
  it("is not indexed", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("renders the hero heading", () => {
    render(<RenesansInterDemoPage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Честност и откритост - ключ към всяка победа"
    );
  });

  it("renders every treatment card", () => {
    render(<RenesansInterDemoPage />);
    for (const treatment of treatments) {
      expect(screen.getByText(treatment.title).closest("a")).toHaveAttribute("href", treatment.href);
    }
  });

  it("renders every package with its price", () => {
    render(<RenesansInterDemoPage />);
    for (const pkg of packages) {
      const card = screen.getByRole("heading", { level: 3, name: pkg.name }).closest("li")!;
      expect(within(card).getByText(pkg.price)).toBeInTheDocument();
    }
  });

  it("marks only the featured package", () => {
    render(<RenesansInterDemoPage />);
    expect(screen.getAllByText("Най-избиран")).toHaveLength(packages.filter((pkg) => pkg.featured).length);
  });

  it("renders the FAQ as disclosures", () => {
    const { container } = render(<RenesansInterDemoPage />);
    expect(container.querySelectorAll("details")).toHaveLength(faq.length);
  });

  it("keeps the call, Viber and WhatsApp actions in the mobile bar", () => {
    render(<RenesansInterDemoPage />);
    const bar = screen.getByRole("navigation", { name: "Бърза връзка" });
    const hrefs = within(bar)
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"));
    expect(hrefs).toEqual([contacts.phoneHref, contacts.viberHref, contacts.whatsappHref]);
  });

  it("links back to the project page", () => {
    render(<RenesansInterDemoPage />);
    expect(screen.getByRole("link", { name: "sbozh.me" })).toHaveAttribute("href", "/projects/renesans-inter");
  });
});
