/**
 * Bindings this app adds to the Worker's environment, on top of the ones
 * OpenNext already declares on CloudflareEnv.
 *
 * Typed by hand rather than as R2Bucket: @cloudflare/workers-types is not a
 * dependency, and put() is the only call made.
 */
interface UserPhotoBucket {
  put(
    key: string,
    value: ArrayBuffer | ArrayBufferView,
    options?: {
      httpMetadata?: { contentType?: string };
      customMetadata?: Record<string, string>;
    }
  ): Promise<unknown>;
}

interface CloudflareEnv {
  /**
   * Private R2 bucket for photos users submit (wrangler.jsonc, r2_buckets).
   * Optional so a deploy that is missing the binding is reported by the route
   * as a configuration error rather than as a TypeError on undefined.
   */
  USER_PHOTOS?: UserPhotoBucket;
}
