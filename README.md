# Cody Homebrew tap

Install the Cody bootstrap on macOS:

```sh
brew install liux4989/cody/cody
cody upgrade
```

For Pi, use `cody upgrade --configure pi`, then reload Pi.

The tap and pinned bootstrap archive are public. Installing them does not require
GitHub credentials or access to the private Cody source repository. Homebrew
installs Node 22 and GitHub CLI dependencies without changing your default Node.

The runtime and its publication remain private. Before the first runtime
installation, `cody upgrade` checks GitHub access. If necessary, run:

```sh
gh auth login --hostname github.com
```

Your account must have read access to `liux4989/cody`. The bootstrap never signs
in automatically, and Homebrew installation does not configure a native host.

## Runtime authority

A bootstrap version identifies only installer code. It cannot select or authorize
a Cody runtime. The bootstrap reads the deployed API's release tag, verifies the
exact published production GitHub release and invokes its official reader. That reader
verifies release authority and provenance before activating the runtime. Published
tags and assets rely on repository administrators to preserve them; GitHub release
immutability is not required.

Use `cody upgrade` for runtime updates; `brew upgrade` updates only the bootstrap.
Uninstalling the formula leaves the separately managed runtime and saved sessions
intact.

## Bootstrap maintenance

Public bootstrap source is in `bootstrap/bootstrap-cody.mjs`. It is copied from
`scripts/bootstrap-cody.mjs` in the Cody product repository. Keep both copies
aligned when changing bootstrap behavior. Do not copy runtime code, credentials
or private release assets into this repository.

Publish bootstrap changes under a new immutable `bootstrap-vMAJOR.MINOR.PATCH`
tag and attach a tar archive containing only `bootstrap-cody.mjs`. Update the
formula's URL, version and SHA-256 to those exact published bytes. Never replace
an existing archive. Bootstrap publication is separate from Cody runtime releases
and does not request or authorize an API deployment.
