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

export function bold(text: string) {
  return kleur.bold(text);
}

export function dim(text: string) {
  return kleur.dim(text);
}

export function error(text: string) {
  return kleur.red().bold(text);
}

export function brightGreen(text: string) {
  return kleur.bold().green(text);
}
