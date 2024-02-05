{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    devenv.url = "github:cachix/devenv/python-rewrite";
    devenv.inputs.nixpkgs.follows = "nixpkgs";
  };

  nixConfig = {
    extra-trusted-public-keys = "devenv.cachix.org-1:w1cLUi8dv3hnoSPGAuibQv+f9TZLr6cv/Hm9XgU50cw=";
    extra-substituters = "https://devenv.cachix.org";
  };

  outputs = { self, nixpkgs, flake-utils, devenv } @ inputs:
    flake-utils.lib.eachDefaultSystem (system:
      let pkgs = import nixpkgs { inherit system; };
      in {
        packages = {
          # workaround for https://github.com/cachix/devenv/issues/756
          devenv-up = self.devShells.${system}.default.config.procfileScript;
        };
        devShells.default = devenv.lib.mkShell {
          inherit inputs pkgs;
          modules = [
            ({ pkgs, ... }:
              {
                packages = [
                  pkgs.git
                ];

                languages.javascript = {
                  enable = true;
                  package = pkgs.nodejs_20;
                  corepack.enable = true;
                };

                services.postgres = {
                  enable = true;
                  package = pkgs.postgresql_16;
                  initialDatabases = [{ name = "snaplet"; }];
                  listen_addresses = "localhost";
                  port = 2345;
                  initialScript = ''
                    CREATE USER postgres SUPERUSER;
                  '';
                };
              }
            )
          ];
        };
      });
}
