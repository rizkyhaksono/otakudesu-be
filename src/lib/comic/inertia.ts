import { NotFoundError, UpstreamError } from "@/lib/shared/errors";
import { decodeEntities } from "@/lib/shared/sanitize";

/**
 * The comic upstream is a Laravel + Inertia.js app: every page ships its full
 * server state as HTML-escaped JSON in the root element's `data-page`
 * attribute.
 *
 * Reading that is far more robust than CSS selectors — the payload is a typed
 * API response in all but name, and it survives redesigns of the markup.
 *
 * Note: requesting the page with `X-Inertia: true` (the "proper" JSON channel)
 * answers 409 because we cannot know the asset version up front, so parsing the
 * HTML is the supported path here.
 */

const DATA_PAGE = /data-page="([^"]*)"/;

export type InertiaPage<TProps = Record<string, unknown>> = {
  component: string;
  props: TProps;
  url: string;
  version: string | null;
};

export function parseInertia<TProps = Record<string, unknown>>(
  html: string,
): InertiaPage<TProps> {
  const match = DATA_PAGE.exec(html);

  if (!match?.[1]) {
    throw new UpstreamError("Comic upstream returned an unrecognised page format");
  }

  let page: InertiaPage<TProps>;
  try {
    page = JSON.parse(decodeEntities(match[1])) as InertiaPage<TProps>;
  } catch {
    throw new UpstreamError("Comic upstream returned malformed page data");
  }

  if (!page || typeof page !== "object" || !page.props) {
    throw new UpstreamError("Comic upstream page data is missing props");
  }

  return page;
}

/**
 * Assert the page is the component we expected. The upstream renders its 404 as
 * a normal 200 page, so this is what turns "wrong page" into a real 404.
 */
export function expectComponent<TProps>(
  page: InertiaPage<TProps>,
  expected: string | string[],
): TProps {
  const allowed = Array.isArray(expected) ? expected : [expected];
  if (!allowed.includes(page.component)) {
    throw new NotFoundError();
  }
  return page.props;
}
