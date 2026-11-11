import { expect } from "chai";
import { network } from "hardhat";

const { ethers, networkHelpers } = await network.create();

const YEAR = 365 * 24 * 60 * 60;

const ENVISAT = 27386;
// 2002-03-01T00:00:00Z, tal como lo devuelve SATCAT para ENVISAT.
const ENVISAT_LAUNCH = 1014940800;
// Objeto del catalogo que ya decayo (SATCAT DECAY_DATE 2026-10-31).
const DECAYED = 4133;

const usdc = (n: number) => ethers.parseUnits(String(n), 6);
const hashOf = (s: string) => ethers.keccak256(ethers.toUtf8Bytes(s));

const BAND_YEARS = [5, 10, 25];
const BAND_AMOUNT = [usdc(100_000), usdc(300_000), usdc(800_000)];

const State = { None: 0n, Active: 1n, Refunded: 2n, Forfeited: 3n };
const ForfeitReason = { LateReentry: 0n, Expired: 1n };

async function deployFixture() {
  const [relayer, fund, operator, stranger] = await ethers.getSigners();

  const token = await ethers.deployContract("MockUSDC");
  const tokenAddress = await token.getAddress();

  const escrow = await ethers.deployContract("OrbitClearEscrow", [
    tokenAddress,
    relayer.address,
    fund.address,
    BAND_YEARS,
    BAND_AMOUNT,
  ]);
  const escrowAddress = await escrow.getAddress();

  await token.mint(operator.address, usdc(3_000_000));
  await token.mint(stranger.address, usdc(3_000_000));
  await token.connect(operator).approve(escrowAddress, ethers.MaxUint256);
  await token.connect(stranger).approve(escrowAddress, ethers.MaxUint256);

  const now = await networkHelpers.time.latest();

  return { escrow, token, relayer, fund, operator, stranger, now };
}

