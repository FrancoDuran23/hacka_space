---
name: hardhat
description: Configurar, compilar, testear y desplegar contratos Solidity con Hardhat 3 (3.21.2) y ethers v6 en Avalanche Fuji. Usar al crear el proyecto de contratos o al migrar de Hardhat 2.
---

# Hardhat 3

## Versiones (10/11/2026)

- `hardhat` 3.21.2, `@nomicfoundation/hardhat-toolbox-mocha-ethers` 4.0.0, `ethers` 6.17.0, `typescript` 5.9.3, `@types/node` 22.20.5.
- Hardhat 3 es **ESM**: `"type": "module"` en `package.json`. Node 22 o superior.
- Hardhat trae sus propias skills oficiales en `node_modules/hardhat/skills/` (`hardhat`, `hardhat-toolbox-mocha-ethers`, `hardhat-toolbox-viem`). Si hay duda, esas mandan.

## Crear el proyecto

```bash
mkdir contratos && cd contratos
npm init -y
npm pkg set type=module
npm i --save-exact hardhat@3.21.2 @nomicfoundation/hardhat-toolbox-mocha-ethers@4.0.0 ethers@6.17.0
npm i -D --save-exact typescript@5.9.3 @types/node@22.20.5
```

Atajo oficial: `npx hardhat --init` crea la estructura.

### Audit en 0

Las dependencias transitivas traen vulnerabilidades (zod, glob, minimatch). Agregá a `package.json`:

```json
"overrides": { "zod": "4.6.7", "glob": "14.0.4", "minimatch": "11.0.5" }
```

Después `npm install` y `npm audit` debe dar 0. Re-chequealo si cambiás versiones.

## hardhat.config.ts

```ts
import { defineConfig, configVariable } from "hardhat/config";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";

export default defineConfig({
  plugins: [hardhatToolboxMochaEthers],
  solidity: { version: "0.8.28" },
  networks: {
    fuji: {
      type: "http",
      chainType: "l1",
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts: [configVariable("FUJI_PRIVATE_KEY")],
    },
  },
});
```

Cambios clave de Hardhat 3: `defineConfig`, `plugins: [...]` (ya no `import "@nomicfoundation/..."` con efectos), `type: "http"` en cada red, `configVariable()` para secretos.

### Secretos

```bash
npx hardhat keystore set FUJI_PRIVATE_KEY
```

Se guarda en el keystore de Hardhat, no en el repo. Alternativa: variable de entorno con el mismo nombre. Nunca commitees una clave.

## Contrato de ejemplo (`contracts/ThresholdAlert.sol`)

Guarda la huella de un dato y avisa si cruza un umbral. Compila con solc 0.8.28.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ThresholdAlert {
    address public immutable publisher;
    uint256 public immutable threshold;

    struct Reading { bytes32 dataHash; uint64 timestamp; uint32 value; }
    Reading[] public readings;

    event ReadingPublished(uint256 indexed id, bytes32 dataHash, uint32 value, uint64 timestamp);
    event ThresholdCrossed(uint256 indexed id, uint32 value);

    constructor(uint256 _threshold) { publisher = msg.sender; threshold = _threshold; }

    function publish(bytes32 dataHash, uint32 value, uint64 timestamp) external {
        require(msg.sender == publisher, "solo el publicador");
        readings.push(Reading(dataHash, timestamp, value));
        uint256 id = readings.length - 1;
        emit ReadingPublished(id, dataHash, value, timestamp);
        if (value >= threshold) emit ThresholdCrossed(id, value);
    }
}
```

## Test (`test/ThresholdAlert.ts`)

```ts
import { expect } from "chai";
import { network } from "hardhat";

const { ethers, networkHelpers } = await network.create();

describe("ThresholdAlert", () => {
  async function deploy() {
    const [owner, other] = await ethers.getSigners();
    const c = await ethers.deployContract("ThresholdAlert", [5]);
    return { c, owner, other };
  }

  it("avisa si cruza el umbral", async () => {
    const { c } = await networkHelpers.loadFixture(deploy);
    await expect(c.publish(ethers.ZeroHash, 7, 1)).to.emit(c, "ThresholdCrossed").withArgs(0, 7);
  });

  it("solo publica el publicador", async () => {
    const { c, other } = await networkHelpers.loadFixture(deploy);
    await expect(c.connect(other).publish(ethers.ZeroHash, 1, 1)).to.be.revertedWith("solo el publicador");
  });
});
```

Diferencia clave: en Hardhat 3 no hay `import { ethers } from "hardhat"`. Se hace `const { ethers, networkHelpers } = await network.create()`.

```bash
npx hardhat test
```

## Deploy (`scripts/deploy.ts`)

```ts
import { network } from "hardhat";

const { ethers } = await network.create("fuji");
const c = await ethers.deployContract("ThresholdAlert", [5]);
await c.waitForDeployment();
console.log("Contrato:", await c.getAddress());
console.log("Explorer:", `https://explorer-test.avax.network/c-chain/address/${await c.getAddress()}`);
```

```bash
npx hardhat run scripts/deploy.ts --network fuji
```

Necesitás AVAX de prueba en la wallet (ver skill `avalanche`). Guardá la dirección y el ABI (`artifacts/contracts/ThresholdAlert.sol/ThresholdAlert.json`, campo `abi`) para el frontend.

## Antes de desplegar

- `npx hardhat test` en verde.
- Una sola función clave, sin lógica de más.
- Nada de claves ni direcciones privadas en el código.
- Desplegá **temprano**: sin contrato no hay entrega.

## Para verificar el contrato en el explorer

Si el explorer lo permite, publicá el código fuente verificado. Si no, alcanza con el link a la dirección y a la transacción.

## Estado de verificación

Verificados: la config carga, el contrato compila con solc 0.8.28 y `npm audit` da 0 con los overrides. **No se ejecutó `hardhat compile` ni `hardhat test` completos**: el entorno donde se escribió no podía bajar el compilador. Si algo falla, comparalo con `node_modules/hardhat/skills/hardhat-toolbox-mocha-ethers`.
