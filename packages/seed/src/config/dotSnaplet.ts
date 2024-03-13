import { findUp } from "find-up";

export async function getDotSnapletPath() {
  const path = await findUp(".snaplet", {
    type: "directory",
  });

  return path;
}
