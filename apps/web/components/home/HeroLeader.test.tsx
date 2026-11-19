import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HeroLeader, LEADER_FROM, LEADER_TICK_MS } from "./HeroLeader";

const leader = () => document.querySelector("[data-leader]")!;
const hand = () => document.querySelector<SVGLineElement>(".leader-hand")!;
const wipe = () => document.querySelector<SVGCircleElement>(".leader-wipe")!;
const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

beforeEach(() => vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] }));

afterEach(() => {
  vi.useRealTimers();
  // jsdom has no Web Animations: a test may have put a stand-in here
  delete (Element.prototype as { getAnimations?: unknown }).getAnimations;
});

describe("HeroLeader", () => {
  it("counts down one tick per number, then says it is done", () => {
    const onDone = vi.fn();
    render(<HeroLeader loading={false} onDone={onDone} />);
    expect(leader()).toHaveAttribute("data-leader", "counting");
    for (let n = LEADER_FROM; n > 0; n--) {
      expect(leader()).toHaveTextContent(String(n));
      expect(onDone).not.toHaveBeenCalled();
      advance(LEADER_TICK_MS);
    }
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(leader()).toHaveAttribute("data-leader", "done");
    // It fades out on its last number and lets clicks through to the video
    expect(leader()).toHaveTextContent("1");
    expect(leader()).toHaveClass("opacity-0", "pointer-events-none");
  });

  it("keeps the first number's hand turning, and gives each later number one turn", () => {
    render(<HeroLeader loading={false} onDone={() => {}} />);
    // First paint comes before this code: the hand goes round until the count takes over
    expect(hand().style.animationIterationCount).toBe("infinite");
    expect(wipe().style.animationIterationCount).toBe("infinite");
    expect(hand().style.animationDuration).toBe(`${LEADER_TICK_MS}ms`);
    const first = hand();
    advance(LEADER_TICK_MS);
    // A new number: a new hand, starting from 12 o'clock
    expect(hand()).not.toBe(first);
    expect(hand().style.animationIterationCount).toBe("1");
    expect(wipe().style.animationIterationCount).toBe("1");
  });

  it("moves off the first number as its hand comes back to 12 o'clock", () => {
    // The hand has been turning for 1.3s when the client takes over: 0.7s of its turn left
    Element.prototype.getAnimations = () => [{ playState: "running", currentTime: 1300 } as Animation];
    render(<HeroLeader loading={false} onDone={() => {}} />);
    advance(699);
    expect(leader()).toHaveTextContent("3");
    advance(1);
    expect(leader()).toHaveTextContent("2");
    // From there on, a full turn each
    advance(LEADER_TICK_MS - 1);
    expect(leader()).toHaveTextContent("2");
    advance(1);
    expect(leader()).toHaveTextContent("1");
  });

  it("gives a still hand (reduced motion) a full tick", () => {
    Element.prototype.getAnimations = () => [{ playState: "finished", currentTime: 0.01 } as Animation];
    render(<HeroLeader loading={false} onDone={() => {}} />);
    advance(LEADER_TICK_MS - 1);
    expect(leader()).toHaveTextContent("3");
    advance(1);
    expect(leader()).toHaveTextContent("2");
  });

  it("shows the spinning brand mark only once the count is over", () => {
    const { rerender } = render(<HeroLeader loading onDone={() => {}} />);
    expect(screen.queryByRole("status")).toBeNull();
    advance(LEADER_TICK_MS);
    advance(LEADER_TICK_MS);
    advance(LEADER_TICK_MS);
    const mark = screen.getByRole("status", { name: "Loading video" });
    expect(mark.querySelector("img")).toHaveClass("leader-mark");
    // Clicks go through it to the video
    expect(mark).toHaveClass("pointer-events-none");
    rerender(<HeroLeader loading={false} onDone={() => {}} />);
    expect(screen.queryByRole("status")).toBeNull();
  });
});
