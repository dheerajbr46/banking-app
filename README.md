# Interactive Banking App

Apple-inspired banking experience built with Angular 18, Tailwind CSS, Angular Material, and an in-memory mock API for rapid prototyping.

## Prerequisites

- Node.js 18+
- npm 10+

Install dependencies:

```bash
npm install
```

## Available scripts

| Command | Description |
| --- | --- |
| `npm start` | Run the dev server at `http://localhost:4200/` |
| `npm run lint` | Lint source files with Angular ESLint |
| `npm test -- --watch=false --browsers=ChromeHeadless` | Execute unit tests |
| `npm run build` | Produce a production build in `dist/banking-app/` |

## Project structure

```
src/
├── app/
│   ├── app.module.ts        # Root module & global providers
│   ├── app.component.*      # Shell layout, navigation, footer
│   ├── core/                # Singleton services, auth, models, mock API
│   ├── shared/              # Shared module for reusable components/pipes
│   └── features/            # Lazy-loaded feature areas (home, dashboard, etc.)
├── assets/                  # Static assets (logos, fonts, images)
├── styles.scss              # Global styles + Tailwind entry point
└── environments/           # Environment configs (future expansion)
```

Key services:

- `core/mocks/mock-api.service.ts` – Seeds the Angular in-memory web API.
- `core/services/bank-data.service.ts` – Centralized HTTP wrapper.
- `core/auth/auth.service.ts` – Mock login/logout with localStorage persistence.

## Mock backend capabilities

The in-memory API behaves like a lightweight backend so you can exercise every feature end-to-end:

- **Transfers** – `POST /api/transfers` debits the source account, credits the destination, persists an audit entry, and surfaces a reference ID back to the UI.
- **Manual transactions** – `POST /api/transactions` lets the Transactions screen log credits or debits that immediately update account balances and dashboard totals.
- **Account maintenance** – `PUT /api/accounts/:id` supports inline edits from the Accounts grid (nickname, icon, balance adjustments).
- **Profile updates** – `PUT /api/users/:id` syncs profile changes to both the mock API and the active auth session.

All mutations flow through `BankDataService`, which emits a `refresh$` stream. Dashboard, Accounts, Transactions, Transfer, and Profile screens subscribe to that stream so they re-query fresh data after every change without manual refreshes.

### Local feature walkthrough

1. Launch the dev server with `npm start` and sign in with the seeded credentials (`avery@interactive.bank` / `banking123`).
2. **Transfer funds** on the Transfer screen—watch confirmation messages include resolved account names and the Dashboard totals update immediately.
3. **Log a manual transaction** on the Transactions screen to see account balances and inflow/outflow chips change in real time.
4. **Edit an account** inline (for example, tweak the nickname or balance) and save to verify optimistic UI feedback and persistence.
5. **Update your profile** to confirm the header avatar/name react to saved changes thanks to session syncing in `AuthService`.

## GitHub Pages deployment (GitHub Actions)

This repo ships to GitHub Pages automatically via `.github/workflows/deploy.yml`.

### How it works

1. On every push to `main` (or manual dispatch), the workflow runs on `ubuntu-latest`.
2. Steps:
	- Checkout code
	- Setup Node.js 18 with npm caching
	- `npm ci`
	- `npm run lint`
	- `npm run test -- --watch=false --browsers=ChromeHeadless`
	- `npm run build -- --configuration production --base-href "/banking-app/"`
	- Deploy `dist/banking-app` to the `gh-pages` branch using `JamesIves/github-pages-deploy-action`.
	- (Optional but recommended) Set a repository secret named `API_BASE_URL` with your deployed backend origin (for example, `https://banking-backend.onrender.com/api`). The workflow replaces the placeholder URL in `environment.production.ts` before building. If the secret is missing, the build keeps the placeholder and the app will still call `https://your-production-backend.example.com/api`, resulting in the login error shown in the screenshot above.
3. GitHub Pages is configured to serve from the `gh-pages` branch root.

### First-time setup

