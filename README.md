## Prompt: Build a Progress Nav Scrollspy Table of Contents Component

### Overview
Create a sticky, vertical table of contents (TOC) component with an animated SVG progress indicator along the left side. As the user scrolls through document sections, the indicator line travels down the left edge of the TOC, highlighting which sections are currently in view. This pattern is commonly called "Progress Nav" and was originally created by Hakim El Hattab.

### Reference Examples
- **Original Demo:** https://lab.hakim.se/progress-nav/
- **Source Code:** https://github.com/hakimel/css/blob/master/progress-nav/index.html
- **Live Implementation:** https://developers.arcgis.com/javascript/latest/programming-patterns/ (see the "On this page" sidebar on the right)
- **Tutorial:** https://kld.dev/toc-animation/
- **Example:** https://codepen.io/agrimsrud/details/XWNLMeW using intersectionObserver

### Visual Requirements
1. **Layout:**
   - Sticky/fixed positioned sidebar containing the TOC
   - Vertical list of section links (supports nested/indented items for subsections)
   - Thin vertical line running along the left side of all TOC items (background track)
   - Thicker colored line segment that moves/grows to indicate currently visible section(s)

2. **Indicator Behavior:**
   - The progress indicator should be an SVG path that traces alongside the TOC links
   - The path should should remain straight along side rather than indenting/outdenting to follow nested hierarchy levels
   - As the user scrolls, the highlighted portion of the path should:
     - Start at the first visible section's link
     - Extend down to cover all currently visible sections
     - Animate smoothly between states
   - Multiple sections can be highlighted simultaneously if they're all in view

3. **Styling:**
   - Background track: thin (1-2px), light gray line
   - Active indicator: thicker (2-3px), colored line (e.g., primary brand color)
   - Active TOC links should also change text color/weight
   - Smooth transitions for all state changes
   - Hover effect shows a darker bolor of the background track color and text darken (unless it is the active one)
   - Themed for light/dark application

### Technical Requirements
1. **Framework:** [React/Vue/Vanilla JS - specify your preference]

2. **Core Technologies:**
   - SVG for the progress path (not CSS borders)
   - IntersectionObserver API for detecting visible sections
   - CSS transitions for smooth animations

3. **SVG Path Implementation:**
   - Dynamically generate the path's `d` attribute based on TOC link positions
   - Use `offsetTop`, `offsetLeft`, and `offsetHeight` of each link element
   - Path should draw vertical lines with horizontal jogs for indentation changes
   - Use `stroke-dasharray` and `stroke-dashoffset` to control which portion of the path is visible/highlighted

4. **IntersectionObserver Setup:**
   - Observe all content sections that correspond to TOC links
   - Track which sections have `intersectionRatio > 0`
   - Update the path highlight when visibility changes
   - Handle multiple simultaneous visible sections

5. **Component Props/Configuration:**
   ```
   - contentSelector: CSS selector for content sections to observe
   - headingSelector: CSS selector for headings within sections (h2, h3, h4, etc.)
   - tocContainer: Reference to the TOC container element
   - activeColor: Color for the highlighted path segment
   - trackColor: Color for the background track
   - strokeWidth: Width of the indicator line
   - offset: Pixel offset for when a section is considered "active"
   ```

6. **Accessibility:**
   - TOC links should be keyboard navigable
   - Use appropriate ARIA attributes
   - Clicking a TOC link should smooth scroll to that section

### Key Functions to Implement

1. **drawPath()** - Generates the SVG path data:
   - Iterate through TOC links
   - Build path commands (M, L) based on link positions
   - Handle indentation changes with horizontal path segments

2. **updatePathHighlight()** - Updates visible portion:
   - Find first and last active links
   - Calculate `pathStart` and `pathEnd` positions
   - Update `stroke-dasharray` to show only the active segment

3. **observeSections()** - Sets up IntersectionObserver:
   - Create observer with appropriate threshold/rootMargin
   - Track active sections in state
   - Trigger path updates on intersection changes

### Sample HTML Structure
```html
<aside class="toc-sidebar">
  <nav class="toc-nav">
    <h2>On this page</h2>
    <ul class="toc-list">
      <li><a href="#section-1" class="toc-link">Section 1</a></li>
      <li><a href="#section-2" class="toc-link">Section 2</a>
        <ul>
          <li><a href="#section-2-1" class="toc-link toc-link--nested">Subsection 2.1</a></li>
          <li><a href="#section-2-2" class="toc-link toc-link--nested">Subsection 2.2</a></li>
        </ul>
      </li>
      <li><a href="#section-3" class="toc-link">Section 3</a></li>
    </ul>
    <svg class="toc-progress" aria-hidden="true">
      <path class="toc-progress-track" />
      <path class="toc-progress-indicator" />
    </svg>
  </nav>
</aside>
```

### Additional Features
- Show reading progress percentage
- Gradient color on the active indicator (colors) property
- Mobile-responsive drawer/overlay version
- Auto-generate TOC from page headings in a markdown file
- URL hash updates as user scrolls setting (true/false)

### Testing Scenarios

There are a few markdown files in the same folder as the project under ./test_docs that can be used for testing the component.

1. Page with 5+ sections of varying lengths
2. Deeply nested sections (3+ levels)
3. Very short sections that may all be visible at once
4. Rapid scrolling behavior
5. Window resize handling
6. Browser back/forward navigation with hash URLs

---
