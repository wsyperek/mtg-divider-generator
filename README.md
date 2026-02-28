# MtgDividerGenerator

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.1.4.

## Free Hosting (Cloudflare Pages)

This app is ready to be hosted as a static Angular SPA on Cloudflare Pages.

1. Push this repository to GitHub.
2. In Cloudflare, go to `Workers & Pages` -> `Create` -> `Pages` -> `Connect to Git`.
3. Select this repository.
4. Use these build settings:
   - Framework preset: `Angular` (or `None`)
   - Build command: `npm run build`
   - Build output directory: `dist/mtg-divider-generator/browser`
5. Deploy.

Notes:
- A SPA fallback redirect is included in [public/_redirects](public/_redirects), so deep links route to `index.html`.
- Any `localStorage` data (saved sets/filters) stays per browser/device, as expected on static hosting.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
