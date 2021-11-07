# [`postcss-set-specificity`](https://www.npmjs.com/package/postcss-set-specificity) - Set selector specificity to equal another's

## Example
```css
/* Input */
@set-specificity :root {
  #id::before {
    content: "earlier, more specific selector should not match";
  }

  .class::before {
    content: "later, less specific selector should match";
  }
}

@set-specificity {
  .a, .b, .c {
    --test: "";
  }
}

/* Output */
:is(._,:not(._)):where(#id)::before {
  content: "earlier, more specific selector should not match";
}

:is(._,:not(._)):where(.class)::before {
  content: "later, less specific selector should match";
}

:where(.a), :where(.b), :where(.c) {
  --test: "";
}
```

## Installing
```
npm i -D postcss-set-specificity
```

`postcss.config.js`
```js
module.exports = {
  plugins: [
    require("postcss-set-specificity") // After nesting plugin, if used
  ]
}
```

Consult [PostCSS documentation](https://github.com/postcss/postcss#usage) for alternative usage.

## Browser Support
Requires support for these [CSS Selectors Level 4](https://www.w3.org/TR/selectors-4/) features:
- [`:is()`](https://caniuse.com/css-matches-pseudo)
- [`:not()`](https://caniuse.com/css-not-sel-list)
- [`:where()`](https://caniuse.com/mdn-css_selectors_where)

This corresponds to a [browserslist](https://github.com/browserslist/browserslist) roughly like:
```
Chrome >= 88
Safari >= 14
Firefox >= 78
```

## How It Works
Given that:
- `:is()` and `:not()` have specificities equal to the maximum specificity within them
- `:is(x, :not(x))` matches like the universal selector (`*`), but with the specificity of `x`
- `:where()` always has a specificity of zero
- `:is(x, :not(x)):where(y)` matches like `y`, but with the specificity of `x`
- the specificity of a selector can be matched in an optimal way:
  - `element#id.class:pseudo-class[attribute]::pseudo-element element *` => `1,3,3`
  - `_+_+_#_._._._` => `1,3,3`
- pseudo elements can't be used in `:where()`, `:is()`, or `:not()`

If provided with:
```css
@set-specificity x {
  y::before {}
}
```

The plugin produces:
```css
:is(_,:not(_)):where(y)::before {}
```

In cases where there is no selector provided, we can simply use `:where()` alone.

## Caveats
- Does not yet interoperate with [CSS Nesting](https://www.w3.org/TR/css-nesting-1/), but wouldn't be hard to with `@nest`.
- Pseudo elements are treated as exceptions and add `0,0,1` to the specificity, as they cannot be set to zero, and simply
  subtracting will lead to inconsistency.

### Unimplemented Optimizations
- Calculate specificities
  - Partial shared specificity
    - `:is(a#b.c, :not(a#b.c)):where(d#e)` to
    - `d#e:is(.c, :not(.c))`
  - Full shared specificity
    - `:is(a#b.c, :not(a#b.c)):where(d#e.f)` to
    - `d#e.f`
- Parse selector lists for correctness
  - Valid selector list (invalid selector lists would not fail because `:where()` is supposed to be forgiving)
    - `:where(.a), :where(.b), :where(.c)` to
    - `:where(.a, .b, .c)`
- Assumptions/loose behavior
  - Assume selector never to match
    - `:is(#🔝, :not(#🔝)):where(.a)` to
    - `:not(#🔝):where(.a)`
