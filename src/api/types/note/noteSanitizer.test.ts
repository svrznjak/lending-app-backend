import { sanitizeNote } from './noteSanitizer.js';

describe('sanitizeNote', () => {
  describe('content', () => {
    test('It returns same input if input is okay.', () => {
      const input = `22.22.22
      This is new note
      that I added today.`;
      expect(sanitizeNote.content(input)).toBe(input);
    });
    test('It trims left side space', () => {
      const input = `  22.22.22
      This is new note
      that I added today.`;
      expect(sanitizeNote.content(input)).toBe(`22.22.22
      This is new note
      that I added today.`);
    });
    test('It trims right side space', () => {
      const input = `22.22.22
      This is new note
      that I added today.     `;
      expect(sanitizeNote.content(input)).toBe(`22.22.22
      This is new note
      that I added today.`);
    });
    test('It trims left and right side space', () => {
      const input = `   22.22.22
      This is new note
      that I added today.      `;
      expect(sanitizeNote.content(input)).toBe(`22.22.22
      This is new note
      that I added today.`);
    });
    test('It excapes html', () => {
      expect(
        sanitizeNote.content(`22.22.22
      <b>This is new note</b>
      <script>console.log("x");</script>
      that I added today.`),
      ).toBe(`22.22.22
      &lt;b&gt;This is new note&lt;&#x2F;b&gt;
      &lt;script&gt;console.log(&quot;x&quot;);&lt;&#x2F;script&gt;
      that I added today.`);
    });
  });
});
