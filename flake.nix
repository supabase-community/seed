{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    systems.url = "github:nix-systems/default";
    devenv.url = "github:cachix/devenv";
    devenv.inputs.nixpkgs.follows = "nixpkgs";
  };

  nixConfig = {
    extra-trusted-public-keys = "devenv.cachix.org-1:w1cLUi8dv3hnoSPGAuibQv+f9TZLr6cv/Hm9XgU50cw=";
    extra-substituters = "https://devenv.cachix.org";
  };

  outputs = { self, nixpkgs, devenv, systems, ... } @ inputs:
    let
      forEachSystem = nixpkgs.lib.genAttrs (import systems);
    in
    {
      packages = forEachSystem (system: {
        devenv-up = self.devShells.${system}.default.config.procfileScript;
      });

      devShells = forEachSystem
        (system:
          let
            pkgs = nixpkgs.legacyPackages.${system};
          in
          {
            default = devenv.lib.mkShell {
              inherit inputs pkgs;
              modules = [
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
              ];
            };
          });
    };
}
