# tirsansapkota.com

Personal website for Tirsan Sapkota — developer, reader.
Live at **[tirsansapkota.com](https://tirsansapkota.com)**.

---

## Features

- 12 switchable themes with a persistent preference
- Reading shelf with search, filter, sort, manga flip cards, and a localhost-only editor
- Resume page with embedded PDF viewer
- Contact modal powered by Formspree
- Dynamic SVG favicon that adapts to the active theme
- Custom 404 page
- Fully static — no frameworks, no build step

## Tech

Plain HTML, CSS, and vanilla JavaScript. Hosted on Oracle Cloud (Ubuntu VM) behind Nginx with TLS via Let's Encrypt.

## Local Development

```bash
./run-local.sh        # serves on http://localhost:3000
./run-local.sh 8080   # custom port
```

Requires Python 3. No installs needed.

## Deploy

```bash
./deploy.private.sh
```

Rsyncs files to the VM, verifies Nginx config, and reloads the server.
The deploy script is excluded from version control.

---

Resume data for the resume-updater project lives in [`personal-website.json`](./personal-website.json).
