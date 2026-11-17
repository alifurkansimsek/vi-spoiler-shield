# VI Spoiler Shield: install

For a visual, step-by-step guide, open **Install.html** in the folder above. A setup wizard also opens when the extension is loaded.

This file contains no spoilers. Terms are ROT13-encoded in `src/dictionary.js`; official images are stored only as fingerprints.

## Quick install

1. Open your browser's extensions page: `chrome://extensions`, `brave://extensions`, `edge://extensions`, `opera://extensions` or `vivaldi://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked** and choose this `vi-spoiler-kalkani` folder. Do not move or delete it afterwards.
4. Follow the setup wizard: pin to the toolbar, allow in private windows, pick a protection level, link the folder for shared settings.

## When an item is hidden, and when a whole page

- **An item is hidden:** a feed card, news card, paragraph, comment or image. Videos are paused and muted.
- **A page is covered:** only when the page itself is about the game, for example when its address, tab title or main headline clearly names it, when most of its text is about it, or when the site is dedicated to it. On YouTube a video does not play when its title or captions are about the game.
- **Strict mode** hides items only and never covers a whole page. The exception is the YouTube video itself: if its title, captions or Shorts header (including the channel name) match a strict rule, the video does not play.

## Settings across browsers

Settings and your own terms live in the `ayarlar.json` file in this folder. Link each browser to the folder once (in the wizard, or Settings > Across browsers). A change in one browser reaches the others within a minute or two. The block history is not shared; each browser keeps its own. Brave can read the file but not write it, because it ships with the File System Access API turned off.

## Block history

The time, the site and how many items were hidden are stored. Hidden content is never stored. The page path is encrypted and opened only when you ask. The key sits next to the data in the browser: it stops accidental reading, not someone with access to your computer. Private windows are never recorded. You can turn the history off or clear it in the settings.

## What the extension cannot see

- **New-tab news feeds:** Edge's news feed and Brave News. The wizard shows how to turn them off.
- **Address bar suggestions:** turn them off in the browser settings.
- **Phone and desktop apps:** the YouTube, X and Discord apps and system notifications are outside the browser.
- **The browser's own pages:** `chrome://` pages and the extension store cannot be scanned.

## What is hard to catch

- **New images without text:** a player's screenshot, a meme or a video frame is not recognised unless it has a title or caption, or copies an official image.
- **Inside videos:** frames and audio are not scanned.
- **Spoilers that never name the game:** add new names in the settings, by right-click, or through the automatic term list.
