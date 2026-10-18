# GitHub release procedure

1. Run TypeScript, all automated tests and the production build using the README commands. Complete the separate browser, affected-device and hosted-account checks before claiming public readiness.
2. Resolve the artwork provenance and project-license decisions in ASSET-RIGHTS.md. No permissive license has been chosen for the owner.
3. Generate a source-only review ZIP: `node scripts/package-github.mjs --out <absolute-output.zip>`. This uses an explicit source allowlist, excludes Git history, secrets, runtime state, dependencies, databases, internal progress notes and owner-specific setup; it replaces the README, agent instructions and hosting configuration in the export only. The original checkout remains intact.
4. Extract into a NEW directory, inspect the file manifest and SHA-256 sidecar, run `npm ci`, then run all checks there. Review the generated README and included images before upload. No secret scan guarantees absence of every possible secret.
5. Create the owner's chosen GitHub repository and initialize new history from this reviewed directory. Do not push the original checkout's history. Enable repository secret scanning when available. Review the diff before the first commit. No repository has been created by this procedure.
6. Let GitHub Actions finish. CI validates source; it does not publish a site. This app is not a static GitHub Pages site. Use the authorized Sites workflow from the original checkout for hosting and verify visitor permissions, sign-in and separate accounts.
7. Add real repository and verified demo links to the project description. Record a short demo of saved help, spending reserves and assembly. Describe optional AI as disabled/unvalidated unless live verification has actually occurred. Never substitute a local preview URL for a public demo.

## Suggested portfolio summary
Benchmate is an interactive Three.js PC support workbench with searchable saved guides, a spending planner and an assembly checklist. I focused on accessible navigation, restrained rendering load, safe troubleshooting guidance and authenticated workspace persistence. The saved-guide version does not require paid AI. Hosted access and real-device checks remain release gates until verified.
