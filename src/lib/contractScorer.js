const OLD_SCORE_WEIGHT = parseFloat(process.env.CONTRACT_SCORE_OLD_SCORE_WEIGHT);
const LINK_WEIGHT = parseFloat(process.env.CONTRACT_SCORE_LINK_WEIGHT);
const SOURCE_WEIGHT = parseFloat(process.env.CONTRACT_SCORE_SOURCE_WEIGHT);

function score(contract, txCount) {
  // This score is weighted by a log function when used to rank results
  const oldScore = contract.score.value || 0;

  // Weight contracts with approved links higher
  const linkWeight = contract.link ? LINK_WEIGHT : 1;

  // Weight contracts with source code higher
  const sourceWeight = contract.link ? SOURCE_WEIGHT : 1;

  const newScore = Math.round((oldScore * OLD_SCORE_WEIGHT + txCount) * linkWeight * sourceWeight);
  return newScore;
}

module.exports.score = score;
