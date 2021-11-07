const { specificity, tokenize } = require("parsel-js")

const wasProcessed = Symbol("processed by set-specificity")

// Make the most performant "universal" selector of a given specificity
const universalOfSpecificity = ([ids, classes, elements]) => {
  let selector = ""

  for (let e = 0; e < elements; e++)
    if (e === 0)
      selector += "_"
    else
      selector += "+_"

  for (let i = 0; i < ids; i++)
    selector += "#_"

  for (let c = 0; c < classes; c++)
    selector += "._"

  return `:is(${selector},:not(${selector}))`
}

// Wrap a selector in :where()
// Of course, pseudo elements are an exception
const wrapInWhere = inputSelector => {
  const tokens = tokenize(inputSelector)

  let outputSelector = ""
  let inWhere = false

  for (const token of tokens) {
    if (!inWhere) {
      outputSelector += ":where("
      inWhere = true
    }

    if (token.type === "pseudo-element") {
      outputSelector += ")" + token.content
      inWhere = false
    }
    else {
      outputSelector += token.content
    }
  }

  if (inWhere)
    outputSelector += ")"

  return outputSelector
}

const processRule = atRuleParams => rule => {
  if (rule[wasProcessed]) return

  const selectorTransform =
    atRuleParams.length === 0
      // Special case of zero specificity
      ? selector =>
          wrapInWhere(selector)
      // General case where we need the :is(x, :not(x)) first
      : selector =>
          universalOfSpecificity(specificity(atRuleParams)) +
          wrapInWhere(selector)

  rule.selectors = rule.selectors
    .map(selectorTransform)

  rule[wasProcessed] = true
}

/** @type { import("postcss").PluginCreator } */
const postcssSetSpecificity = () => ({
  postcssPlugin: "set-specificity",

  AtRule: {
    "set-specificity": atRule => {
      if (!atRule.nodes) return

      atRule.walkRules(processRule(atRule.params))
      atRule.replaceWith(atRule.nodes)
    }
  }
})
postcssSetSpecificity.postcss = true

module.exports = postcssSetSpecificity
