export interface Config {
  env: string;
  port: number;
}

export const defaultConfig: Config = {
  env: 'development',
  port: 3000,
};
