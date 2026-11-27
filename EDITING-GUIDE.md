# Editing Division

You can change most of the site's words and layout without editing JavaScript.

## Edit text or add sections

- **Homepage:** open `index.html`. Inside `<template id="home-template">`, edit headings, About text, and the HTML sections.
- **Player profile:** open `profile.html`. Edit headings, tab names, labels, and the profile layout inside `profile-template`.
- **Admin Studio:** open `admin.html`. Edit section titles, table headings, and the admin layout inside `admin-template`.
- **Game page:** open `game.html`. Edit the game information layout and headings inside `game-template`.
- **Settings:** open `settings.html`. Edit form labels and settings sections inside `settings-template`.
- **Login / signup:** open `login.html` or `signup.html`. Edit the form text and page layout inside `auth-template`.

Templates are inside HTML but are not shown until the page's JavaScript places them into the page.

## Change colors, spacing, and sizes

Open `styles.css`. CSS controls the background, colors, cards, gaps, widths, fonts, and mobile layout.

Example:
```css
/* Make category blocks have more space between them */
.home-discovery {
  gap: 24px;
}

/* Make category blocks fill the available width */
.category-game-section {
  width: 100%;
}
```

## What app.js still does

Keep `app.js` for things that need to happen: loading games from Supabase, login, likes, favourites, comments, search, game cards, and admin actions. It fills marked spots in the HTML templates with live data.

When you add a new static section, write its HTML in the page template first. Only add JavaScript if the section needs dynamic data or behavior.
