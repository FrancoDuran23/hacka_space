import { expect } from "chai";
import { network } from "hardhat";

const { ethers, networkHelpers } = await network.create();

const USDC = (n: number) => BigInt(n) * 1_000_000n;
const OBJECT_ID = 25544n; // NORAD de ejemplo
const DAY = 24 * 60 * 60;

const Status = { None: 0n, Active: 1n, Deorbited: 2n, Expired: 3n } as const;

describe("DebrisEscrow", function () {
  async function deployFixture() {
    const [oracle, owner, funderA, funderB, cleaner, stranger] = await ethers.getSigners();
    const usdc = await ethers.deployContract("MockUSDC");
    const escrow = await ethers.deployContract("DebrisEscrow", [
      await usdc.getAddress(),
      oracle.address,
    ]);
    const escrowAddr = await escrow.getAddress();

    for (const f of [funderA, funderB, stranger]) {
      await usdc.mint(f.address, USDC(1_000_000));
      await usdc.connect(f).approve(escrowAddr, ethers.MaxUint256);
    }
    const deadline = BigInt((await networkHelpers.time.latest()) + 30 * DAY);
    return { usdc, escrow, escrowAddr, oracle, owner, funderA, funderB, cleaner, stranger, deadline };
  }

  async function activeEscrowFixture() {
    const f = await deployFixture();
    await f.escrow.connect(f.funderA).createEscrow(OBJECT_ID, f.owner.address, USDC(140_000), f.deadline);
    await f.escrow.connect(f.funderB).addFunds(OBJECT_ID, USDC(195_000));
    return f;
  }

  describe("deploy", function () {
    it("expone usdc y oracle", async function () {
      const { escrow, usdc, oracle } = await networkHelpers.loadFixture(deployFixture);
      expect(await escrow.usdc()).to.equal(await usdc.getAddress());
      expect(await escrow.oracle()).to.equal(oracle.address);
      expect(await usdc.decimals()).to.equal(6n);
      expect(await usdc.symbol()).to.equal("mUSDC");
    });

    it("rechaza direcciones cero en el constructor", async function () {
      const { escrow, usdc } = await networkHelpers.loadFixture(deployFixture);
      const factory = await ethers.getContractFactory("DebrisEscrow");
      await expect(factory.deploy(ethers.ZeroAddress, await usdc.getAddress())).to.be.revertedWithCustomError(
        escrow,
        "ZeroAddress",
      );
    });
  });

  describe("createEscrow", function () {
    it("crea el escrow, emite el evento y mueve los fondos", async function () {
      const { escrow, escrowAddr, usdc, owner, funderA, deadline } = await networkHelpers.loadFixture(deployFixture);
      const before = await usdc.balanceOf(funderA.address);

      await expect(escrow.connect(funderA).createEscrow(OBJECT_ID, owner.address, USDC(140_000), deadline))
        .to.emit(escrow, "EscrowCreated")
        .withArgs(OBJECT_ID, owner.address, funderA.address, USDC(140_000), deadline);

      expect(await usdc.balanceOf(funderA.address)).to.equal(before - USDC(140_000));
      expect(await usdc.balanceOf(escrowAddr)).to.equal(USDC(140_000));

      const e = await escrow.getEscrow(OBJECT_ID);
      expect(e.owner).to.equal(owner.address);
      expect(e.deadline).to.equal(deadline);
      expect(e.createdAt).to.equal(BigInt(await networkHelpers.time.latest()));
      expect(e.status).to.equal(Status.Active);
      expect(e.locked).to.equal(USDC(140_000));
      expect(e.totalFunded).to.equal(USDC(140_000));
      expect(e.cleaner).to.equal(ethers.ZeroAddress);
      expect(e.paidOut).to.equal(0n);

      expect(await escrow.getObjectIds()).to.deep.equal([OBJECT_ID]);
      expect(await escrow.escrowCount()).to.equal(1n);
      const [funders, amounts] = await escrow.getFunders(OBJECT_ID);
      expect(funders).to.deep.equal([funderA.address]);
      expect(amounts).to.deep.equal([USDC(140_000)]);
    });

    it("no se puede crear dos veces el mismo objeto", async function () {
      const { escrow, owner, funderB, deadline } = await networkHelpers.loadFixture(activeEscrowFixture);
      await expect(
        escrow.connect(funderB).createEscrow(OBJECT_ID, owner.address, USDC(1), deadline),
      ).to.be.revertedWithCustomError(escrow, "InvalidStatus");
    });

    it("valida owner, monto y plazo", async function () {
      const { escrow, owner, funderA, deadline } = await networkHelpers.loadFixture(deployFixture);
      await expect(
        escrow.connect(funderA).createEscrow(OBJECT_ID, ethers.ZeroAddress, USDC(1), deadline),
      ).to.be.revertedWithCustomError(escrow, "ZeroAddress");
      await expect(
        escrow.connect(funderA).createEscrow(OBJECT_ID, owner.address, 0n, deadline),
      ).to.be.revertedWithCustomError(escrow, "ZeroAmount");
      const now = BigInt(await networkHelpers.time.latest());
      await expect(
        escrow.connect(funderA).createEscrow(OBJECT_ID, owner.address, USDC(1), now),
      ).to.be.revertedWithCustomError(escrow, "InvalidDeadline");
    });
  });

  describe("addFunds", function () {
    it("suma un segundo financiador: evento, totales y lista", async function () {
      const { escrow, escrowAddr, usdc, owner, funderA, funderB, deadline } =
        await networkHelpers.loadFixture(deployFixture);
      await escrow.connect(funderA).createEscrow(OBJECT_ID, owner.address, USDC(140_000), deadline);

      await expect(escrow.connect(funderB).addFunds(OBJECT_ID, USDC(195_000)))
        .to.emit(escrow, "FundsAdded")
        .withArgs(OBJECT_ID, funderB.address, USDC(195_000), USDC(335_000));

      const e = await escrow.getEscrow(OBJECT_ID);
      expect(e.locked).to.equal(USDC(335_000));
      expect(e.totalFunded).to.equal(USDC(335_000));
      expect(await usdc.balanceOf(escrowAddr)).to.equal(USDC(335_000));

      const [funders, amounts] = await escrow.getFunders(OBJECT_ID);
      expect(funders).to.deep.equal([funderA.address, funderB.address]);
      expect(amounts).to.deep.equal([USDC(140_000), USDC(195_000)]);
    });

    it("un financiador que repite aparece una sola vez en la lista", async function () {
      const { escrow, funderA, funderB } = await networkHelpers.loadFixture(activeEscrowFixture);
      await escrow.connect(funderA).addFunds(OBJECT_ID, USDC(10_000));
      const [funders, amounts] = await escrow.getFunders(OBJECT_ID);
      expect(funders).to.deep.equal([funderA.address, funderB.address]);
      expect(amounts).to.deep.equal([USDC(150_000), USDC(195_000)]);
      expect((await escrow.getEscrow(OBJECT_ID)).locked).to.equal(USDC(345_000));
    });

    it("no se puede sumar a un objeto inexistente", async function () {
      const { escrow, funderA } = await networkHelpers.loadFixture(deployFixture);
      await expect(escrow.connect(funderA).addFunds(999n, USDC(1))).to.be.revertedWithCustomError(
        escrow,
        "InvalidStatus",
      );
    });

    it("no se puede sumar después del plazo", async function () {
      const { escrow, stranger, deadline } = await networkHelpers.loadFixture(activeEscrowFixture);
      await networkHelpers.time.increaseTo(deadline + 1n);
      await expect(escrow.connect(stranger).addFunds(OBJECT_ID, USDC(1))).to.be.revertedWithCustomError(
        escrow,
        "DeadlinePassed",
      );
    });

    it("no se puede sumar después de liquidar", async function () {
      const { escrow, oracle, cleaner, stranger } = await networkHelpers.loadFixture(activeEscrowFixture);
      await escrow.connect(oracle).confirmDeorbit(OBJECT_ID, cleaner.address);
      await expect(escrow.connect(stranger).addFunds(OBJECT_ID, USDC(1))).to.be.revertedWithCustomError(
        escrow,
        "InvalidStatus",
      );
    });

    it("limita a 32 financiadores distintos", async function () {
      const { escrow, escrowAddr, usdc, oracle, owner, deadline } = await networkHelpers.loadFixture(deployFixture);
      const wallets = Array.from({ length: 33 }, () => ethers.Wallet.createRandom(ethers.provider));
      for (const w of wallets) {
        await oracle.sendTransaction({ to: w.address, value: ethers.parseEther("1") });
        await usdc.mint(w.address, USDC(10));
        await usdc.connect(w).approve(escrowAddr, ethers.MaxUint256);
      }
      await escrow.connect(wallets[0]).createEscrow(OBJECT_ID, owner.address, USDC(1), deadline);
      for (let i = 1; i < 32; i++) await escrow.connect(wallets[i]).addFunds(OBJECT_ID, USDC(1));
      await expect(escrow.connect(wallets[32]).addFunds(OBJECT_ID, USDC(1))).to.be.revertedWithCustomError(
        escrow,
        "TooManyFunders",
      );
      // un financiador existente sí puede seguir sumando
      await escrow.connect(wallets[5]).addFunds(OBJECT_ID, USDC(1));
      const [funders] = await escrow.getFunders(OBJECT_ID);
      expect(funders.length).to.equal(32);
    });
  });

  describe("confirmDeorbit", function () {
    it("paga todo lo bloqueado al limpiador", async function () {
      const { escrow, escrowAddr, usdc, oracle, cleaner } = await networkHelpers.loadFixture(activeEscrowFixture);
      await expect(escrow.connect(oracle).confirmDeorbit(OBJECT_ID, cleaner.address))
        .to.emit(escrow, "DebrisDeorbited")
        .withArgs(OBJECT_ID, cleaner.address, USDC(335_000));

      expect(await usdc.balanceOf(cleaner.address)).to.equal(USDC(335_000));
      expect(await usdc.balanceOf(escrowAddr)).to.equal(0n);
      const e = await escrow.getEscrow(OBJECT_ID);
      expect(e.status).to.equal(Status.Deorbited);
      expect(e.cleaner).to.equal(cleaner.address);
      expect(e.paidOut).to.equal(USDC(335_000));
      expect(e.locked).to.equal(0n);
      expect(e.totalFunded).to.equal(USDC(335_000));
    });

    it("solo el oráculo puede confirmar", async function () {
      const { escrow, stranger, funderA, cleaner } = await networkHelpers.loadFixture(activeEscrowFixture);
      for (const s of [stranger, funderA]) {
        await expect(escrow.connect(s).confirmDeorbit(OBJECT_ID, cleaner.address)).to.be.revertedWithCustomError(
          escrow,
          "NotOracle",
        );
      }
    });

    it("rechaza limpiador cero", async function () {
      const { escrow, oracle } = await networkHelpers.loadFixture(activeEscrowFixture);
      await expect(escrow.connect(oracle).confirmDeorbit(OBJECT_ID, ethers.ZeroAddress)).to.be.revertedWithCustomError(
        escrow,
        "ZeroAddress",
      );
    });

    it("no se puede confirmar después del plazo", async function () {
      const { escrow, oracle, cleaner, deadline } = await networkHelpers.loadFixture(activeEscrowFixture);
      await networkHelpers.time.increaseTo(deadline + 1n);
      await expect(escrow.connect(oracle).confirmDeorbit(OBJECT_ID, cleaner.address)).to.be.revertedWithCustomError(
        escrow,
        "DeadlinePassed",
      );
    });

    it("no se puede confirmar dos veces ni tras vencer", async function () {
      const { escrow, oracle, cleaner, deadline } = await networkHelpers.loadFixture(activeEscrowFixture);
      await escrow.connect(oracle).confirmDeorbit(OBJECT_ID, cleaner.address);
      await expect(escrow.connect(oracle).confirmDeorbit(OBJECT_ID, cleaner.address)).to.be.revertedWithCustomError(
        escrow,
        "InvalidStatus",
      );

      const other = OBJECT_ID + 1n;
      const f = await networkHelpers.loadFixture(activeEscrowFixture);
      await f.escrow.connect(f.funderA).createEscrow(other, f.owner.address, USDC(1), deadline);
      await networkHelpers.time.increaseTo(deadline + 1n);
      await f.escrow.expire(other);
      await expect(f.escrow.connect(f.oracle).confirmDeorbit(other, f.cleaner.address)).to.be.revertedWithCustomError(
        f.escrow,
        "InvalidStatus",
      );
    });
  });

  describe("expire", function () {
    it("después del plazo reembolsa a cada financiador exactamente lo que puso", async function () {
      const { escrow, escrowAddr, usdc, funderA, funderB, stranger, deadline } =
        await networkHelpers.loadFixture(activeEscrowFixture);
      await escrow.connect(funderA).addFunds(OBJECT_ID, USDC(5_000));
      const beforeA = await usdc.balanceOf(funderA.address);
      const beforeB = await usdc.balanceOf(funderB.address);

      await networkHelpers.time.increaseTo(deadline + 1n);
      await expect(escrow.connect(stranger).expire(OBJECT_ID))
        .to.emit(escrow, "EscrowExpired")
        .withArgs(OBJECT_ID, USDC(340_000));

      expect(await usdc.balanceOf(funderA.address)).to.equal(beforeA + USDC(145_000));
      expect(await usdc.balanceOf(funderB.address)).to.equal(beforeB + USDC(195_000));
      expect(await usdc.balanceOf(escrowAddr)).to.equal(0n);
      const e = await escrow.getEscrow(OBJECT_ID);
      expect(e.status).to.equal(Status.Expired);
      expect(e.locked).to.equal(0n);
      expect(e.paidOut).to.equal(0n);
      expect(e.totalFunded).to.equal(USDC(340_000));
    });

    it("antes del plazo revierte", async function () {
      const { escrow, stranger, deadline } = await networkHelpers.loadFixture(activeEscrowFixture);
      await expect(escrow.connect(stranger).expire(OBJECT_ID)).to.be.revertedWithCustomError(
        escrow,
        "DeadlineNotReached",
      );
      // justo en el plazo todavía no vence
      await networkHelpers.time.setNextBlockTimestamp(deadline);
      await expect(escrow.connect(stranger).expire(OBJECT_ID)).to.be.revertedWithCustomError(
        escrow,
        "DeadlineNotReached",
      );
    });

    it("no se puede vencer un escrow ya liquidado ni inexistente", async function () {
      const { escrow, oracle, cleaner, stranger, deadline } = await networkHelpers.loadFixture(activeEscrowFixture);
      await escrow.connect(oracle).confirmDeorbit(OBJECT_ID, cleaner.address);
      await networkHelpers.time.increaseTo(deadline + 1n);
      await expect(escrow.connect(stranger).expire(OBJECT_ID)).to.be.revertedWithCustomError(escrow, "InvalidStatus");
      await expect(escrow.connect(stranger).expire(1n)).to.be.revertedWithCustomError(escrow, "InvalidStatus");
    });

    it("no se puede sumar fondos ni vencer de nuevo tras vencer", async function () {
      const { escrow, funderA, deadline } = await networkHelpers.loadFixture(activeEscrowFixture);
      await networkHelpers.time.increaseTo(deadline + 1n);
      await escrow.expire(OBJECT_ID);
      await expect(escrow.connect(funderA).addFunds(OBJECT_ID, USDC(1))).to.be.revertedWithCustomError(
        escrow,
        "InvalidStatus",
      );
      await expect(escrow.expire(OBJECT_ID)).to.be.revertedWithCustomError(escrow, "InvalidStatus");
    });
  });

  describe("vistas", function () {
    it("lista los objetos en orden de creación", async function () {
      const { escrow, owner, funderA, deadline } = await networkHelpers.loadFixture(deployFixture);
      for (const id of [22220n, 23088n, 10967n]) {
        await escrow.connect(funderA).createEscrow(id, owner.address, USDC(1), deadline);
      }
      expect(await escrow.getObjectIds()).to.deep.equal([22220n, 23088n, 10967n]);
      expect(await escrow.escrowCount()).to.equal(3n);
      expect((await escrow.getEscrow(1n)).status).to.equal(Status.None);
    });
  });
});
