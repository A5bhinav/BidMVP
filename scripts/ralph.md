# Ralph Loop — Iteration Protocol

> This is the exact process an AI agent (or human) follows for each iteration.
> One loop = one checkbox item from PRD.md. No skipping steps.

## The Loop

```
┌─────────────────────────────────────────┐
│  1. PICK   → Choose next unchecked item │
│  2. PLAN   → State what you'll change   │
│  3. CODE   → Make the smallest change   │
│  4. VERIFY → Run: npm run verify        │
│  5. MARK   → Check the box in PRD.md    │
│  6. REPEAT → Go to step 1              │
└─────────────────────────────────────────┘
```

### Step 1: PICK
- Open `PRD.md`
- Find the first unchecked `[ ]` item
- If all items are checked, stop — the loop is done

### Step 2: PLAN
- State which files you will create or modify
- If the change touches more than 3 files, break it into smaller items in PRD.md first
- If the change requires a new dependency, STOP and ask for approval

### Step 3: CODE
- Make the change
- Keep it small — one logical unit of work
- Follow rules in `AGENTS.md`

### Step 4: VERIFY
```bash
npm run verify
```
- Lint must pass with zero errors
- Build must pass with zero errors
- If either fails, fix and re-run before proceeding
- **Do NOT skip this step. Do NOT claim "it should work."**

### Step 5: MARK
- Change `[ ]` to `[x]` in `PRD.md` for the completed item
- If verification failed and you had to fix something, note it

### Step 6: REPEAT
- Go back to Step 1
- Continue until all items in the current loop section are checked

## Rules

1. **One item per loop.** Don't batch multiple checkboxes.
2. **Verify every time.** The build is the source of truth, not your confidence.
3. **If stuck for more than 10 minutes, stop and ask.** Don't spiral.
4. **Never mark done without passing verification.**
5. **Keep PRD.md as the single source of truth** for what's done and what's left.

## Starting a New Loop

When all items in a PRD section are done:
1. Add a new section to `PRD.md` with the next set of items
2. Run `npm run verify` one final time to confirm everything is clean
3. Commit with message: `[loop] complete Loop N — <summary>`
