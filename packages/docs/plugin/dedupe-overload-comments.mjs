import { Converter } from "typedoc";

/**
 * TypeScript inherits JSDoc from the first overload onto later overload
 * signatures. TypeDoc then renders that shared prose on every overload.
 * Drop identical comments from non-first signatures so examples, remarks,
 * and summaries only appear once.
 */
export function load(app) {
  app.converter.on(Converter.EVENT_RESOLVE_END, (context) => {
    dedupeOverloadComments(context.project);
  });
}

function dedupeOverloadComments(project) {
  const visit = (reflection) => {
    const signatures = reflection.signatures;
    if (signatures?.length > 1) {
      const firstFingerprint = commentFingerprint(signatures[0].comment);

      for (let index = 1; index < signatures.length; index++) {
        const signature = signatures[index];
        if (commentFingerprint(signature.comment) === firstFingerprint) {
          signature.comment = undefined;
        }
      }
    }

    for (const child of reflection.children ?? []) {
      visit(child);
    }
  };

  visit(project);
}

function commentFingerprint(comment) {
  if (!comment) {
    return null;
  }

  const parts = [comment.summary.map((part) => part.text).join("")];

  for (const tag of comment.blockTags) {
    parts.push(tag.tag, tag.content.map((part) => part.text).join(""));
  }

  return parts.join("\0");
}
