import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { PostNavArrows } from "../../../components/post/PostNavArrows";
import { PostNavigation } from "../../../components/post/PostNavigation";
import type { PostListItem } from "../../../types";

const olderPost: PostListItem = {
  id: "1",
  title: "Older Post",
  slug: "older-post",
  excerpt: "What came before",
  date: "2026-01-01",
  readingTime: 3,
  persona: { id: "1", name: "The Founder", slug: "founder", color: "#8b5cf6" },
  tags: [],
  image: { src: "/api/assets/img-1", alt: "Older hero" },
};

const newerPost: PostListItem = {
  ...olderPost,
  id: "2",
  title: "Newer Post",
  slug: "newer-post",
  excerpt: "What came after",
  date: "2026-02-01",
  image: undefined,
};

describe("PostNavigation", () => {
  it("renders nothing without neighbours", () => {
    const { container } = render(<PostNavigation previous={null} next={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("links to previous and next posts", () => {
    render(<PostNavigation previous={olderPost} next={newerPost} />);

    expect(screen.getByRole("link", { name: /Previous post.*Older Post/ })).toHaveAttribute(
      "href",
      "/blog/older-post"
    );
    expect(screen.getByRole("link", { name: /Next post.*Newer Post/ })).toHaveAttribute(
      "href",
      "/blog/newer-post"
    );
  });

  it("shows a downscaled thumbnail for posts with an image", () => {
    render(<PostNavigation previous={olderPost} next={null} />);

    expect(screen.getByRole("img", { name: "Older hero" })).toHaveAttribute(
      "src",
      "/api/assets/img-1?w=960"
    );
  });

  it("keeps a lone next post in the right column", () => {
    render(<PostNavigation previous={null} next={newerPost} />);

    expect(screen.getByRole("link", { name: /Newer Post/ })).toHaveClass("sm:col-start-2");
  });
});

describe("PostNavArrows", () => {
  it("renders nothing without neighbours", () => {
    const { container } = render(<PostNavArrows previous={null} next={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders only the arrows that have a target", () => {
    render(<PostNavArrows previous={olderPost} next={null} />);

    expect(screen.getByRole("link", { name: "Previous post: Older Post" })).toHaveAttribute(
      "href",
      "/blog/older-post"
    );
    expect(screen.queryByRole("link", { name: /Next post/ })).not.toBeInTheDocument();
  });

  it("previews the target post on hover", async () => {
    const user = userEvent.setup();
    render(<PostNavArrows previous={null} next={newerPost} />);

    await user.hover(screen.getByRole("link", { name: "Next post: Newer Post" }));

    expect(await screen.findByText("What came after")).toBeInTheDocument();
  });
});
