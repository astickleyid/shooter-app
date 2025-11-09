/**
 * Sample test file for shooter-app
 * 
 * This file demonstrates basic Jest testing functionality
 * with simple math and string transformation tests.
 */

describe('Math operations', () => {
  test('adds 1 + 2 to equal 3', () => {
    expect(1 + 2).toBe(3);
  });

  test('multiplies 4 * 5 to equal 20', () => {
    expect(4 * 5).toBe(20);
  });

  test('subtracts 10 - 3 to equal 7', () => {
    expect(10 - 3).toBe(7);
  });

  test('divides 20 / 4 to equal 5', () => {
    expect(20 / 4).toBe(5);
  });
});

describe('String operations', () => {
  test('concatenates strings correctly', () => {
    const str1 = 'Hello';
    const str2 = 'World';
    expect(str1 + ' ' + str2).toBe('Hello World');
  });

  test('converts string to uppercase', () => {
    const str = 'hello';
    expect(str.toUpperCase()).toBe('HELLO');
  });

  test('converts string to lowercase', () => {
    const str = 'WORLD';
    expect(str.toLowerCase()).toBe('world');
  });

  test('trims whitespace from string', () => {
    const str = '  test  ';
    expect(str.trim()).toBe('test');
  });

  test('checks if string includes substring', () => {
    const str = 'Hello World';
    expect(str.includes('World')).toBe(true);
    expect(str.includes('Goodbye')).toBe(false);
  });
});

describe('Array operations', () => {
  test('creates an array with correct length', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(arr.length).toBe(5);
  });

  test('maps over array correctly', () => {
    const arr = [1, 2, 3];
    const doubled = arr.map(x => x * 2);
    expect(doubled).toEqual([2, 4, 6]);
  });

  test('filters array correctly', () => {
    const arr = [1, 2, 3, 4, 5];
    const evens = arr.filter(x => x % 2 === 0);
    expect(evens).toEqual([2, 4]);
  });

  test('reduces array to sum', () => {
    const arr = [1, 2, 3, 4, 5];
    const sum = arr.reduce((acc, val) => acc + val, 0);
    expect(sum).toBe(15);
  });
});

describe('Object operations', () => {
  test('creates object with correct properties', () => {
    const obj = { name: 'Test', value: 42 };
    expect(obj.name).toBe('Test');
    expect(obj.value).toBe(42);
  });

  test('checks if object has property', () => {
    const obj = { a: 1, b: 2 };
    expect(obj.hasOwnProperty('a')).toBe(true);
    expect(obj.hasOwnProperty('c')).toBe(false);
  });

  test('gets object keys', () => {
    const obj = { x: 10, y: 20, z: 30 };
    const keys = Object.keys(obj);
    expect(keys).toEqual(['x', 'y', 'z']);
  });
});
