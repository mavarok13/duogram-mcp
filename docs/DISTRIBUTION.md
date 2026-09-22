# Distribution

All workspace packages use version `0.1.0`. Release tags must match the root
package version. npm packages are public under the `@duogram` scope; publishing
requires write access to that scope. No source license has been granted yet
(`UNLICENSED`); bundled dependencies retain their own licenses.

## Local builds

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm dist:npm
pnpm smoke:install
pnpm dist:desktop
```

Tarballs are written to `release/`; desktop installers to `release/desktop/`.
Build desktop installers on their target OS: NSIS on Windows, DMG/ZIP on macOS,
and AppImage/DEB on Linux. The default architecture is the build host's.
The installation smoke test installs both tarballs into a temporary directory
outside the workspace, initializes a project, and verifies an MCP handshake
and tool discovery. It does not substitute for a desktop UI installation test.

## Publishing

Configure the GitHub repository secret `NPM_TOKEN` with npm publish access to
both `@duogram/core` and `@duogram/mcp`. Commit the verified release preparation,
push it, then push the matching `v0.1.0` tag. The Release workflow checks all
three platforms, packages desktop applications, tests npm installations, then
publishes core before MCP and creates a GitHub release with SHA-256 checksums.
Run the workflow manually for artifact-only validation without publication.
To publish an existing tag using the latest workflow fixes, supply its name in
the manual `release_tag` input; source and release notes are checked out from
that tag rather than the workflow branch.
If publication partially succeeds, inspect npm and GitHub before retrying:
npm versions cannot be overwritten.

## Signing and notarization

The current workflow produces unsigned development artifacts. Windows signing
and macOS signing/notarization are not configured, and OS trust prompts are
expected. Production signing is a separate release setup:

- Windows: supply an Authenticode certificate through the CI secret store and
  enable electron-builder executable signing (remove `signAndEditExecutable:
false`). Use timestamped signatures and verify the installed executable.
- macOS: replace `mac.identity: null` with a Developer ID identity, configure
  hardened runtime and appropriate entitlements, supply Apple notarization
  credentials through CI secrets, then notarize and staple the distributed app.
- Keep certificates, passwords, Apple credentials, and npm tokens out of Git.

Before declaring a production release, install and launch each artifact on a
clean target machine and verify project opening, editing, restart persistence,
and changes arriving from an MCP client.
