const StartButton = ({ callback, isCompetitive = false }) => (
  <button className="start-button" onClick={callback}>
    {isCompetitive ? (
      <span>Pay <span className="crypto-amount">1 $SUPR</span> & Take a Loan</span>
    ) : (
      "Ask for a loan"
    )}
  </button>
);

export default StartButton; 