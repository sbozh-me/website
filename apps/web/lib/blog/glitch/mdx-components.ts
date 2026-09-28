import type { ComponentType } from "react";

import { Censor } from "./censor";
import { DickPitch, Glitch, GlitchState } from "./glitch";
import { Video } from "./video";
import { WindowToggle } from "./window";
import { WindowVideo } from "./window-video";

// Glitch syntax, emitted by remark-glitch: (;) ==a|b== ==D(;)ck pitch== ==WINDOW==
// Shared by blog posts and release notes.
export const glitchMdxComponents: Record<string, ComponentType<any>> = {
  Censor,
  DickPitch,
  Glitch,
  GlitchState,
  WindowToggle,
  // <WindowVideo on="…" off="…" />: the ON cut with the window open, the OFF cut closed
  WindowVideo,
  // <Video src="…" poster="…" />: one silent looping video (landscape or Shorts)
  Video,
};
