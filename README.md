# Snaplet Seed

## 1. Install and configure Nix

```sh
curl --proto '=https' --tlsv1.2 -sSf -L https://install.determinate.systems/nix | sh -s -- install \
  --extra-conf "substituters = https://cache.nixos.org https://devenv.cachix.org" \
  --extra-conf "trusted-public-keys = cache.nixos.org-1:6NCHdD59X431o0gWypbMrAURkbJ16ZPMQFGspcDShjY= devenv.cachix.org-1:w1cLUi8dv3hnoSPGAuibQv+f9TZLr6cv/Hm9XgU50cw="
```

We now need to install `direnv` (or its nix-optimized variant `nix-direnv`) in order to automatically load our system dependencies when navigating to our project's folder. 

## 2.1. Install direnv with Home Manager (optional but recommended)

Home Manager allows you to configure your user's shell environment with Nix.

```sh
nix run home-manager/master -- init
```

Edit `~/.config/home-manager/home.nix` with your preferences. Here is mine:

```nix
{ pkgs, ... }:

{
  home.username = "jgoux";
  home.homeDirectory = "/Users/jgoux";

  home.stateVersion = "23.05";

  home.packages = [
    pkgs.cachix
    pkgs.corepack_20
    pkgs.nodejs_20
    pkgs.nil
    pkgs.nixpkgs-fmt
  ];

  home.sessionVariables = {
    EDITOR = "code-insiders";
    DIRENV_LOG_FORMAT = "";
  };

  programs = {
    home-manager.enable = true;

    # direnv is installed here!
    direnv = {
      enable = true;
      enableZshIntegration = true;
      nix-direnv.enable = true;
    };

    zsh = {
      enable = true;
      autosuggestion.enable = true;
      syntaxHighlighting.enable = true;
      oh-my-zsh = {
        enable = true;
        plugins = [ "git" ];
        theme = "robbyrussell";
      };
      initExtra = ''
        export PATH="$PATH:/usr/local/bin:/opt/homebrew/bin"
      '';
    };
  };
}
```

Apply your `home.nix` configuration:

```sh
nix run home-manager/master -- init --switch
```

From now on when you will need to re-apply your configuration after editing `home.nix` you will just have to run:

```sh
home-manager switch
```

## 2.2. Install direnv with `nix profile`

If you don't want to manage your home dependencies with `home-manager` and you just want to install `direnv` you can do:

```sh
nix profile install nixpkgs#nix-direnv
```

Then add nix-direnv to `$HOME/.config/direnv/direnvrc`:

```sh
source $HOME/.nix-profile/share/nix-direnv/direnvrc
```

## 3. Open `snaplet/seed` repository in your editor

Now that you have `direnv` installed, it should automatically load the necessary system dependencies when you launch a new terminal in the `snaplet/seed` project.

You can then start your local PostgreSQL server (running on port 2345) by doing: `devenv up`.
