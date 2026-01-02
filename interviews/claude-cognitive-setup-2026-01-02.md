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

### Step 1: Install Scripts ✅
**Time**: ~3 minutes

**Actions**:
1. Cloned `claude-cognitive` repository to `~/.claude-cognitive`
2. Copied 5 Python scripts to `~/.claude/scripts/`:
   - `context-router-v2.py` - Tracks file attention (HOT/WARM/COLD)
   - `pool-auto-update.py` - Automatically creates pool entries
   - `pool-loader.py` - Loads pool memory at session start
   - `pool-extractor.py` - Saves pool state on exit
   - `pool-query.py` - Query pool entries
3. Made scripts executable with `chmod +x`

**Validation**: All 5 scripts present in `~/.claude/scripts/`

---

### Step 2: Configure Hooks ✅
**Time**: ~2 minutes

**Actions**:
1. Created backup of `~/.claude/settings.json`
2. Created `setup-claude-hooks.py` script for easy configuration
3. Added 3 hooks to settings:
   - **UserPromptSubmit**: Runs context router + pool updater on each message
   - **SessionStart**: Loads pool memory when starting Claude
   - **Stop**: Saves pool state when exiting Claude

**Validation**: Hooks configured successfully in settings.json

---

### Step 3: Set Instance ID ✅
**Time**: ~1 minute

**Actions**:
1. Added `export CLAUDE_INSTANCE=A` to `~/.zshrc`
2. Sourced config to activate
3. Verified with `echo $CLAUDE_INSTANCE`

**Result**: Instance A set as default for primary workflow

---

### Step 4: Create Project Structure ✅
**Time**: ~5 minutes

**Actions**:
1. Created `.claude/` directory structure:
   ```
   .claude/
   ├── systems/          # Hardware, deployment, infrastructure
   ├── modules/          # Core code systems
   ├── integrations/     # External service integrations
   └── pool/             # Multi-instance coordination
   ```
2. Copied template files from repository
3. Customized `CLAUDE.md` with project-specific information:
   - Architecture overview
   - Quick reference commands
   - Tech stack details
   - Current focus (v1.3.0)
   - Development workflow
   - Multi-instance coordination guide

**Files Created**:
- `.claude/CLAUDE.md` - Main project guide for Claude
- `.claude/systems/example-system.md` - Template
- `.claude/modules/example-module.md` - Template
- `.claude/integrations/example-integration.md` - Template

---

### Step 5: Document Systems ✅
**Time**: ~15 minutes

**Actions**:
Created comprehensive documentation for major systems:

**1. Blog System** (`.claude/modules/blog.md`):
- Repository pattern architecture
- DirectusRepository vs MockRepository
- MDX processing pipeline
- Timeline UI components
- Persona system
- Common operations and troubleshooting

**2. CV Builder / PMDXJS** (`.claude/modules/cv-builder.md`):
- Custom PMDX syntax specification
- Parser pipeline (tokenizer → AST → React)
- Page layouts (A4/Letter)
- Theme system (Obsidian Forge)
- PDF generation workflow
- Common operations and troubleshooting

**3. Directus Integration** (`.claude/integrations/directus.md`):
- API endpoints and authentication
- Collection schemas (posts, personas, tags)
- Data transformation flow
- Content management operations
- Error handling and monitoring

**Documentation Coverage**:
- 3 major modules documented
- Clear architecture diagrams
- API references
- Troubleshooting guides
- Related documentation links

---

### Step 6: Test & Validate ✅
**Time**: ~3 minutes

**Actions**:
1. Tested pool query script:
   ```bash
   python3 ~/.claude/scripts/pool-query.py --since 1h
   ```
   Result: "No entries found" (expected for fresh setup)

2. Verified Instance ID:
   ```bash
   echo $CLAUDE_INSTANCE
   ```
   Result: `A`

3. Checked directory structure:
   ```bash
   ls -la .claude/
   ```
   Result: All directories and files present

**Status**: All components installed and functional

**Next Step**: Restart Claude Code to activate hooks

---

### Step 7: Multi-instance Workflow Documentation ✅
**Time**: ~10 minutes

**Actions**:
Created comprehensive guide: `.claude/MULTI-INSTANCE-WORKFLOW.md`

**Content**:
- Quick start for multiple instances
- How context router and pool coordinator work
- Typical workflow scenarios:
  - Feature + Bugfix (parallel work)
  - Exploration + Implementation (broad vs focused)
  - Parallel Features (frontend + backend)
- Pool communication examples
- Best practices for coordination
- Troubleshooting guide
- Branch-based workflow for maximum isolation

