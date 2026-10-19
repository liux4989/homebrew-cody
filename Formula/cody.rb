class Cody < Formula
  desc "Bootstrap the API-authorized Cody runtime and native host integrations"
  homepage "https://github.com/liux4989/cody"
  # HEAD distributes the installer only, never a runtime selected from main.
  # No release archive may be selected by Homebrew's version/cache mechanism.
  head "https://github.com/liux4989/cody.git", branch: "main"

  depends_on :macos
  depends_on "node@22"
  depends_on "gh"

  def install
    libexec.install "scripts/bootstrap-cody.mjs"
    (bin/"cody").write <<~SH
      #!/bin/sh
      # Keep Homebrew's keg-only Node private to Cody, not the user's default.
      export PATH="#{Formula["node@22"].opt_bin}:#{Formula["gh"].opt_bin}:$PATH"
      exec "#{Formula["node@22"].opt_bin}/node" "#{libexec}/bootstrap-cody.mjs" "$@"
    SH
  end

  def caveats
    <<~EOS
      Install the API-authorized runtime and configure your host:
        cody upgrade
      For Pi:
        cody upgrade --configure pi
      GitHub authentication and read access to liux4989/cody are required.
      If prompted, run: gh auth login --hostname github.com
      Homebrew installs prerequisites; it never signs in for you.
      brew upgrade updates the bootstrap, not the Cody runtime. Use cody upgrade.
      brew uninstall cody leaves your runtime and saved sessions intact.
    EOS
  end
end
