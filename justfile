build-application:
  bun run build:app
build-user-script:
  bun run build:userscript
  bun run build:userscript-configure-page
build:  build-application build-user-script