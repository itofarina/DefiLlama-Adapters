const sdk = require("@defillama/sdk");
const { constants } = require("ethers");
const { lendingMarket } = require("../helper/methodologies");
const { exactly } = require("./abi.json");

const PREVIEWER_ADDRESS = {
  ethereum: "0x0AA3529ae5FdBCeB69Cf8ab2b9e2d3Af85860469",
};

const getMarkets = async (chain) =>
  (
    await sdk.api.abi.call({
      abi: exactly,
      target: PREVIEWER_ADDRESS[chain],
      params: [constants.AddressZero],
    })
  ).output;

const tvl = async (chain, timestamp, block) => {
  const markets = await getMarkets(chain);
  return markets.reduce(
    (balance, { asset, fixedPools, totalFloatingDepositAssets }) => {
      const FRPBalance = fixedPools.reduce(
        (total, { supplied }) => total.add(supplied),
        constants.Zero
      );
      return {
        ...balance,
        [asset]: Number(FRPBalance.add(totalFloatingDepositAssets).toString()),
      };
    },
    {}
  );
};

const borrowed = async (chain, timestamp, block) => {
  const markets = await getMarkets(chain);

  return markets.reduce(
    (balance, { asset, fixedPools, totalFloatingBorrowAssets }) => {
      const FRPBalance = fixedPools.reduce(
        (total, { borrowed }) => total.add(borrowed),
        constants.Zero
      );
      return {
        ...balance,
        [asset]: Number(FRPBalance.add(totalFloatingBorrowAssets).toString()),
      };
    },
    {}
  );
};

module.exports = {
  timetravel: true,
  methodology: `${lendingMarket}.`, // TODO: describe our methodology
  start: 15868263,
  ethereum: {
    tvl: () => tvl("ethereum"),
    borrowed: () => borrowed("ethereum"),
  },
};
