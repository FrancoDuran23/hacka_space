"use client";

import { BrowserProvider, Contract, toBeHex, type Eip1193Provider } from "ethers";
import type { Band, PublicChain } from "./types";

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount)",
] as const;
const BAND_ABI = ["function bandAmount(uint256) view returns (uint128)"] as const;

export interface WalletState {
  address: string;
  /** USDC units (6 decimals). */
  balance: bigint;
  /** What the escrow may pull from this wallet when the relayer registers a satellite. */
  allowance: bigint;
}

/** window.ethereum can be missing or overwritten by another script: validate it. */
function getEth(): Eip1193Provider | null {
  const e = (globalThis as unknown as { ethereum?: Eip1193Provider }).ethereum;
  return e && typeof e.request === "function" ? e : null;
}

export const hasWallet = () => getEth() !== null;

async function ensureChain(eth: Eip1193Provider, chain: PublicChain) {
  const chainId = toBeHex(chain.chainId);
  try {
    await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId }] });
  } catch (e) {
    if ((e as { code?: number }).code !== 4902) throw e;
    await eth.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId,
          chainName: chain.chainId === 43113 ? "Avalanche Fuji C-Chain" : `Chain ${chain.chainId}`,
          nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
          rpcUrls: [chain.rpcUrl],
          blockExplorerUrls: chain.explorer ? [chain.explorer] : [],
        },
      ],
    });
  }
}

async function signer(chain: PublicChain) {
  const eth = getEth();
  if (!eth) throw new Error("No hay wallet en el navegador: instalá Core o MetaMask");
  await ensureChain(eth, chain);
  return new BrowserProvider(eth).getSigner();
}

export async function connectWallet(chain: PublicChain): Promise<WalletState> {
  const eth = getEth();
  if (!eth) throw new Error("No hay wallet en el navegador: instalá Core o MetaMask");
  await eth.request({ method: "eth_requestAccounts" });
  const s = await signer(chain);
  return readWallet(chain, await s.getAddress());
}

export async function readWallet(chain: PublicChain, address: string): Promise<WalletState> {
  const usdc = new Contract(chain.usdc, ERC20_ABI, (await signer(chain)).provider);
  const [balance, allowance] = await Promise.all([
    usdc.getFunction("balanceOf")(address) as Promise<bigint>,
    usdc.getFunction("allowance")(address, chain.escrow) as Promise<bigint>,
  ]);
  return { address, balance, allowance };
}

/** The exact deposit the contract charges for a band (fixed in its constructor). */
export async function bandDeposit(chain: PublicChain, band: Band): Promise<bigint> {
  const escrow = new Contract(chain.escrow, BAND_ABI, (await signer(chain)).provider);
  return escrow.getFunction("bandAmount")(band) as Promise<bigint>;
}

/** Sets (does not add to) the escrow's allowance to exactly `amount`. Returns the tx hash once mined. */
export async function approveDeposit(chain: PublicChain, amount: bigint): Promise<string> {
  const usdc = new Contract(chain.usdc, ERC20_ABI, await signer(chain));
  const tx = await usdc.getFunction("approve")(chain.escrow, amount);
  await tx.wait();
  return tx.hash as string;
}

/** Testnet only: MockUSDC's mint is open to anyone. */
export async function mintTestUsdc(chain: PublicChain, to: string, amount: bigint): Promise<string> {
  const usdc = new Contract(chain.usdc, ERC20_ABI, await signer(chain));
  const tx = await usdc.getFunction("mint")(to, amount);
  await tx.wait();
  return tx.hash as string;
}
