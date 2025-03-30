const StartButton = ({ callback, isCompetitive = false }) => (
  <button className="start-button" onClick={callback}>
    {isCompetitive ? "Ask for a loan" : "Ask for a loan"}
  </button>
);

export default StartButton; 