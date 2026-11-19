import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HeroLeader, LEADER_FROM, LEADER_TICK_MS } from "./HeroLeader";

const leader = () => document.querySelector("[data-leader]")!;
const hand = () => document.querySelector<SVGLineElement>(".leader-hand")!;
const wipe = () => document.querySelector<SVGCircleElement>(".leader-wipe")!;
const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

/** Scrolls the page: anywhere below the very top, the film stands still */
function scrollTo(y: number) {
  Object.defineProperty(window, "scrollY", { value: y, configurable: true });
  fireEvent.scroll(window);
}

/** jsdom has no Web Animations: the hand's turn, as the browser would report it */
function handTurn(at: (hand: Element) => number, playState = "running") {
  Element.prototype.getAnimations = function (this: Element) {
    return [{ playState, currentTime: at(this) } as Animation];
  };
}

beforeEach(() => vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] }));

afterEach(() => {
  vi.useRealTimers();
  Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
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
    render(<HeroLeader loading={false} onDone={() => {}} />);
    const first = hand();
    // The hand has been turning for 1.3s when the client takes over: 0.7s of its turn left.
    // Every later number gets a new hand, starting from 12 o'clock.
    handTurn((el) => (el === first ? 1300 : 0));
    // (the count reads the hand as it starts: start it again, now that there is one to read)
    scrollTo(1);
    scrollTo(0);
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
    handTurn(() => 0.01, "finished");
    render(<HeroLeader loading={false} onDone={() => {}} />);
    advance(LEADER_TICK_MS - 1);
    expect(leader()).toHaveTextContent("3");
    advance(1);
    expect(leader()).toHaveTextContent("2");
  });

  it("stands still while the visitor is scrolled away, even slightly", () => {
    const onDone = vi.fn();
    render(<HeroLeader loading={false} onDone={onDone} />);
    advance(LEADER_TICK_MS);
    expect(leader()).toHaveTextContent("2");
    expect(leader()).not.toHaveAttribute("data-paused");
    scrollTo(1);
    // The whole film stops with the count (globals.css pauses what is under data-paused)
    expect(leader()).toHaveAttribute("data-paused");
    advance(LEADER_TICK_MS * 10);
    expect(leader()).toHaveTextContent("2");
    scrollTo(0);
    expect(leader()).not.toHaveAttribute("data-paused");
    advance(LEADER_TICK_MS);
    expect(leader()).toHaveTextContent("1");
    advance(LEADER_TICK_MS);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("goes on from where the hand stood when the visitor comes back", () => {
    render(<HeroLeader loading={false} onDone={() => {}} />);
    advance(LEADER_TICK_MS);
    // The browser froze the hand 0.6s into the second number's turn
    handTurn(() => 600);
    scrollTo(40);
    advance(LEADER_TICK_MS * 3);
    scrollTo(0);
    advance(399);
    expect(leader()).toHaveTextContent("2");
    advance(1);
    expect(leader()).toHaveTextContent("1");
  });

  it("waits from the start on a page that opens scrolled down", () => {
    Object.defineProperty(window, "scrollY", { value: 300, configurable: true });
    render(<HeroLeader loading={false} onDone={() => {}} />);
    expect(leader()).toHaveAttribute("data-paused");
    advance(LEADER_TICK_MS * 5);
    expect(leader()).toHaveTextContent("3");
  });

  it("is an old black-and-white reel: grey frame, grain, scratches, a flickering lamp", () => {
    render(<HeroLeader loading={false} onDone={() => {}} />);
    expect(leader()).toHaveClass("leader-film");
    for (const part of ["leader-grain", "leader-scratch", "leader-flicker", "leader-weave"]) {
      expect(leader().querySelector(`.${part}`)).not.toBeNull();
    }
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
