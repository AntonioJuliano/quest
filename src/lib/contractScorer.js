function score(contract, txCount) {
  // This score is weighted by a log function when used to rank results
  const oldScore = contract.score.value || 0;

  // Weight contracts with approved links higher
  const linkWeight = contract.link ? 1.2 : .8;

  // Weight contracts with source code higher
  const sourceWeight = contract.link ? 1.3 : .7;

  const newScore = Math.round((oldScore * .8 + txCount) * linkWeight * sourceWeight);
  return newScore;
}

module.exports.score = score;
