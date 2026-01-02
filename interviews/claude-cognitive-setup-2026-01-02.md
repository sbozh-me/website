# Setting Up Claude Cognitive for Persistent Context - Interview & Setup

**Date**: January 2, 2026
**Project**: sbozh.me website
**Goal**: Implement working memory system to reduce context refreshing and token usage

---

## Discovery

Found [Claude Cognitive](https://github.com/GMaN1911/claude-cognitive) - a working memory framework for Claude Code that promises:

- **Context Router**: Tracks file attention (HOT/WARM/COLD) based on mentions
- **Pool Coordinator**: Multi-instance work coordination
- **Persistent Memory**: Reduces need to constantly re-explain codebase
- **Project Documentation**: `.claude/` directory with systems, modules, integrations

---

## Interview: Understanding Requirements

### Q1: How do you typically work with this project?

**Answer**:
- Currently working alone
- Want to learn multi-instance workflows for future
- Typically 1 Claude session, rarely 2 when no conflicts expected

### Q2: What challenges do you face currently?

**Answer**:
- Constantly refreshing context and re-explaining codebase
- High token usage from context reloading
- Want to work on multiple features simultaneously without context loss
- Want Claude Code to maintain awareness of the entire codebase

**Expected outcome**: Reduce token usage and support multiple simultaneous contexts.

### Q3: Your project structure - what are the main "systems"?

**Identified systems**:
- Blog system (Directus CMS, MDX rendering)
- Projects showcase
- CV builder (PMDXJS)
- Analytics/monitoring
- Deployment infrastructure

**Decision**: Let Claude analyze the codebase to properly document these systems.

### Q4: Instance IDs - explanation

**Concept**: Instances are "workspaces"
- **Instance A**: Primary, single-terminal workflow (default)
- **Instance B, C, etc.**: Additional terminals for parallel feature work
- Pool coordinator shares progress between instances to avoid conflicts

**Our setup**:
- Primary mode: Single instance (A) for day-to-day work
- Multi-instance ready: Easy to spin up instance B when needed

---

## Current Status

**Next steps**: About to start installation and setup process.

**Immediate goal**: Get Claude Cognitive working before starting ROADMAP 1.3.0 work.

**Blog post plan**: Document this entire setup process as a blog post.

---

## Setup Process

_(To be filled in during setup)_

### Step 1: Install Scripts
### Step 2: Configure Hooks
### Step 3: Set Instance ID
### Step 4: Create Project Structure
### Step 5: Document Systems
### Step 6: Test & Validate
### Step 7: Multi-instance Workflow Documentation

---

## Resources

- [Claude Cognitive Repository](https://github.com/GMaN1911/claude-cognitive)
- [Setup Guide](https://github.com/GMaN1911/claude-cognitive/blob/main/SETUP.md)