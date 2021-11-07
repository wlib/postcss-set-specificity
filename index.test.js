const { expect, it } = require("@jest/globals")
const postcss = require("postcss")
const postcssSetSpecificity = require("./index.js")

const run = async (input, output, options = {}) => {
  const result = await postcss([ postcssSetSpecificity(options) ])
    .process(input, { from: undefined })

  const outputAST = await postcss.parse(output)

  result.root.cleanRaws()
  outputAST.cleanRaws()

  expect(result.root.toString()).toEqual(outputAST.toString())
  expect(result.warnings()).toHaveLength(0)
}

it("one simple selector set to another simple selector", async () => {
  const input = `
    @set-specificity #id {
      .class {
        property: value;
      }
    }
  `
  const output = `
    :is(#_,:not(#_)):where(.class) {
      property: value;
    }
  `
  await run(input, output)
})

it("one simple selector set to zero specificity", async () => {
  const input = `
    @set-specificity {
      .class {
        property: value;
      }
    }
  `
  const output = `
    :where(.class) {
      property: value;
    }
  `
  await run(input, output)
})

it("one selector set to another selector", async () => {
  const input = `
    @set-specificity :is(#id.class, element, :pseudo-class) {
      element {
        property: value;
      }
    }
  `
  const output = `
    :is(#_._,:not(#_._)):where(element) {
      property: value;
    }
  `
  await run(input, output)
})

it("pseudo-elements handled as exceptions", async () => {
  const input = `
    @set-specificity :root {
      element::before, .class::after:hover {
        property: value;
      }
    }
  `
  const output = `
    :is(._,:not(._)):where(element)::before, :is(._,:not(._)):where(.class)::after:where(:hover) {
      property: value;
    }
  `
  await run(input, output)
})

it("one selector list set to another simple selector", async () => {
  const input = `
    @set-specificity #id {
      element, #id, .class {
        property: value;
      }
    }
  `
  const output = `
    :is(#_,:not(#_)):where(element), :is(#_,:not(#_)):where(#id), :is(#_,:not(#_)):where(.class) {
      property: value;
    }
  `
  await run(input, output)
})

it("one selector list set to zero specificity", async () => {
  const input = `
    @set-specificity {
      element, #id, .class {
        property: value;
      }
    }
  `
  const output = `
    :where(element), :where(#id), :where(.class) {
      property: value;
    }
  `
  await run(input, output)
})

it("multiple rules in one at-rule", async () => {
  const input = `
    @set-specificity {
      element, #id, .class {
        property: value;
      }

      element {}

      element#id {}
    }
  `
  const output = `
    :where(element), :where(#id), :where(.class) {
      property: value;
    }

    :where(element) {}

    :where(element#id) {}
  `
  await run(input, output)
})

it("multiple rules in multiple at-rules", async () => {
  const input = `
    @set-specificity {
      element, #id, .class {
        property: value;
      }

      element {}

      element#id {}
    }

    element {}

    @set-specificity element {
      .class {}

      #id:hover {}
    }
  `
  const output = `
    :where(element), :where(#id), :where(.class) {
      property: value;
    }

    :where(element) {}

    :where(element#id) {}

    element {}

    :is(_,:not(_)):where(.class) {}

    :is(_,:not(_)):where(#id:hover) {}
  `
  await run(input, output)
})
