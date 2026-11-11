# track-skills

Skills portables para cualquier LLM (Claude, ChatGPT, Gemini, Kimi, Qwen, DeepSeek). Cada una es un `SKILL.md` autocontenido: frontmatter con `name` y `description`, y el cuerpo en markdown plano.

## Índice

| Skill | Cuándo usarla |
|---|---|
| `idea/research-con-contexto` | Buscar y elegir el problema, con el contexto del track |
| `idea/validacion-idea` | Cuestionar la idea, test de blockchain, go / no-go |
| `idea/modelo-de-negocio` | Quién paga, quién cobra, por qué la cadena |
| `frontend` | UI rápida, limpia y liviana (Next.js / v0 / Lovable) |
| `ethers` | Ethers v6 (no existe v7 estable) |
| `hardhat` | Hardhat 3: compilar, testear, desplegar en Fuji |
| `wallet-abi` | Conectar wallet y consumir un contrato con su ABI |
| `geoespacial` | Datos de satélite, clima, sismos, incendios |
| `avalanche` | Fuji, C-Chain, L1 propia, faucet, explorer |

## Cómo usarlas con cualquier LLM

1. Pegá el `SKILL.md` completo al inicio del chat (o adjuntalo / ponelo en las instrucciones del proyecto).
2. Decí qué querés: "Usá esta skill y ayudame con X".
3. Para una tarea larga, combiná: `idea/*` primero, después `hardhat` + `ethers` + `wallet-abi`, y `frontend` al final.
4. En agentes con carpetas de skills (Claude Code, etc.), copiá la carpeta tal cual.

## Orden recomendado en el hackathon

1. `idea/research-con-contexto` (problema y dato)
2. `idea/validacion-idea` (go / no-go)
3. `idea/modelo-de-negocio` (pitch)
4. `avalanche` + `hardhat` (contrato en Fuji temprano)
5. `geoespacial` (dato real guardado)
6. `ethers` + `wallet-abi` + `frontend` (demo)

## Reglas comunes a todas

- Dependencias con versión exacta (`npm i --save-exact`) y `npm audit` en 0.
- Secretos en `.env` o variables del servidor. Nunca en el repo ni en `NEXT_PUBLIC_*`.
- Clave privada solo de testnet y de una wallet descartable.
- Poco texto en pantalla. Un solo flujo: dato real, contrato, explorer.

## Qué está verificado y qué no

- Verificado: versiones en npm al 10/11/2026 (ethers 6.17.0, Hardhat 3.21.2), el contrato de ejemplo compila con solc 0.8.28 y los snippets de ethers pasan `tsc`.
- No verificado: `hardhat compile` y `hardhat test` completos (el entorno donde se armó no podía bajar el compilador). Probalos vos con `npx hardhat test`.
- El reglamento del track es un borrador. Confirmá con los organizadores la hora de entrega y el tamaño de equipo.
