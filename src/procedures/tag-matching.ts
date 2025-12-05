// unifying tag auto-completion behavior

import { dual_way_filter } from "./utilities-pure";

export enum TagMatchClass {
  // zero-class match: exact match found (criterion: foobar, matched: foobar)
  ExactMatch,
  // first-class matches: prefix matches (criterion: foo, matched: foobar)
  PrefixMatches,
  // second-class matches: substring matches (criterion: oo, matched: foobar)
  SubstringMatches,
  // third-class match: not matched, creating a new one
  Creation,
}
type TagMatchedResult = {
  type: TagMatchClass.ExactMatch | TagMatchClass.PrefixMatches | TagMatchClass.SubstringMatches;
  value: number;
  display: string;
};
type TagCreatingResult = {
  type: TagMatchClass.Creation;
  value: string;
  display: string;
};
export type TagMatchResult = TagMatchedResult | TagCreatingResult;

// finding candidates matching the criterion from the tag pool
// All possible candidates will be returned in an array, started with zero-class match, followed by
//  first-class matches, then second-class and third-class.
// If no matches is found in some class, it is omitted. Order of candidates within the same class is
//  not specified.
// Third-class match may only appear if allow_creating is set to true: this is the criterion returned
//  as-is, allowing creating new tags
export function find_tag_candidates(
  criterion: string,
  haystack: Readonly<string[]>,
  options: { allow_creating: true },
): TagMatchResult[];
export function find_tag_candidates(
  criterion: string,
  haystack: Readonly<string[]>,
  options?: { allow_creating?: false },
): TagMatchedResult[];
export function find_tag_candidates(
  criterion: string,
  haystack: Readonly<string[]>,
  options?: { allow_creating?: boolean },
): TagMatchResult[];
export function find_tag_candidates(
  criterion: string,
  haystack: Readonly<string[]>,
  options?: { allow_creating?: boolean },
): TagMatchResult[] {
  // bind indices with values since the indices is used to refer tags existing
  const bind_tags = haystack.map((value, index) => ({ value, index }));
  // separate exact matches and other tags
  const [exact, non_exact] = dual_way_filter(bind_tags, ({ value }) => value === criterion);
  // separate prefix matches and other tags
  const [prefix, non_prefix] = dual_way_filter(non_exact, ({ value }) => value.startsWith(criterion));
  // find out substring matches
  const substring = non_prefix.filter(({ value }) => value.includes(criterion));
  const result: TagMatchResult[] = [
    ...exact.map(
      ({ value, index }): TagMatchedResult => ({
        type: TagMatchClass.ExactMatch,
        value: index,
        display: value,
      }),
    ),
    ...prefix.map(
      ({ value, index }): TagMatchedResult => ({
        type: TagMatchClass.PrefixMatches,
        value: index,
        display: value,
      }),
    ),
    ...substring.map(
      ({ value, index }): TagMatchedResult => ({
        type: TagMatchClass.SubstringMatches,
        value: index,
        display: value,
      }),
    ),
  ];
  if (options?.allow_creating && exact.length === 0) {
    result.push({ type: TagMatchClass.Creation, value: criterion, display: criterion });
  }
  return result;
}
