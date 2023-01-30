const BNSSimpleStorage = artifacts.require('BNSSimpleStorage');
const BNSRepository = artifacts.require('BNSRepository');
const { logger } = require('../util');
const { ether, time, BN} = require('@openzeppelin/test-helpers');

const SITE_NAME = "simple-site-in-blockchain";
const ADDRESS_PATTERN = "\[ADDRESS\]";
const ADDRESSES_TO_CONTENTS = [{
  address: SITE_NAME,
  content: `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Simple site in blockchain</title>
        <meta name="description" content="Simple site in blockchain demonstate storage reading"j>
      </head>
      <body>This is first in the world site in simple blockchain storage!</body>
    </html>
  `
}];

const DOMAINS_TO_ADDRESSES = [
  {
    domain: "blockwit",
    address: "https://blockwit.io"
  },
  {
    domain: "bscscan",
    address: "https://bscscan.com"
  },
  {
    domain: "simple-site-in-blockchain",
    address: `bns.bsc.simple_storage_${ADDRESS_PATTERN}://${SITE_NAME}`
  }
];

//bns.bsc.simple_storage_0x2Ad485e03e5A6846187f8eD12bd402458647f330://simple-site-in-blockchain

async function deploy () {
  const args = process.argv.slice(2);
  const STORAGE_ADDRESS = args[args.findIndex(argName => argName === '--storage') + 1];
  const REPOSITORY_ADDRESS = args[args.findIndex(argName => argName === '--repository') + 1];
  const { log } = logger(await web3.eth.net.getNetworkType());
  const [deployer] = await web3.eth.getAccounts();

  const storage = await BNSSimpleStorage.at(STORAGE_ADDRESS);
  const repository = await BNSRepository.new(REPOSITORY_ADDRESS);

  DOMAINS_TO_ADDRESSES[2].address = DOMAINS_TO_ADDRESSES[2].address.replace(ADDRESS_PATTERN, storage.address);

  {
    log(`BNSSimpleStorage. Add content for simple site ${ADDRESSES_TO_CONTENTS[0].address}.`);
    const tx = await storage.setContent(ADDRESSES_TO_CONTENTS[0].address, ADDRESSES_TO_CONTENTS[0].content, {from: deployer});
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
  {
    log(`BNSRepository. Add address ${DOMAINS_TO_ADDRESSES[0].address} for domain  ${DOMAINS_TO_ADDRESSES[0].domain} for 999 days.`);
    const latestTime = await time.latest();
    const tx = await repository.setDomainName(deployer, DOMAINS_TO_ADDRESSES[0].domain, DOMAINS_TO_ADDRESSES[0].address, latestTime, new BN(999), {from: deployer});
    log(`Result: successful tx: @tx{${tx.receipt.transactionHash}}`);
  }
}

module.exports = async function main (callback) {
  try {
    await deploy();
    console.log('success');
    callback(null);
  } catch (e) {
    console.log('error');
    console.log(e);
    callback(e);
  }
};
