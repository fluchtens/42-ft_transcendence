const winLossRatio = (wonMatches: number, lostMatches: number) => {
  if (lostMatches === 0) {
    return "...";
  }
  return (wonMatches / lostMatches).toFixed(2);
};

export default winLossRatio;
