# Living Studio — Generative AI Workflow for Media

A local, editable student course website. Uses only HTML, CSS, JavaScript, and local SVG placeholders. No build step, package install, account, database, or internet connection is required.

## Start the website on Windows

Open PowerShell and run these two commands:

```powershell
cd "C:\Users\zhang\Documents\ChatGPT\AI Workflow in Media"
python -m http.server 8000 --bind 127.0.0.1
```

Then open **http://127.0.0.1:8000/** in your browser. Keep that PowerShell window open while using the website. Press **Ctrl+C** in the window to stop the server. Python is already installed on this computer. On another computer, install Python 3 first, or simply double-click `index.html` to view the static site without a server.

If port 8000 is already in use, try opening the URL first: the previous server may still be running. Alternatively, use `8001` in both the command and the browser URL.

## What to edit

Open files in a text editor such as VS Code or Notepad. Save, then refresh the browser. If a style change does not appear, press Ctrl+F5.

| Change | File |
| --- | --- |
| Student name, introduction, focus, featured cards | `index.html` |
| Weekly references and their source credits | `visual-journey.html` |
| Project proposal and timeline | `idea-presentation.html` |
| Dates, experiments, iteration evidence, decisions | `working-log.html` |
| Finished project when it is ready | `final-project.html` |
| Feedback and your response | `feedback.html` |
| Biography, contact, interests, AI statement | `about.html` |
| Colours, spacing, fonts, desktop/mobile layout | `css/style.css` |
| Shared navigation and footer | Top of `js/main.js` |
| Bubble prototype behaviour | Remaining part of `js/main.js` |
| Your images, videos, and screenshots | `assets/` |

Replace text inside `[square brackets]` with your own words, including the brackets. These placeholders are edited in the files, not directly in the browser. Duplicate an `<article>...</article>` block to add a research, feedback, or log entry. Keep each page's single `<h1>` heading.

The `pages` list in `js/main.js` controls the shared navigation. The active page is detected automatically. If you add a page, copy an existing page, update its title and content, and add it to that list. Each page also has a simple `<noscript>` navigation fallback; update that if you change the page list.

## Add an image or video

Save a file such as `week-1-reference.jpg` in `assets/`, then replace the relevant placeholder image:

```html
<img class="placeholder-image"
     src="assets/week-1-reference.jpg"
     alt="Describe what the image shows and why it matters here.">
```

Add the creator, work title, original source URL, and licence/permission to the entry's source field. For a real source link, use `<a href="https://example.com">Creator — work title</a>` and replace the example URL. Use descriptive alt text rather than leaving the placeholder description. For before/after evidence, put two images and captions inside an iteration's `evidence` block.

For local video:

```html
<video controls style="width:100%" aria-label="Describe the project documentation">
  <source src="assets/project-video.mp4" type="video/mp4">
  <track kind="captions" src="assets/captions.vtt" srclang="en" label="English" default>
</video>
```

Create the caption file or remove the track line until you have one, then supply captions and a text description before publishing.

## Information Bubble and your p5.js sketch

The included demo is a **plain JavaScript Canvas prototype**, not a p5.js implementation or your final project. Click bubbles or use the four keyboard-accessible colour buttons. Every choice increases that colour's relative weight. Reset restores 25% per colour; rounded percentages may not total exactly 100%. Choices reset on page reload and are not saved.

Change `LEARNING_RATE` in `js/main.js` to adjust reinforcement speed. A smaller value makes dominance develop more slowly. Pause/Resume controls motion; reduced-motion preferences start the scene paused. Pausing does not disable colour selection.

To include your actual p5.js project, replace the prototype panel and its controls in `working-log.html` with your editor's embed HTML, or add an ordinary link to your sketch. Give any iframe a descriptive `title`, responsive width, and suitable height. An external editor embed needs an internet connection. Update the prototype label and source credit to match the actual work. The home experiment link already points to this section.

## Keep a development history

The six log versions are **planned placeholders**, not fabricated evidence. Add actual dates, screenshots, sketch versions, test results, and decisions as you work. Keep prior evidence rather than replacing it with the latest image. Suggested filenames: `bubble-v01-background.png`, `bubble-v02-shapes.png`.

Record site changes in `CHANGELOG.md`. If you use Git, review the changes and create small commits, for example:

```powershell
git status
git add index.html visual-journey.html idea-presentation.html working-log.html final-project.html feedback.html about.html css js assets README.md CHANGELOG.md
git commit -m "Add local course website"
```

Git may ask you to configure your name and email before your first commit. No commits are made automatically by the website.

## Accessibility and review

- Shared navigation includes an active-page indication and a mobile Menu button; Escape closes it.
- A keyboard skip link goes straight to the main content.
- Links/buttons have visible focus states; colour controls also have text labels.
- Canvas motion can be paused, and the reduced-motion preference is respected on load.
- Images have editable alt text; all example content is explicitly marked.
- Before sharing your site, replace placeholders, verify sources and links, and test your real media on mobile and with a keyboard.

This is a local website. Starting the loopback server does not publish it online.
