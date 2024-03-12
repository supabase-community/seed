import ansiEscapes from "ansi-escapes";
import kleur from "kleur";
import ora from "ora";
import terminalLink from "terminal-link";

export function eraseLines(numberOfLines: number) {
  return ansiEscapes.eraseLines(numberOfLines);
}

export function link(href: string) {
  return terminalLink(href, href);
}

export const spinner = ora();

export function highlight(text: string) {
  return kleur.bold().underline(text);
}
