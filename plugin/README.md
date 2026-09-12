# RobloAI Studio Plugin

A single-file Roblox Studio plugin (`src/Main.server.lua`) that pairs with
the RobloAI web app and executes tool calls — script edits, instance
creation, marketplace imports, and more — against your real place.

## Install (local development)

1. Open Roblox Studio → **Plugins** tab → **Plugins Folder**.
2. Copy `src/Main.server.lua` into that folder (rename it to something like
   `RobloAI.server.lua` if you like — the filename doesn't matter).
3. Reopen Studio, or click **Manage Plugins** → refresh. A "RobloAI" button
   appears in the Plugins toolbar.
4. Open a place, enable **Allow third-party asset loading** in
   **Game Settings → Security** if you want marketplace import tools to
   work (`InsertService:LoadAsset` requires it).

For a real install (Roblox Studio plugin marketplace), publish
`src/Main.server.lua` as a plugin from Studio's **Plugins → Manage Plugins →
Build from Script**, or package it via Rojo if this repo grows a proper
build pipeline later.

## Configure the target server

Edit the `BASE_URL` constant near the top of `src/Main.server.lua`:

```lua
local BASE_URL = "http://localhost:3000"
```

Point it at your deployed app's URL for anything other than local dev.

## Pairing

1. In the web app, sign in and go to **Settings → Studio plugin**. A
   6-digit pairing code appears.
2. In Studio, click the **RobloAI** toolbar button to open the panel, paste
   the code into the text box, and click **Connect**.
3. The panel shows "Connected" once the plugin's first poll succeeds. The
   web app's settings page reflects this within a few seconds.
4. The pairing code is remembered (`plugin:SetSetting`) and reconnects
   automatically the next time Studio opens with this plugin installed.

## How it works

The plugin long-polls `POST {BASE_URL}/api/bridge/{code}/poll` every
~2.5 seconds, sending a heartbeat and receiving any queued tool calls. Each
call is dispatched to a handler function (one per tool name in the web
app's `lib/ai/tool-registry.ts`) that operates on real Studio services, and
the result is posted back to `POST {BASE_URL}/api/bridge/{code}/result`.

## Known platform limitations

Two tool categories can't be genuinely implemented as a Studio plugin,
because Roblox doesn't expose a public API for them — the handlers report
this explicitly (as a structured "unsupported"/note result) rather than
faking success:

- **Playtest control** (`playtest`, `start_playtest`) — there is no stable,
  public Luau API for a plugin to start or stop Play Solo programmatically.
  A user still starts playtesting manually from Studio's Play button.
- **Screenshot / viewport capture** (`screenshot`, `capture_viewport`) —
  plugins have no public API to export a viewport image to an external URL.

If Roblox ships APIs for either in the future, only the corresponding
handler in `src/Main.server.lua` needs to change — the web app's tool
contract and UI don't need to know the difference.

## Security note

`execute_luau` runs arbitrary Luau via `loadstring` inside the plugin's own
process — the same elevated context any Studio plugin already runs in, not
extra exposure the plugin introduces. Only pair this plugin with an
account you trust the connected web app's tool calls to come from.
