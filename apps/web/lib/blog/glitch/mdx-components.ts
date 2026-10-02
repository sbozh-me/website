import type { ComponentType } from "react";

import { Censor } from "./censor";
import { DickPitch, Glitch, GlitchState, Sbozhed } from "./glitch";
import { Video } from "./video";
import { Voice } from "./voice";
import { WindowButton, WindowToggle } from "./window";
import { WindowVideo } from "./window-video";

// Glitch syntax, emitted by remark-glitch: (;) ==a|b== ==D(;)ck pitch== ==WINDOW==
// Shared by blog posts and release notes.
export const glitchMdxComponents: Record<string, ComponentType<any>> = {
  Censor,
  DickPitch,
  Sbozhed,
  Glitch,
  GlitchState,
  WindowToggle,
  // Inside a glitch state: ==a|WINDOW==
  WindowButton,
  // <WindowVideo on="…" off="…" />: the ON cut with the window open, the OFF cut closed
  WindowVideo,
  // <Voice color="purple">…</Voice>: a speaker's lines, coloured while the window is open
  Voice,
  // <Video src="…" poster="…" />: one silent looping video (landscape or Shorts)
  Video,
};
