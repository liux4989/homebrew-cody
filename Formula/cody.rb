class Cody < Formula
  desc "Bootstrap the API-authorized Cody runtime and native host integrations"
  homepage "https://github.com/liux4989/homebrew-cody"
  # This version identifies only the bootstrap, never an authorized Cody runtime.
  url "https://github.com/liux4989/homebrew-cody/releases/download/bootstrap-v1.0.0/cody-bootstrap-1.0.0.tar.gz"
  version "1.0.0"
  sha256 "a874a4693747b8ec970d367a6f6e555ddf9d1d6310d14842b9bc9d5b7980f4ea"

  depends_on :macos
  depends_on "node@22"
  depends_on "gh"

  def install
    libexec.install "bootstrap-cody.mjs"
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
