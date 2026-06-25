import { DefaultTheme, PageEvent, RendererEvent } from "typedoc";

/**
 * TypeDoc only adds "On This Page" entries for readme headings and child
 * members (e.g. type-alias properties). Standalone function pages render
 * Parameters, Returns, and block tags without registering page headings or
 * anchor ids for those sections.
 */
export function load(app) {
  app.renderer.on(RendererEvent.BEGIN, () => {
    if (!(app.renderer.theme instanceof DefaultTheme)) {
      return;
    }

    app.renderer.hooks.on("content.end", (context) => {
      const { page } = context;
      if (!page.isReflectionEvent()) {
        return;
      }

      const model = page.model;
      if (!model.isDeclaration() || !model.signatures?.length) {
        return;
      }

      // Pages with members (e.g. object type aliases) already have navigation.
      if (page.pageHeadings.length > 0) {
        return;
      }

      const signatures = model.signatures;
      const seenLabels = new Set();
      let paramIndex = 0;
      let returnsIndex = 0;
      let typeParamIndex = 0;

      for (const sig of signatures) {
        if (sig.typeParameters?.length) {
          const id = sectionId("type-parameters", typeParamIndex++);
          pushSectionHeading(page, seenLabels, "Type Parameters", id);
        }

        if (sig.parameters?.length) {
          const id = sectionId("parameters", paramIndex++);
          pushSectionHeading(page, seenLabels, "Parameters", id);
        }

        if (sig.type) {
          const id = sectionId("returns", returnsIndex++);
          pushSectionHeading(page, seenLabels, "Returns", id);
        }
      }
    });
  });

  app.renderer.on(PageEvent.END, (page) => {
    if (!page.isReflectionEvent()) {
      return;
    }

    const model = page.model;
    if (!model.isDeclaration() || !model.signatures?.length) {
      return;
    }

    page.contents = addSectionAnchors(page.contents);
    page.contents = normalizePageNavigation(page.contents);
  });
}

function sectionId(base, index) {
  return index === 0 ? base : `${base}-${index}`;
}

function pushSectionHeading(page, seenLabels, text, id) {
  if (seenLabels.has(text)) {
    return;
  }
  seenLabels.add(text);
  page.pageHeadings.push({ link: `#${id}`, text, level: 0 });
}

function addSectionAnchors(html) {
  let paramIndex = 0;
  let returnsIndex = 0;
  let typeParamIndex = 0;

  return html
    .replace(/<h4 class="tsd-parameters-title">/g, () => {
      const id = sectionId("parameters", paramIndex++);
      return `<h4 class="tsd-anchor-link tsd-parameters-title" id="${id}">`;
    })
    .replace(/<h4 class="tsd-returns-title">/g, () => {
      const id = sectionId("returns", returnsIndex++);
      return `<h4 class="tsd-anchor-link tsd-returns-title" id="${id}">`;
    })
    .replace(/<h4>Type Parameters<\/h4>/g, () => {
      const id = sectionId("type-parameters", typeParamIndex++);
      return `<h4 class="tsd-anchor-link" id="${id}">Type Parameters</h4>`;
    });
}

function normalizePageNavigation(html) {
  const tagRegex =
    /<div class="tsd-tag-[^"]+"><h4 class="tsd-anchor-link" id="([^"]+)">([^<]+)/g;
  const links = [];
  const seen = new Set();

  const navMatch = html.match(
    /(<details open class="tsd-accordion tsd-page-navigation">[\s\S]*?<div class="tsd-accordion-details">)([\s\S]*?)(<\/div><\/details><\/div><div class="site-menu">)/,
  );
  if (!navMatch) {
    return html;
  }

  const [, open, navContent, close] = navMatch;

  for (const match of navContent.matchAll(
    /<a href="(#[^"]+)"><span>([\s\S]*?)<\/span><\/a>/g,
  )) {
    const href = match[1];
    if (seen.has(href)) {
      continue;
    }
    seen.add(href);
    links.push({ href, text: match[2] });
  }

  for (const match of html.matchAll(tagRegex)) {
    const href = `#${match[1]}`;
    const text = match[2];
    if (seen.has(href)) {
      continue;
    }
    seen.add(href);
    links.push({ href, text });
  }

  if (!links.length) {
    return html;
  }

  const list = `<ul>${links
    .map((link) => `<li><a href="${link.href}"><span>${link.text}</span></a></li>`)
    .join("")}</ul>`;

  return html.replace(navMatch[0], `${open}${list}${close}`);
}
