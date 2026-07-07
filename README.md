# Trading Coach AI MVP

This is a local prototype for a real-time behavioral trading coach.

The goal is to prove the core product loop:

1. A trader defines a pre-market plan.
2. Live trading events arrive automatically from a data adapter.
3. A rules engine detects risky behavior.
4. The coach intervenes in real time.
5. The session dashboard shows risk state, active rules, and escalation level.

## What this prototype does

- Uses a simulator adapter instead of a real broker.
- Includes a safe ProjectX mock sync path for testing future API-shaped data.
- Includes a local API bridge for OpenAI Realtime voice and ProjectX read-only data.
- Supports Clerk-managed authentication for Google login and passkeys when Clerk keys are configured.
- Lets you define a pre-market plan.
- Calculates max daily loss from account capital and selected risk tier.
- Checks whether selected contract size and trade count fit inside the daily risk budget.
- Locks the weekly risk plan so risk can be lowered, but not increased, until weekly check-in.
- Runs a local performance-first weekly check-in review that recommends staying, tightening, moving down, or becoming eligible to move up.
- Simulates planned wins, planned losses, oversized trades, and revenge-trading behavior.
- Converts simulator button clicks into normalized trading events before rules run.
- Detects risk events using deterministic rules.
- Generates coach-style interventions immediately.
- Escalates from observation to warning, forced check-in, cooldown, and lockout recommendation.
- Requires a local mock coach conversation before simulator trading continues after serious intervention levels.
- Walks through a short deterministic check-in before clearing the gate.
- Generates a local end-of-day review with a next-session recommendation.
- Shows a local event log for adapter, rules, and intervention steps.
- Shows a command-strip dashboard with protection mode, risk usage, trade capacity, coach state, next action, and session timeline.
- Prioritizes the live cockpit first, with plan setup, demo tools, reviews, and logs separated into lower-priority areas.
- Shows a live dashboard inspired by the product vision.

## What this prototype does not do yet

- It does not connect to a broker.
- It does not place trades.
- It does not block real orders.
- It does not enforce real broker lockouts.
- It does not store broker credentials.
- It does not put broker credentials or OpenAI API keys in frontend code.
- It does not make broker network calls unless local ProjectX credentials are configured.
- It does not start an external AI voice session unless a local OpenAI API key is configured.
- It does not store user passwords or implement custom password authentication.

## Authentication

The MVP is prepared for Clerk-managed authentication.

Recommended Clerk setup:

1. Create a Clerk application.
2. Enable Google as a social login provider.
3. Enable passkeys in the Clerk dashboard.
4. Add `http://localhost:4173` as an allowed local development origin/redirect.
5. Copy the Clerk publishable key and JWT public key into local `.env`.

Local auth variables:

- `CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_JWT_KEY`
- `CLERK_AUTHORIZED_PARTY`

Paste `CLERK_JWT_KEY` into `.env` as one line with escaped `\n` line breaks if Clerk gives you a multiline PEM public key.

When Clerk is configured, the frontend shows a sign-in screen before the trading workspace. Protected backend routes require a valid Clerk session token before they create OpenAI Realtime sessions or touch ProjectX read-only data.

When Clerk is not configured, the app shows a local prototype-mode gate. This keeps simulator development available, but it is not production authentication.

## Local API bridge

The MVP now includes a no-dependency local backend in `server.js`.

When the frontend is published as a static public demo, it runs in simulator-only demo mode. Static hosting can show the UI, risk logic, coach messages, and simulator interactions, but it cannot run `server.js`, authenticate backend sessions, call OpenAI, or connect to ProjectX.

The local backend:

- Serves the frontend from `http://localhost:4173`.
- Can run as a deployable Node backend when a host provides `PORT`.
- Supports a CORS allowlist through `ALLOWED_ORIGINS`.
- Exposes `/api/health` for deployment health checks.
- Reads local environment variables from `.env`.
- Creates short-lived OpenAI Realtime client secrets for browser voice sessions.
- Connects to ProjectX / TopstepX read-only endpoints when credentials are configured.
- Keeps API keys and broker credentials out of `app.js`, `index.html`, and GitHub.

To configure it:

1. Copy `.env.example` to `.env`.
2. Add real keys only inside `.env`.
3. Keep `.env` private and uncommitted.

Important local variables:

- `PORT`
- `HOST`
- `NODE_ENV`
- `ALLOWED_ORIGINS`
- `CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_JWT_KEY`
- `CLERK_AUTHORIZED_PARTY`
- `OPENAI_API_KEY`
- `OPENAI_REALTIME_MODEL`
- `OPENAI_REALTIME_VOICE`
- `PROJECTX_BASE_URL`
- `PROJECTX_USERNAME`
- `PROJECTX_API_KEY`
- `PROJECTX_ACCOUNT_ID`

