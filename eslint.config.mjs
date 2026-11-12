import next from "eslint-config-next/core-web-vitals";
import ts from "eslint-config-next/typescript";
const config = [{ignores:[".next/**","src/generated/**","work/**","outputs/**","test-results/**","playwright-report/**","next-env.d.ts"]}, ...next, ...ts];

export default config;
