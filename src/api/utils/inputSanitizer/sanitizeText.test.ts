import { sanitizeText } from './inputSanitizer.js';

describe('sanitizeText', () => {
  test('It should trim text if trim is set to default', () => {
    expect(sanitizeText({ text: '  Hello World' })).toBe('Hello World');
    expect(sanitizeText({ text: 'Hello World  ' })).toBe('Hello World');
    expect(sanitizeText({ text: ' Hello World ' })).toBe('Hello World');
  });
  test('It should trim multiline text if trim is set to default', () => {
    expect(
      sanitizeText({
        text: `  Hello!
    You are 
    beautiful!`,
      }),
    ).toBe(`Hello!
    You are 
    beautiful!`);

    expect(
      sanitizeText({
        text: `Hello!
    You are 
    beautiful!  `,
      }),
    ).toBe(`Hello!
    You are 
    beautiful!`);

    expect(
      sanitizeText({
        text: ` Hello!
    You are 
    beautiful! `,
      }),
    ).toBe(`Hello!
    You are 
    beautiful!`);
  });
  test('It should escape text if escape is set to default', () => {
    expect(sanitizeText({ text: '<b>Hello World</b>' })).toBe('&lt;b&gt;Hello World&lt;&#x2F;b&gt;');
    expect(sanitizeText({ text: 'I hack you <script>console.log("hacked");</script>' })).toBe(
      'I hack you &lt;script&gt;console.log(&quot;hacked&quot;);&lt;&#x2F;script&gt;',
    );
  });
  test('It should escape multiline text if escape is set to default', () => {
    expect(
      sanitizeText({
        text: `<b>Hello!</b>
    You are 
    beautiful!`,
      }),
    ).toBe(`&lt;b&gt;Hello!&lt;&#x2F;b&gt;
    You are 
    beautiful!`);
    expect(
      sanitizeText({
        text: `Hello!
    You are 
    beautiful!<script>console.log("hacked");</script>`,
      }),
    ).toBe(`Hello!
    You are 
    beautiful!&lt;script&gt;console.log(&quot;hacked&quot;);&lt;&#x2F;script&gt;`);
  });

  test('It should not trim text if trim=false', () => {
    expect(sanitizeText({ text: '  Hello World', trim: false })).toBe('  Hello World');
    expect(sanitizeText({ text: 'Hello World  ', trim: false })).toBe('Hello World  ');
    expect(sanitizeText({ text: '  Hello World  ', trim: false })).toBe('  Hello World  ');
  });

  test('It should not escape text if escape=false', () => {
    expect(sanitizeText({ text: '<b>Hello World</b>', escape: false })).toBe('<b>Hello World</b>');
    expect(sanitizeText({ text: 'I hack you <script>console.log("hacked");</script>', escape: false })).toBe(
      'I hack you <script>console.log("hacked");</script>',
    );
  });
});
