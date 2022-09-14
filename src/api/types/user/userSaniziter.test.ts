import userSanitizer from './userSanitizer.js';

describe('sanitizeUserName', () => {
  test('It returns same input if input is okay.', () => {
    const input = 'M account';
    expect(userSanitizer.name(input)).toBe(input);
  });
  test('It trims left side space', () => {
    const input = ' My account';
    expect(userSanitizer.name(input)).toBe('My account');
  });
  test('It trims right side space', () => {
    const input = 'My account ';
    expect(userSanitizer.name(input)).toBe('My account');
  });
  test('It trims left and right side space', () => {
    const input = ' My account ';
    expect(userSanitizer.name(input)).toBe('My account');
  });
  test('It excapes html', () => {
    expect(userSanitizer.name('My <b>account</b>')).toBe('My &lt;b&gt;account&lt;&#x2F;b&gt;');
    expect(userSanitizer.name('My <script>alert("x");</script>')).toBe(
      'My &lt;script&gt;alert(&quot;x&quot;);&lt;&#x2F;script&gt;',
    );
  });
});

describe('sanitizeUserEmail', () => {
  test('It returns same input if input is okay.', () => {
    const input = 'my.email@mail.com';
    expect(userSanitizer.email(input)).toBe(input);
  });
  test('It trims left space.', () => {
    expect(userSanitizer.email('   my.email@mail.com')).toBe('my.email@mail.com');
  });
  test('It trims right space.', () => {
    expect(userSanitizer.email('my.email@mail.com     ')).toBe('my.email@mail.com');
  });
  test('It return email in lowercase.', () => {
    expect(userSanitizer.email('my.EmAiL@maiL.com')).toBe('my.email@mail.com');
  });
});

describe('sanitizeUserCurrency', () => {
  test('It returns same input if input is okay.', () => {
    expect(userSanitizer.currency('eur')).toBe('eur');
  });
  test('It trims left space.', () => {
    expect(userSanitizer.currency('  eur')).toBe('eur');
  });
  test('It trims right space.', () => {
    expect(userSanitizer.currency('eur     ')).toBe('eur');
  });
  test('It converts input into lowercase.', () => {
    expect(userSanitizer.currency('EUr')).toBe('eur');
  });
});

describe('sanitizeUserLanguage', () => {
  test('It returns same input if input is okay.', () => {
    expect(userSanitizer.language('sl-si')).toBe('sl-si');
  });
  test('It trims left space.', () => {
    expect(userSanitizer.language('  sl-si')).toBe('sl-si');
  });
  test('It trims right space.', () => {
    expect(userSanitizer.language('sl-si     ')).toBe('sl-si');
  });
});
