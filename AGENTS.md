# Agent Instructions

This project follows a strict implementation standard defined in **`docs/IMPLEMENTATION_GUIDE.md`**.

## Before every task

1. Read `docs/IMPLEMENTATION_GUIDE.md` in full if you have not already read it in this session. Do not rely on memory from other projects.
2. Check `package.json` for installed `@msflib/*` packages. Before using one, read its types in `node_modules/@msflib/<pkg>/dist/index.d.ts`. Never guess props, hooks or exports.
3. If an msflib module that is **not** installed covers the feature (catalog in guide §7), stop and ask the developer whether to install it. Do not install anything without confirmation.
4. Confirm the backend field names for the feature (API docs or the developer). Never invent them. All data keys are `snake_case`.
5. Decide where each new file goes (guide §3, §4) and how it is named (guide §5) before creating it.
6. Create/update screens use one `manage` route with `?id=`; detail screens use `view?id=`. No `[id]` folders (guide §6).
7. Use theme tokens and typography classes only. No hex values, no Tailwind default palette colours (guide §12).
8. Look at an existing feature in the codebase that does something similar and match its patterns.

## Before reporting a task as done

Go through the **Definition of Done** (guide §18) and state any item you could not satisfy.

## When unsure

If the guide does not cover a decision, or the codebase and the guide disagree, ask the developer. Do not guess.