describe("OrbitClearEscrow", function () {
  describe("registro", function () {
    it("crea un escrow por NORAD y cobra el deposito", async function () {
      const { escrow, token, relayer, operator, now } =
        await networkHelpers.loadFixture(deployFixture);

      const launchedAt = now - YEAR;
      const dataHash = hashOf("envisat-satcat-record");

      await expect(
        escrow.connect(relayer).register(ENVISAT, operator.address, launchedAt, 0, dataHash),
      )
        .to.emit(escrow, "Registered")
        .withArgs(
          ENVISAT,
          operator.address,
          0,
          launchedAt,
          launchedAt + 5 * YEAR,
          BAND_AMOUNT[0],
          dataHash,
        );

      expect(await token.balanceOf(await escrow.getAddress())).to.equal(BAND_AMOUNT[0]);
      expect(await escrow.totalDeposited()).to.equal(BAND_AMOUNT[0]);

      const e = await escrow.escrowOf(ENVISAT);
      expect(e.operator).to.equal(operator.address);
      expect(e.launchedAt).to.equal(BigInt(launchedAt));
      expect(e.deadline).to.equal(BigInt(launchedAt + 5 * YEAR));
      expect(e.deposit).to.equal(BAND_AMOUNT[0]);
      expect(e.band).to.equal(0n);
      expect(e.state).to.equal(State.Active);
    });

    it("el monto depende de la banda orbital", async function () {
      const { escrow, relayer, operator, now } =
        await networkHelpers.loadFixture(deployFixture);

      await escrow.connect(relayer).register(ENVISAT, operator.address, now - YEAR, 2, hashOf("alta"));

      const e = await escrow.escrowOf(ENVISAT);
      expect(e.deposit).to.equal(BAND_AMOUNT[2]);
      expect(e.deadline).to.equal(BigInt(now - YEAR + 25 * YEAR));
    });

    it("solo el relayer puede registrar", async function () {
      const { escrow, operator, stranger, now } =
        await networkHelpers.loadFixture(deployFixture);

      await expect(
        escrow.connect(stranger).register(ENVISAT, operator.address, now - YEAR, 0, hashOf("x")),
      )
        .to.be.revertedWithCustomError(escrow, "NotRelayer");
    });

    it("no se puede registrar dos veces el mismo NORAD", async function () {
      const { escrow, relayer, operator, now } =
        await networkHelpers.loadFixture(deployFixture);

      await escrow.connect(relayer).register(ENVISAT, operator.address, now - YEAR, 0, hashOf("x"));

      await expect(
        escrow.connect(relayer).register(ENVISAT, operator.address, now - YEAR, 0, hashOf("y")),
      )
        .to.be.revertedWithCustomError(escrow, "AlreadyRegistered")
        .withArgs(ENVISAT);
    });

    it("rechaza banda invalida y fecha de lanzamiento futura", async function () {
      const { escrow, relayer, operator, now } =
        await networkHelpers.loadFixture(deployFixture);

      await expect(
        escrow.connect(relayer).register(ENVISAT, operator.address, now - YEAR, 3, hashOf("x")),
      )
        .to.be.revertedWithCustomError(escrow, "InvalidBand")
        .withArgs(3);

      await expect(
        escrow.connect(relayer).register(ENVISAT, operator.address, now + 86400, 0, hashOf("x")),
      ).to.be.revertedWithCustomError(escrow, "InvalidLaunchDate");
    });
  });

  describe("plazo anclado al lanzamiento", function () {
    it("Envisat nace vencido: lanzado en 2002, banda media, plazo 2012", async function () {
      const { escrow, relayer, operator } = await networkHelpers.loadFixture(deployFixture);

      await escrow
        .connect(relayer)
        .register(ENVISAT, operator.address, ENVISAT_LAUNCH, 1, hashOf("envisat-satcat"));

      const e = await escrow.escrowOf(ENVISAT);
      expect(e.deadline).to.equal(BigInt(ENVISAT_LAUNCH + 10 * YEAR));
      expect(await escrow.isExpired(ENVISAT)).to.equal(true);
    });

    it("un satelite recien lanzado no esta vencido", async function () {
      const { escrow, relayer, operator, now } =
        await networkHelpers.loadFixture(deployFixture);

      await escrow.connect(relayer).register(ENVISAT, operator.address, now, 0, hashOf("nuevo"));

      expect(await escrow.isExpired(ENVISAT)).to.equal(false);
    });

    it("deadlineFor reproduce el plazo sin escribir estado", async function () {
      const { escrow } = await networkHelpers.loadFixture(deployFixture);

      expect(await escrow.deadlineFor(ENVISAT_LAUNCH, 1)).to.equal(
        BigInt(ENVISAT_LAUNCH + 10 * YEAR),
      );
      await expect(escrow.deadlineFor(ENVISAT_LAUNCH, 7))
        .to.be.revertedWithCustomError(escrow, "InvalidBand")
        .withArgs(7);
    });
  });

  describe("reingreso verificado", function () {
    it("reingreso dentro del plazo devuelve el deposito al operador", async function () {
      const { escrow, token, relayer, operator, now } =
        await networkHelpers.loadFixture(deployFixture);

      const launchedAt = now - YEAR;
      await escrow.connect(relayer).register(DECAYED, operator.address, launchedAt, 0, hashOf("gp"));

      const before = await token.balanceOf(operator.address);

      await expect(escrow.connect(relayer).attestReentry(DECAYED, now, hashOf("satcat-decay")))
        .to.emit(escrow, "ReentryAttested")
        .withArgs(DECAYED, now, hashOf("satcat-decay"))
        .and.to.emit(escrow, "Refunded")
        .withArgs(DECAYED, operator.address, BAND_AMOUNT[0]);

      expect((await token.balanceOf(operator.address)) - before).to.equal(BAND_AMOUNT[0]);
      expect((await escrow.escrowOf(DECAYED)).state).to.equal(State.Refunded);
      expect(await escrow.totalRefunded()).to.equal(BAND_AMOUNT[0]);
    });

    it("reingreso despues del plazo decomisa al fondo", async function () {
      const { escrow, token, relayer, fund, operator, now } =
        await networkHelpers.loadFixture(deployFixture);

      const launchedAt = now - 6 * YEAR;
      await escrow.connect(relayer).register(DECAYED, operator.address, launchedAt, 0, hashOf("gp"));

      const before = await token.balanceOf(fund.address);

      await expect(escrow.connect(relayer).attestReentry(DECAYED, now, hashOf("satcat-decay")))
        .to.emit(escrow, "Forfeited")
        .withArgs(DECAYED, fund.address, BAND_AMOUNT[0], ForfeitReason.LateReentry);

      expect((await token.balanceOf(fund.address)) - before).to.equal(BAND_AMOUNT[0]);
      expect((await escrow.escrowOf(DECAYED)).state).to.equal(State.Forfeited);
    });

    it("solo el relayer acredita y no se puede acreditar dos veces", async function () {
      const { escrow, relayer, operator, stranger, now } =
        await networkHelpers.loadFixture(deployFixture);

      await escrow.connect(relayer).register(DECAYED, operator.address, now - YEAR, 0, hashOf("gp"));

      await expect(escrow.connect(stranger).attestReentry(DECAYED, now, hashOf("x")))
        .to.be.revertedWithCustomError(escrow, "NotRelayer");

      await escrow.connect(relayer).attestReentry(DECAYED, now, hashOf("satcat-decay"));

      await expect(escrow.connect(relayer).attestReentry(DECAYED, now, hashOf("otra")))
        .to.be.revertedWithCustomError(escrow, "EscrowNotActive")
        .withArgs(DECAYED);
    });
  });

  describe("vencimiento", function () {
    it("cualquiera puede cerrar un escrow vencido y decomisar al fondo", async function () {
      const { escrow, token, relayer, fund, operator, stranger, now } =
        await networkHelpers.loadFixture(deployFixture);

      await escrow
        .connect(relayer)
        .register(ENVISAT, operator.address, ENVISAT_LAUNCH, 1, hashOf("envisat-satcat"));

      const before = await token.balanceOf(fund.address);

      await expect(escrow.connect(stranger).closeExpired(ENVISAT))
        .to.emit(escrow, "Forfeited")
        .withArgs(ENVISAT, fund.address, BAND_AMOUNT[1], ForfeitReason.Expired);

      expect((await token.balanceOf(fund.address)) - before).to.equal(BAND_AMOUNT[1]);
      expect(await escrow.totalForfeited()).to.equal(BAND_AMOUNT[1]);
      expect((await escrow.escrowOf(ENVISAT)).state).to.equal(State.Forfeited);
    });

    it("no se puede cerrar antes del vencimiento", async function () {
      const { escrow, relayer, operator, now } =
        await networkHelpers.loadFixture(deployFixture);

      await escrow.connect(relayer).register(ENVISAT, operator.address, now, 0, hashOf("x"));

      await expect(escrow.closeExpired(ENVISAT))
        .to.be.revertedWithCustomError(escrow, "NotExpired")
        .withArgs(ENVISAT);
    });

    it("el vencimiento ocurre exactamente al pasar el plazo", async function () {
      const { escrow, relayer, operator, now } =
        await networkHelpers.loadFixture(deployFixture);

      await escrow.connect(relayer).register(ENVISAT, operator.address, now, 0, hashOf("x"));

      expect(await escrow.isExpired(ENVISAT)).to.equal(false);

      await networkHelpers.time.increase(5 * YEAR + 2);

      expect(await escrow.isExpired(ENVISAT)).to.equal(true);
      await expect(escrow.closeExpired(ENVISAT)).to.emit(escrow, "Forfeited");
    });
  });
});