1. Ensure the workflow file exists: `.github/workflows/deploy.yml`.
2. (Recommended) Add the `API_BASE_URL` repository secret pointing to your hosted backend’s `/api` root. This lets the action inject the correct URL without committing environment files to version control.
3. Push changes to `main` – the first run will build & deploy.
4. In GitHub → **Settings → Pages**, set **Source** to `Deploy from branch`, choose `gh-pages`, folder `/`.
4. Visit `https://dheerajbr46.github.io/banking-app/` once the Action completes.

### Manual deploy trigger

To rerun deployment without committing code, use the workflow dispatch button in the **Actions** tab.

### Local build for verification

```bash
ng build --configuration production --base-href "/banking-app/"
```

Serve the contents of `dist/banking-app` with any static server (e.g., `npx http-server dist/banking-app`).

## Backend deployment pipeline (GitHub Actions + GHCR)

The Spring Boot service inside `backend/` now has an automated workflow at `.github/workflows/backend-deploy.yml` that keeps your API in sync with `main`.

### What the workflow does

On every push to `main` that touches `backend/**` (or when manually dispatched), the action:

1. Checks out the repo and installs Temurin JDK 17.
2. Runs `mvn -B package` to execute tests and assemble the runnable JAR.
3. Uploads the packaged artifact for quick download from the workflow run.
4. Builds a production image using `backend/Dockerfile` and publishes it to the GitHub Container Registry (GHCR) as `ghcr.io/<owner>/banking-backend` with branch and commit SHA tags.

No extra secrets are required—`GITHUB_TOKEN` already carries the permissions needed to push to GHCR.

### First-time setup

1. Make sure GitHub Packages is enabled for your account/organization.
2. In **Repository Settings → Actions → General**, confirm **Workflow permissions** grants `Read and write` to `GITHUB_TOKEN` (needed for GHCR pushes).
3. Merge to `main` (or trigger the workflow manually) to build and publish the first image.

### Running the backend image

Pull and run the published container anywhere Docker is available:

```bash
docker run -d --name banking-backend -p 8080:8080 ghcr.io/dheerajbr46/banking-backend:main
```

Replace the tag (`main`) with a specific branch or commit SHA if you prefer immutable deployments. The container defaults to the `prod` Spring profile and exposes port `8080`.

### Hooking up a hosting provider

Most managed container platforms (Render, Railway, Fly.io, Azure Container Apps, etc.) can deploy directly from GHCR. Point the provider at the `ghcr.io/dheerajbr46/banking-backend:main` image (or a SHA tag) and expose port `8080`. Once a public URL is available, update `src/environments/environment.production.ts` so the Angular app calls the correct API base.

If your platform offers a deploy hook or API, you can extend `backend-deploy.yml` with an additional job that `curl`s that endpoint after the image push. A sample step is shown below—just drop it into a new job that depends on `build-and-push-image` and set the hook URL via a repository secret or variable:

```yaml
- name: Trigger platform deploy
	env:
		DEPLOY_HOOK: ${{ secrets.RENDER_DEPLOY_HOOK_URL }}
	if: ${{ env.DEPLOY_HOOK != '' }}
	run: |
		curl -f -X POST "$DEPLOY_HOOK"
```

This keeps the workflow flexible while letting you wire up automatic releases as soon as your hosting provider is ready.

## Development notes

- Tailwind utility classes live directly in templates for rapid UI iteration.
- Angular Material augments action buttons/icons while keeping Tailwind for layout/spacing.
- Mock authentication uses `localStorage` tokens; swap out `AuthService` and `MockApiService` for real APIs later.
- Feature modules are lazy-loaded and guarded via `AuthGuard` + router `canMatch`.

## Next steps & enhancements

- Replace in-memory API with a real backend or GraphQL layer.
- Add e2e tests (Cypress/Playwright) targeting critical flows.
- Expand README with real API docs once backend is integrated.
- Integrate analytics/error monitoring (Sentry, LogRocket).
- Harden accessibility and add full animation system (GSAP/AOS).
