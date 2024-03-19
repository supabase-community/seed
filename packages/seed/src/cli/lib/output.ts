import ansiEscapes from "ansi-escapes";
import { gracefulExit } from "exit-hook";
import kleur from "kleur";
import ora from "ora";
import prompts from "prompts";
import terminalLink from "terminal-link";

export function prompt<T extends string = string>(
  questions: Array<prompts.PromptObject<T>> | prompts.PromptObject<T>,
  options?: prompts.Options,
): Promise<prompts.Answers<T>> {
  // workaround for properly handling SIGINT: https://github.com/terkelg/prompts/issues/252#issuecomment-778683666
  const abort = (state: { aborted: boolean }) => {
    if (state.aborted) {
      process.nextTick(() => {
        gracefulExit();
      });
    }
  };
  if (Array.isArray(questions)) {
    questions.forEach((q) => {
      q.onState = abort;
    });
  } else {
    questions.onState = abort;
  }
  return prompts<T>(questions, options);
}

export function eraseLines(numberOfLines: number) {
  process.stdout.write(ansiEscapes.eraseLines(numberOfLines));
}

export function link(text: string, url?: string) {
  return terminalLink(text, url ?? text);
}

export const spinner = ora();

export function highlight(text: string) {
  return kleur.bold().underline(text);
}

export function bold(text: string) {
  return kleur.bold(text);
}

export function dim(text: string) {
  return kleur.dim(text);
}
