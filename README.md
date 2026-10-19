# Cody Homebrew tap

Install the Cody bootstrap on macOS. This tap and the Cody source repository
are private; your GitHub account needs read access to both.

```sh
brew install --HEAD liux4989/cody/cody
cody upgrade
```

For Pi, use `cody upgrade --configure pi`, then reload Pi.

Homebrew installs Node 22 and GitHub CLI dependencies. It does not sign in for
you or change your default Node. If cloning this private tap fails, install
GitHub CLI with `brew install gh`, then run:

```sh
gh auth login --hostname github.com
gh auth setup-git --hostname github.com
```

Retry installation after confirming repository access.

`--HEAD` installs only the bootstrap from the Cody source repository. It never
selects a development runtime. The bootstrap installs only the immutable
publication selected by the deployed Cody API. Use `cody upgrade` for runtime
updates; `brew upgrade` updates only the bootstrap. Uninstalling the formula
leaves the separately managed runtime and saved sessions intact.

The formula is maintained here. Bootstrap source and installation behavior are
maintained in [liux4989/cody](https://github.com/liux4989/cody), under
`scripts/bootstrap-cody.mjs` and `docs/implementation/cli.md`.
