# Jianxiong Li — personal homepage

Static personal website for [Jianxiong Li](https://facebear-ljx.github.io/), Co-founder & CEO of BASAL Intelligence. Designed for GitHub Pages; no framework, package installation, or external JavaScript is needed.

## Maintaining the site

- Edit biography, experience, and page structure in `src/index.html`.
- Edit styling in `site.css` and filtering/search in `main.js`.
- The 25 original publications are preserved in `data/publications.json`.
- Add new work, verified publication metadata, and news in `data/updates.json`.
- The 11 original news items are preserved in `data/news-archive.json`.
- Run `npm run build` to regenerate the root `index.html`, then `npm test`.
- Preview locally with `python3 -m http.server 4173` and visit `http://localhost:4173`.

Commit the generated `index.html` alongside the source changes. GitHub Pages serves the root files directly. All papers and news remain available without JavaScript; JavaScript adds search and category filtering.

## September 2026 update

Career dates confirmed by the site owner: BASAL Intelligence founded in July 2026; Tsinghua PhD completed in July 2026; ByteDance Seed Robotics Top Seed from December 2025 to July 2026, working closely with Xiao Ma.

New publications were checked against [Google Scholar](https://scholar.google.com/citations?user=TRLwpiUAAAAJ&hl=zh-CN&sortby=pubdate) and their original sources:

- [World Value Models for Robotic Manipulation](https://arxiv.org/abs/2606.24742)
- [TTT-VLA](https://arxiv.org/abs/2606.03127)
- [Demystifying Action Space Design for Robotic Manipulation Policies](https://arxiv.org/abs/2602.23408)

The portrait is the updated photo supplied by the site owner, and all contact links use `lijianxiong@basalintelligence.com`. Original research interests, publication links, professional service, and archived news are retained. Publication years retain the original bibliography's convention; conference venue years can therefore differ from preprint years.

## Credits

The original template was adopted from https://github.com/ryanxhr/ryanxhr.github.io. The redesigned site retains the original local Mukta fonts and their license in `assets/font/OFL.txt`.
