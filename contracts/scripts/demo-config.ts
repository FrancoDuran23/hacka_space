// Deja web/lib/contract.json en modo demo (address null + ABI reales).
// Ojo: pisa un deploy real. Uso: npm run config:demo
import { CONTRACT_JSON, demoConfig, writeContractConfig } from "./lib/contract-config.ts";

await writeContractConfig(await demoConfig());
console.log(`Modo demo escrito en ${CONTRACT_JSON}`);