The ProjectX integration is intentionally read-only. It can authenticate, fetch accounts, fetch positions, fetch orders, and fetch trades. It does not place, modify, cancel, close, flatten, or block trades.

## Deployed backend mode

The same `server.js` can be deployed to a Node host such as Render, Railway, Fly.io, or a VPS.

Start command:

```text
npm start
```

The start command runs `node server.js`. The project still has no runtime package dependencies.

Required production rules:

1. Put real keys only in the host's environment variable settings.
2. Set `ALLOWED_ORIGINS` to the exact frontend origins allowed to call the backend.
3. Set `REQUIRE_AUTH=true` or `NODE_ENV=production` before deploying real OpenAI or ProjectX keys.
4. Configure Clerk before enabling protected API features in production.
5. Use HTTPS for the deployed backend.
6. Keep ProjectX read-only until the product is ready for stricter controls.
7. Do not expose `.env`, broker credentials, or OpenAI keys to the browser.

Frontend backend selection:

- Same-origin/local mode uses `/api/...` automatically.
- A static public frontend can point to a deployed backend with `?apiBase=https://your-backend.example.com`.
- Passing `?apiBase=local` clears the saved backend URL and returns to same-origin mode.

Backend health check:

```text
GET /api/health
```

Expected response includes service name, environment, timestamp, and whether auth/OpenAI/ProjectX are configured.

## Adapter flow

The MVP now separates event input from risk logic:

1. Simulator buttons create simulator-only actions.
2. `SimulatorAdapter` converts those actions into a normalized trading event.
3. The rules engine evaluates the normalized event against the pre-market plan.
4. The intervention engine converts rule violations into coach messages and escalation levels.
5. The dashboard renders the updated session state.
6. The event log records the local flow so you can debug what happened.

This keeps the rules engine independent from the simulator. A future broker adapter should emit the same normalized event shape, so the rules and intervention logic do not need to know where the event came from.

## Capital-based risk plan

The pre-market plan uses account capital and a selected daily risk tier to calculate the max daily loss.

Current local tiers:

1. Low Risk: 1% of account capital per day.
2. Moderate Risk: 2.5% of account capital per day.
3. Aggressive Risk: 5% of account capital per day.
4. High Aggressive Risk: 10% of account capital per day.

The trader also enters estimated risk per contract, max contracts, and max trades. The app checks whether one planned trade and the full planned day fit inside the calculated daily risk budget.

This is still prototype math. It does not connect to a broker, read account balances, calculate real futures margin, or place trades.

## Discipline lock

Discipline Lock lets the trader commit to the current weekly risk plan.

While locked, the trader can save stricter risk settings, but cannot increase:

1. Risk tier.
2. Daily loss budget.
3. Estimated risk per contract.
4. Max contracts.
5. Max trades.

The local Sunday Check-In Unlock button simulates a future weekly review flow. In this prototype, the unlock is only available on Sunday. Reset Session also clears Discipline Lock for testing while the MVP is being built. In a production version, reset would not casually unlock risk controls; the weekly check-in would decide whether the trader can unlock, stay at the same risk tier, move down, or become eligible to move up.

## Weekly check-in review

The Weekly Check-In Review is a local prototype scoring view. It reviews the current simulator session with trading performance as the primary driver.

Profitable review periods should generally allow the trader to continue at the same tier or become eligible to move up. If the trader is profitable but broke rules, the review should usually recommend continuing with guardrails instead of forcing a move down.

If the trader is still profitable but has started giving back a meaningful amount of peak session profit, the review should shift into protect-gains mode. The goal is to keep the trader positive, not punish them for being green.

Losing review periods should decide between staying the same or moving down based on how much of the risk budget was used and whether serious rule violations happened.

The review considers:

1. Current risk tier.
2. Net performance.
3. Profit giveback.
4. Daily loss used.
5. Rule violations.
6. Severe violations.
7. Off-plan trades.
8. Highest intervention level.
9. Coach check-ins recorded.

The review can recommend:

1. Stay At Current Tier.
2. Continue With Guardrails.
3. Protect Gains.
4. Stay And Tighten.
5. Move Down.
6. Eligible To Move Up.

Running the review does not automatically change risk settings. The trader still has to approve and save plan changes manually. Outside Sunday, the review works as a prototype preview, but Discipline Lock still cannot be unlocked until Sunday unless Reset Session is used for testing.

## Event log

The Event Log is a local debugging view. It records safe, high-level steps such as simulator button actions, adapter normalization, rules results, and intervention escalation.

It does not store broker credentials, secrets, API keys, or real order data.

## End-of-day review

