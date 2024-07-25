import { defineConfig } from "snaplet";
import { copycat } from "@snaplet/copycat";

export default defineConfig({
  generate: {
    plan({ snaplet }) {
      return snaplet.Post({
        data: {
          title: "There is a lot of snow around here!",
          User: {
            data: {
              email: ({ seed }) => copycat.email(seed, { domain: "acme.org" }),
            },
          },
          Comment: {
            count: 3,
          },
        },
      });
    },
  },
});
