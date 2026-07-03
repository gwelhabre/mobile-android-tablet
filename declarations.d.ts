// @api.video/react-native-livestream ships a broken "types" path in its
// package.json (points at lib/typescript/src/index.d.ts, which doesn't exist —
// the real file is lib/typescript/index.d.ts), so TypeScript falls back to
// implicit-any (TS7016). Declare it ambiently so the app typechecks cleanly.
// The module works fine at runtime; GoLiveScreen uses it via an untyped ref.
declare module '@api.video/react-native-livestream';