The End-of-Day Review summarizes the current simulator session and recommends how the next session should start.

Possible recommendations include:

1. Normal Tomorrow.
2. Guarded Tomorrow.
3. Protect Gains Tomorrow.
4. Reduce Pressure Tomorrow.
5. Stop And Review.

The review considers net performance, trade count, daily loss used, profit giveback, rule violations, off-plan trades, highest intervention level, and coach check-ins.

This review is local and temporary. It does not persist a real trading journal yet, does not call an AI API, and does not take broker action.

## Coach check-in gate

The Coach Check-In Gate pauses simulator trade buttons after serious intervention levels. In this prototype, the trader answers a short local mock conversation before the simulator allows another trade.

The local check-in asks:

1. What happened.
2. Whether the trade was inside the plan.
3. What the next disciplined action is.

At Level 5, the gate keeps simulator trading paused and recommends resetting the session. This is still only a local prototype behavior. It does not connect to, control, or lock any real broker account.

This conversation is deterministic and local. A future version should replace the scripted prompts with a conversational AI coach that asks adaptive follow-up questions and clears the check-in through dialogue.

## Broker adapter placeholders

The project includes safe broker adapter placeholders only to show where future integrations would fit.

Current adapter priority:

1. `SimulatorAdapter`: active local testing adapter.
2. `ProjectXAdapter` / `TopstepXAdapter`: first real API target, mock data only until API access is available.
3. `TradovateAdapter`: paused and moved to the future adapter roadmap.

For safety, these placeholders:

- Are disabled.
- Store no credentials.
- Make no network calls.
- Have no broker connection.
- Cannot place, modify, or cancel real trades.

## ProjectX mock mode

Because real ProjectX / TopstepX API access is not available yet, the prototype includes a `Sync Mock ProjectX Data` button.

This button uses hard-coded sample account, order, position, and trade records shaped like ProjectX-style data. It then converts completed trade results into the same normalized trading events used by the simulator:

ProjectX-shaped mock data -> `ProjectXAdapter` -> normalized events -> monitoring engine -> behavior engine -> intervention engine -> AI coach

This lets the MVP mature before real API access is purchased.

For safety, mock mode:

- Does not ask for an API key.
- Does not ask for broker login credentials.
- Does not make network requests.
- Does not connect to TopstepX, ProjectX, Tradovate, or any broker.
- Does not place, modify, cancel, flatten, or block trades.

When real ProjectX access is added later, credentials and access tokens must not be stored in this frontend prototype. Real integration should use a secure backend, scoped permissions, encrypted secret storage, and read-only access first.

## Broker integration roadmap

The preferred path is companion-first:

1. Read-only companion mode.
   - Watch orders, fills, positions, P&L, trade count, size, and risk.
   - Coach, alert, log, and recommend interventions.

2. Safety-control companion mode.
   - If permissions allow, request order cancellation, position liquidation, or account risk controls through the broker API.
   - These actions must be treated as requests that can fail, not guaranteed shutdowns.

3. Trade-through mode.
   - If companion enforcement is not strong enough, route order entry through this app first.
   - The risk engine checks the order before any broker order is sent.

4. Partner/admin mode.
   - Stronger controls may require broker approval, partner access, or admin-level permissions.

Any real broker integration must use a secure backend, scoped permissions, encrypted secrets, audit logs, user consent screens, and paper-trading tests before live trading is considered.

ProjectX / TopstepX is the current first real data integration target because it may be a faster and lower-cost path to API access and real trading/account data. The behavior engine should stay adapter-based and should not include ProjectX-specific or Tradovate-specific assumptions.

Tradovate remains a future adapter option, but it is not the initial MVP integration priority.

## Why start with a simulator?

The simulator lets us validate the behavioral governance loop before adding broker integrations. Later, the simulator can be replaced with a ProjectX, TopstepX, Tradovate, NinjaTrader, Interactive Brokers, Rithmic, or local platform adapter that emits the same normalized trade events.

## How to run

For simulator-only testing, opening `index.html` in your browser still works.

For API testing, run the local server:

```powershell
cd C:\Users\allpr\Projects\ai-learning-lab\projects\trading-coach-ai-mvp
node server.js
```

If `node` is not recognized, install Node.js or run the server with an available Node.js runtime.

Then open:

```text
http://localhost:4173
```

No package installation is required.

## Intervention escalation model

The prototype uses five intervention stages:

1. Observation: the coach notices behavior that deserves attention.
2. Soft warning: the coach warns that behavior is drifting from the plan.
3. Forced check-in: the coach asks the trader to talk through the next action before continuing.
4. Cooldown: the coach recommends pausing new entries.
5. Lockout recommended: the coach recommends ending the session to protect capital.
