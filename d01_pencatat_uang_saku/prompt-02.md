Act as a Senior Full-Stack Developer & Software Architect. Update and extend the previously generated Google Apps Script (GAS) "Student Pocket Money Tracker" with the following advanced functional, structural, and code-quality enhancements.

Maintain the strict design identity (Anti-Slop, Warm Palette: #F5F3EF background, #3D3A35 main text, #C98A2C mustard accent, Fraunces + IBM Plex Sans typography, Lucide line icons).

======================================================================
1. MODULAR FILE STRUCTURE (Separated CSS & JS)
======================================================================
Refactor the project into clean, separated Google Apps Script HTML files:
- `Code.gs`: Backend API handlers, authentication, and spreadsheet operations.
- `Index.html`: Clean HTML structure only.
- `Style.html`: Isolated CSS styling wrapped in `<style>` tags (using Tailwind directives/custom CSS).
- `Script.html`: Client-side application logic wrapped in `<script>` tags.

Implement a boilerplate include helper in `Code.gs`:
```javascript
function include(filename) {
  return HtmlService.createTemplateFromFile(filename).getRawContent();
}
