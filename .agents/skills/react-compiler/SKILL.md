---
name: react-compiler
description: Write React code that is compatible with and optimized for the React Compiler — avoiding manual memoization and following strict rules the compiler depends on.
---

# React Compiler Guidelines

React Compiler (babel-plugin-react-compiler) automatically inserts memoization. Writing code that complies with its rules means zero manual optimization and guaranteed correctness.

## Core Rules

### No manual memoization
Never use `useMemo`, `useCallback`, or `React.memo`. The compiler handles all of this.

```tsx
// BAD
const sorted = useMemo(() => items.sort(), [items])
const handleClick = useCallback(() => doThing(id), [id])
const MyComponent = React.memo(({ value }) => <div>{value}</div>)

// GOOD
const sorted = items.toSorted()
const handleClick = () => doThing(id)
function MyComponent({ value }: Props) { return <div>{value}</div> }
```

### Strict Rules of Hooks
The compiler relies on hooks being called unconditionally and in the same order every render. No exceptions.

```tsx
// BAD — conditional hook
if (condition) {
  const [x] = useState(0) // never
}

// BAD — hook in loop
items.forEach(item => {
  useEffect(() => {}, [item]) // never
})
```

### No mutation of props or state
Always produce new values; never mutate.

```tsx
// BAD
props.list.push(item)
state.count++

// GOOD
setList(prev => [...prev, item])
setCount(c => c + 1)
```

### Pure renders
No side effects during render. Move all side effects to `useEffect`.

```tsx
// BAD — side effect in render body
function Component() {
  localStorage.setItem('key', value) // never during render
  return <div />
}

// GOOD
function Component() {
  useEffect(() => {
    localStorage.setItem('key', value)
  }, [value])
  return <div />
}
```

### Ref discipline
Refs are for DOM access and escape hatches — not derived values or memoization proxies.

```tsx
// BAD — using ref to cache computed value
const cachedRef = useRef(expensiveCompute(input))

// GOOD — just let the compiler optimize it
const result = expensiveCompute(input)
```

## Opting Out

If a component or hook is intentionally incompatible (e.g., uses a third-party library that mutates), add the escape hatch at the top of the function body:

```tsx
function LegacyWrapper() {
  'use no memo'
  // compiler skips this function entirely
}
```

Use sparingly. Prefer fixing the root cause.

## Verifying the Compiler Works

- React DevTools → Components tab → look for **"Memo ✓"** badge on optimized components
- No `useMemo`/`useCallback` in new code — if you feel the urge, the compiler should handle it
- Compiler errors surface as build-time Babel errors with clear messages about which rule was violated

## When This Skill Applies

- Writing any new React component or hook
- Reviewing React code for compiler compatibility
- Refactoring existing components that use manual memoization
- Debugging compiler-emitted errors during build