**Use Cases Documented**:
- When to use multiple instances
- How to coordinate on shared files
- Pool entry examples (completed, blocked, researched)
- Context router behavior per instance

---

## Results

### Files Created
```
.claude/
├── CLAUDE.md                           # Main project guide (customized)
├── MULTI-INSTANCE-WORKFLOW.md         # Multi-instance guide
├── modules/
│   ├── blog.md                         # Blog system documentation
│   ├── cv-builder.md                   # PMDXJS documentation
│   └── example-module.md               # Template
├── integrations/
│   ├── directus.md                     # Directus CMS integration
│   └── example-integration.md          # Template
├── systems/
│   └── example-system.md               # Template
└── pool/                               # (auto-populated by scripts)

interviews/
└── claude-cognitive-setup-2026-01-02.md # This document

setup-claude-hooks.py                    # Hook configuration script
```

### Scripts Installed (in ~/.claude/scripts/)
- ✅ context-router-v2.py
- ✅ pool-auto-update.py
- ✅ pool-loader.py
- ✅ pool-extractor.py
- ✅ pool-query.py

### Configuration
- ✅ Hooks configured in ~/.claude/settings.json
- ✅ Instance A set as default
- ✅ Project documentation complete

---

## Next Steps

### Immediate (Before Restart)
1. ✅ Commit all changes to git
2. ⏳ Exit Claude Code completely
3. ⏳ Start fresh Claude Code session
4. ⏳ Verify ATTENTION STATE header appears
5. ⏳ Test context router with file mentions

### After Restart
1. Verify context router shows attention state
2. Test pool query shows activity
3. Create first manual pool entry
4. Start work on ROADMAP 1.3.0

### Future
1. Add more system documentation as needed:
   - `systems/production.md` - Hetzner deployment
   - `systems/analytics.md` - Umami setup
   - `modules/projects.md` - Projects showcase
   - `modules/ui-components.md` - React UI library
2. Experiment with Instance B for parallel work
3. Write blog post about the setup experience

---

## Success Criteria

✅ **Installation Complete**
- All scripts installed and executable
- Hooks configured in settings
- Instance ID set and verified

✅ **Documentation Complete**
- CLAUDE.md customized for project
- 3 major systems documented
- Multi-instance workflow guide created

✅ **Testing Passed**
- Pool query script works
- Instance ID displays correctly
- Directory structure validated

⏳ **Activation Pending**
- Need to restart Claude Code for hooks to activate
- Will see ATTENTION STATE header after restart

---

## Expected Benefits

### Context Management
- **Reduced token usage**: Context router maintains working memory
- **Less re-explanation**: File attention tracked across sessions
- **Smarter context loading**: HOT/WARM/COLD prioritization

### Multi-Instance Support
- **Parallel workflows**: Work on feature + bugfix simultaneously
- **Shared progress**: Pool coordinator prevents duplicate work
- **Independent contexts**: Each instance maintains focused attention

### Documentation
- **Fractal organization**: Systems → Modules → Integrations
- **Self-documenting**: Claude references .claude/ automatically
- **Onboarding ready**: New developers (or future Claude sessions) get instant context

---

## Time Investment

| Phase | Estimated | Actual |
|-------|-----------|--------|
| Installation | 5 min | 5 min |
| Configuration | 5 min | 3 min |
| Documentation | 10 min | 25 min |
| Testing | 5 min | 3 min |
| **Total** | **25 min** | **36 min** |

**Extra time spent**: Creating comprehensive documentation beyond templates

**Worth it?**: Yes - saves hours of context refreshing over time

---

## Resources

- [Claude Cognitive Repository](https://github.com/GMaN1911/claude-cognitive)
- [Setup Guide](https://github.com/GMaN1911/claude-cognitive/blob/main/SETUP.md)
- Local Documentation: `.claude/CLAUDE.md`
- Multi-Instance Guide: `.claude/MULTI-INSTANCE-WORKFLOW.md`

---

## Blog Post Outline

**Title**: "Adding Working Memory to Claude Code: A 30-Minute Setup"

**Sections**:
1. The Problem: Constant context refreshing
2. The Solution: Claude Cognitive framework
3. Setup walkthrough (with code blocks)
4. Documentation strategy
5. First impressions and testing
6. Multi-instance workflows
7. Expected ROI on time investment

**Status**: Interview completed, ready to write

---

**Setup Completed**: 2026-01-02
**Total Time**: 36 minutes
**Ready to activate**: Restart Claude Code to begin