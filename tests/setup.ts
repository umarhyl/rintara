import { mock } from "bun:test";

mock.module("server-only", () => {
  return {};
});

mock.module("next/cache", () => {
  return {
    revalidatePath: () => {},
    revalidateTag: () => {},
    unstable_cache: <Result>(callback: () => Result) => callback,
  };
});
