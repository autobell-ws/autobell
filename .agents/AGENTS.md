## Project Environment Configurations

When working on the AutoBell project, enforce the following environment rules automatically:

### Web Dashboard Deployment
- **Deployment Platform:** Vercel (connected via GitHub repository).
- **Production URL:** https://autobell-portal.vercel.app/
- **Notice:** The project is hosted on Vercel through GitHub. Deployments are automatically triggered via Git commits to project `autobell-portal`.

### Supabase Deployment
- **Target Project:** Always target the Supabase project with reference ID `oopyelhldjyyoupetynq`.
- **Root Path:** Always run Supabase commands (e.g., `npx supabase functions deploy`, `npx supabase db push`) from the project root directory (`c:\My Drive\My Drive\AutoBell vercel\`), NOT from the `web-dashboard` subdirectory.

### File Protection Guard (main_s3.cpp)
- **STRICT RULE:** DO NOT make any modifications, edits, or deletions to `esp32-firmware/src/main_s3.cpp` (or any variant of `main_s3.cpp`) under any circumstances UNLESS the user explicitly and unambiguously requests changes to `main_s3.cpp` in their prompt.
- **READ-ONLY DEFAULT:** `main_s3.cpp` must be treated as strictly READ-ONLY for all automated tasks, refactoring, bug fixes, or general prompt executions unless explicitly requested by the user.

### Automatic Post-Prompt Deployment Guard ("Deploy All")
- **TRIGGER:** After completing execution of any prompt, if changes were made to `web-dashboard/`, `supabase/` (DB/functions), or `mobile-app/`, the AI agent MUST automatically run deployment commands to push the changes immediately.
- **EXECUTION COMMAND:** Execute `node deploy-agent.mjs` from the root directory (`c:\My Drive\My Drive\AutoBell vercel\`). This automatically handles Supabase DB migrations, Edge Functions deployment, and Web Dashboard build (Vercel deployment triggers automatically via Git push).
- **FAILSAFE:** If any step fails or credentials require re-authentication, immediately report the status table to the user.
