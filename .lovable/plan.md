# Fix: channel options invisible in the Send to Pipeline dropdown

## What's happening

The channels are still loading correctly. The console log from your current session shows the query returning all 14 brands (Allif Institute, CyberSpace, Duzza Tv, FlashFit, ...) with no error.

The problem is visual: the `<select>` uses light text on a dark app background, but the native dropdown list that the browser/OS pops open renders on its own (usually white) background. The inherited light text then sits on white, so the list looks empty even though every option is there.

## Fix

Presentation-only change, in the dropdown markup and shared input styles:

- Give each `<option>` an explicit dark background and light text so the popup list is legible regardless of OS theme.
- Add `color-scheme: dark` to the select styling so the browser renders its native popup with dark chrome.
- Apply the same treatment to the other selects on the editor (Tone, Category) so they don't have the same latent issue.

No changes to the channels query, the Scheduler client, or any send-to-pipeline logic.

## Technical detail

- `src/components/bf-ui.tsx`: extend the shared input/select class with `[color-scheme:dark]` and an option-level rule (`[&>option]:bg-card [&>option]:text-foreground`).
- `src/routes/editor.$id.tsx`: no logic edits; the channel/tone/category selects pick up the styling automatically.
