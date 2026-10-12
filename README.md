# Muse Souls

*A menagerie of strange little personalities for Meta Muse.*

Nine characters with their own `SOUL.md`, `IDENTITY.md`, `NAMES.md` and artwork. An unofficial just-for-fun project for people who want their assistant to feel a little less like the usual corporate happy-bot.

**Website (once Pages is enabled):** https://bkawa-io.github.io/muse-souls/  
**Learn more:** https://bkawa-io.github.io/muse-souls/about.html

## Repository layout

```text
muse-souls/
├── souls/                 # Canonical files for all nine characters
│   └── serein/
│       ├── SOUL.md
│       ├── IDENTITY.md
│       ├── NAMES.md
│       ├── card.png
│       └── avatar-reference.png
├── docs/                  # GitHub Pages website (deploy main /docs)
│   ├── index.html
│   ├── about.html
│   ├── styles.css
│   ├── script.js
│   ├── assets/            # Optimized display images only
│   └── data/
│       ├── souls.json
│       └── installation-template.md  # Generated; do not hand-edit
├── scripts/build_site.py  # Copies root instructions into docs/data/
├── INSTRUCTIONS.md        # Single source of truth for installing souls
├── PACK_FORMAT.md
├── README.md
└── LICENSE
```

## Try a character

Browse the [gallery](https://bkawa-io.github.io/muse-souls/), choose a character, click **TRY IT OUT**, then copy the resulting instructions into Muse. The site does **not** install anything or edit the assistant's configuration. The instructions ask Muse to propose the changes and wait for approval.

`INSTRUCTIONS.md` requires review for suspicious instructions, explanations of what would change, verified backups before an approved install, and separate consent for any new name and for both avatar generation and avatar replacement. Use only the configuration features actually available to your assistant. Users can keep their existing name and skip the avatar.

You can also inspect any individual soul directly from the [`souls/`](souls/) folder.

## Updating the instructions

Edit only the root `INSTRUCTIONS.md`, then run:

```bash
python3 scripts/build_site.py
```

This copies the shared template to `docs/data/installation-template.md` for fast, same-origin loading in the static site. **Do not edit the generated copy.** Character metadata lives once in `docs/data/souls.json`. Do not create per-character versions of the invitation.

For local preview, start a web server from `docs/`, for example:

```bash
cd docs
python3 -m http.server 8000
```

Then visit `http://localhost:8000` (opening `index.html` with `file://` won't load the data files in some browsers).

## GitHub Pages deployment

Upload this directory's **contents** to the repository root on branch `main`, keeping the existing MIT `LICENSE`. In **Settings → Pages → Build and deployment**, select **Deploy from a branch**, branch **main**, folder **/docs**, then save. GitHub Pages will serve `docs/index.html` at https://bkawa-io.github.io/muse-souls/ . GitHub links in the invitation point to the canonical root `souls/` files; they start working when those files have been pushed.

This project is not affiliated with or endorsed by Meta. No executable installer or backend is included.
