const { time } = require('@openzeppelin/test-helpers');
const { toBN } = require('web3-utils');
const { contract } = require('@openzeppelin/test-environment');

// This decodes logs for a single event type, and returns a decoded object in
// the same form truffle-contract uses on its receipts
// This function is a part of '@openzeppelin/test-helpers'
function decodeLogs (logs, emitter, eventName, web3) {
  let abi;
  let address;
  if (isWeb3Contract(emitter)) {
    abi = emitter.options.jsonInterface;
    address = emitter.options.address;
  } else if (isTruffleContract(emitter)) {
    abi = emitter.abi;
    try {
      address = emitter.address;
    } catch (e) {
      address = null;
    }
  } else {
    throw new Error('Unknown contract object');
  }

  let eventABI = abi.filter(x => x.type === 'event' && x.name === eventName);
  if (eventABI.length === 0) {
    throw new Error(`No ABI entry for event '${eventName}'`);
  } else if (eventABI.length > 1) {
    throw new Error(`Multiple ABI entries for event '${eventName}', only uniquely named events are supported`);
  }

  eventABI = eventABI[0];

  // The first topic will equal the hash of the event signature
  const eventSignature = `${eventName}(${eventABI.inputs.map(input => input.type).join(',')})`;
  const eventTopic = web3.utils.sha3(eventSignature);

  // Only decode events of type 'EventName'
  return logs
    .filter(log => log.topics.length > 0 && log.topics[0] === eventTopic && (!address || log.address === address))
    .map(log => web3.eth.abi.decodeLog(eventABI.inputs, log.data, log.topics.slice(1)))
    .map(decoded => ({ event: eventName, args: decoded }));
}

/**
 *
 * @param hash - transaction hash
 * @param web3 - web3 instance
 * @returns {Promise<BN>} - transaction cost
 */
async function getTransactionCost (hash, web3) {
  const { gasPrice } = await web3.eth.getTransaction(hash);
  const { gasUsed } = await web3.eth.getTransactionReceipt(hash);
  return toBN(gasPrice).mul(toBN(gasUsed));
}

/**
 * Calculates the date that occurs exactly X days from now
 * @param days - number of days from current date
 * @returns {promise} - Unix TimeStamp in seconds
 */
async function dateFromNow (days) {
  return (await time.latest()).addn(days * 24 * 3600).toNumber();
}

/**
 * Increases ganache time if possible
 * @param timestamp
 * @returns {Promise<void>}
 */
async function increaseDateTo (timestamp) {
  if (await time.latest() < timestamp) await time.increaseTo(timestamp);
}

function isWeb3Contract (contract) {
  return 'options' in contract && typeof contract.options === 'object';
}

function isTruffleContract (contract) {
  return 'abi' in contract && typeof contract.abi === 'object';
}

async function getEvents (txHash, emitter, eventName, web3) {
  const receipt = await web3.eth.getTransactionReceipt(txHash);
  return decodeLogs(receipt.logs, emitter, eventName, web3);
}

/**
 *
 * @param artifact path to artifact
 * @returns {object} contract
 */
function fromArtifact (artifact) {
  const { abi, bytecode } = require(artifact);
  return contract.fromABI(abi, bytecode);
}

module.exports = {
  fromArtifact,
  getEvents,
  getTransactionCost,
  dateFromNow,
  increaseDateTo
};
