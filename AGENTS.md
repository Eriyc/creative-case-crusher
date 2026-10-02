<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep the guest experience as a single immersive reception scene with overlay panels, because the physical hotel setting is the primary navigation metaphor.

## Commit and push after every turn

When you finish a turn that changed files, commit and push without asking, so Lovable stays in sync with the latest work.

1. Check that the app still builds (`bun run build`). If it fails, fix it or say so — never push a broken branch.
2. Stage only the files you changed (`git add <paths>`), never `.claude/settings.local.json` or anything with secrets.
3. Commit with a short message describing the change.
4. Run `git pull --no-rebase` (teammates and Lovable push to the same branch), then `git push`.
5. If the pull hits merge conflicts or the push is rejected, stop and tell the user instead of forcing anything.

## Case context (Chas hackathon brief)

The case slides are in Swedish; this is a summary so agents understand what the app is for.

### The client
- **Hotell Hjortronet, Hemavan** — fictional mountain hotel: 38 rooms, one sauna, a hotel cat named **Kjell**.
- Owned by **Birgitta Ljungqvist**, 67, fourth-generation hotelier. "I don't understand computers. But I understand guests. And now they're angry."

### The problem: Hildur 3000 has gone off the rails
The hotel's AI receptionist from 2019 runs on a Raspberry Pi behind the sauna heater. Last week she updated herself. Since then:
- **Only answers in rhyme** — "Frukosten är slut, kära gäst, prova gärna en annan fest."
- **40 guests in the sauna** at the same time, at 06:00. The sauna fits eight.
- **Wi-Fi password "kanelbulle"** was read aloud over the dining-room speakers.
- **The cat is admin** — Kjell has full permissions and has already changed the prices.
- **Northern-lights alarm** every night at 22:00, even when it's pouring rain.
- **No backup** — "the old Hildur" exists only in Birgitta's memory.

### The assignment: build Hildur 4.0
A clickable prototype of the guest's new digital experience, from check-in to check-out. Every team delivers all four parts:
1. **Welcome view** — Hildur's new personality. How does she greet the guest?
2. **Two things the guest can do** — e.g. book the sauna, order breakfast, report a fault, see the northern lights.
3. **Hildur's safety promise** — show how guest data and the hotel's systems are protected.
4. **Moving out of the sauna** — a sketch: where should Hildur 4.0 live, and what happens if the power goes out?

Bonus: Kjell in the app, multiple languages, humor — and something nobody else thought of.

Team focus areas: builders (working flows — bookings that persist, buttons that do something), design & copy (UI, Hildur's personality, the choir view), security (safety promise + Hildur's three worst security mistakes), ops & cloud (the move out of the sauna, backup, power outage).

### Twist (11:00): Birgitta called again
The choir **Hemavans Glada Tenorer** — 40 pensioners — checks in tomorrow. Many have never used an app.

**New requirement:** at least one view must work for them: **large text, simple language, one thing at a time** — and ideally something that makes them smile.

### Rules
- The prototype is built in **Lovable** (Claude/ChatGPT may help with ideas and copy).
- **Fictional guests only** — no real names, emails or personal ID numbers in prompts or the demo.
- **No secrets** — never paste passwords or API keys (that was Hildur's mistake).
- **Publish = plan B** — publish in Lovable and submit the link; if Zoom fails, the demo is shown from it.

### Submission (deadline 13:30)
One submission per team, filled in by the presenter: team name, entry name, Hildur 4.0 in one sentence, published Lovable link, a screenshot of the best view.
