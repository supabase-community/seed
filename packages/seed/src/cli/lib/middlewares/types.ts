import { type ArgumentsCamelCase } from "yargs";

type CommandHandler<U> = (args: ArgumentsCamelCase<U>) => Promise<void> | void;

export type Middleware = <U>(handler: CommandHandler<U>) => CommandHandler<U>;
