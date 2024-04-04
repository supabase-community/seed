import ansiEscapes from "ansi-escapes";
import kleur from "kleur";
import ora from "ora";
import terminalLink from "terminal-link";

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
