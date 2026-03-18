# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


---

## Neuro: Cross-Device Map Sync

### Features
- **Automatic Cloud Sync**: All maps sync automatically to Supabase when you're logged in
- **Real-time Conflict Resolution**: Uses timestamp-based merging to resolve conflicts between devices
- **Offline Support**: Works locally when offline; syncs when back online
- **Manual Backup**: Export/Import maps as JSON for backup or manual transfers

### Setup Supabase for Cross-Device Sync

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Run the schema** in your Supabase SQL editor:
   - Copy and paste the contents of \supabase_schema.sql\ into the Supabase SQL editor
   - Execute the SQL to create the \user_maps\ table with RLS policies

3. **Set environment variables** in your \.env.local\:
   \\\NVITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   \\\`n
4. **Your maps will now sync automatically** across all devices when logged in!

### How It Works

- **On Login**: App fetches all your maps from Supabase and merges with local ones
- **On Create/Edit**: Changes sync to Supabase automatically (timestamp recorded)
- **On Delete**: Deletion syncs across all devices
- **Device Status**: Green 'synced' indicator shows when sync is active

### Offline Fallback

- **Export maps** as JSON backup via the Sidebar
- **Import maps** on any device to restore your data locally
- Perfect for offline work or manual device transfers
