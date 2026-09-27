# Student Performance Dashboard

A polished, responsive single-page application for exploring student achievement and attendance. The app reads its records from a local JSON file and calculates dashboard summaries, charts, and analytics in the browser.

## Features

- Four in-page sections: Dashboard, Students, Analytics, and About
- Summary cards, SVG score distribution, grade distribution, and leading-student cards
- Name search and department, grade, and status filters with an explicit Apply action
- Reset filters and sort by name, marks, or attendance; click an active sort again to reverse its order
- A View details action for every student, with an accessible modal profile
- Calculated averages, score range, pass percentage, department averages, grade mix, and attendance insights
- Empty-results and data-loading error states
- 24 sample records loaded with `fetch()` from `data/data.json`

## Technologies

HTML5, CSS3, and vanilla JavaScript. Charts are lightweight SVG and visual bars; the app has no external fonts, frameworks, libraries, APIs, or build tools.

## Project structure

```text
Week5_Mini_Web_Application/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
├── data/
│   └── data.json
└── README.md
```

## Run locally

Since the app uses `fetch()` for `data/data.json`, serve the folder over HTTP. Opening `index.html` directly with `file://` will usually block that request.

Open a terminal in this folder and run:

```bash
python -m http.server 8000
```

Then visit [http://localhost:8000](http://localhost:8000). Alternatively, open `index.html` with VS Code Live Server.

## Accessibility

- Semantic navigation, landmarks, and section headings
- Real buttons with active navigation indicated by `aria-current` and sort state by `aria-pressed`
- Labeled form fields, visible keyboard focus, and keyboard-operable controls
- Live result and chart updates, a text-described SVG chart, and status conveyed in text as well as color
- Native modal dialog with focus management, Escape and close-button support
- Responsive table scrolling, skip link, and reduced-motion support

## Performance

- One local JSON request; filtering and calculations run in memory
- No framework, external font, or third-party dependency
- Document fragments for table and analytics lists
- Inline SVG chart and no large image assets or recurring animation

## Testing performed

Browser automation verified JSON loading; all four section buttons and active states; search and Apply; combined department, grade, and status filters; reset and empty results; all three sort controls; student details and both close paths; analytics calculations; chart output; mobile navigation layout; horizontal page overflow; and table scrolling on mobile. The browser reported no JavaScript errors or failed asset requests.

## Future improvements

- Add pagination for substantially larger cohorts
- Add a filtered CSV export
- Connect to an authenticated school data source when one is available
