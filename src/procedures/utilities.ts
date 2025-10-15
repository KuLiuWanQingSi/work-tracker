export function dual_way_filter<T>(
  array: T[],
  predicate: (value: T, index: number, array: T[]) => boolean
): [T[], T[]] {
  return array.reduce(
    (previous, current, index, arr) => {
      const [positive, negative] = previous;
      (predicate(current, index, arr) ? positive : negative).push(current);
      return [positive, negative];
    },
    [[], []] as [T[], T[]]
  );
}

// try to complete the url by prepending https:// if required
//  return an instance of URL is one can be constructed, null if all attempts have failed
export function try_complete_url(url: string): URL | null {
  const attempts = [url, `https://${url}`].map((url) => URL.parse(url)).filter((value) => value !== null)[0];
  return attempts === undefined ? null : attempts;
}
