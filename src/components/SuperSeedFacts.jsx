import { useState, useEffect, useRef, useCallback, memo } from 'react';

// X.com logo as SVG in base64 format for inline usage
const xLogoBase64 = "../src/assets/images/x.png";

const FACTS = [
  "💸 Loans That Repay Themselves?!\nYep, on Superseed your debt can literally vanish on its own—thanks to Supercollateral and protocol-level repayments. Zero stress, just freedom.",
  
  "⚡️No Interest. Ever.\nBorrow with no interest when using Supercollateral. It's not a promo, it's how the system actually works. 🧠",
  
  "🔥 Daily Auctions, Daily Rewards\nProof-of-Repayment distributes tokens every single day—just by burning debt with our stablecoin. Real value, real users, every day.",
  
  "🧱 Built Right Into the Chain\nOur lending system isn't an app—it's part of the Layer 2 itself. That means more power, fewer hacks, and unstoppable DeFi. 🛡️",
  
  "🌱 DeFi That Gives Back\nEvery protocol fee—sequencer, interest, bridge—is recycled to repay users' loans. Superseed doesn't take—it returns.",
  
  "🪙 Stablecoin With Purpose\nThe Superseed stablecoin isn't just stable—it's designed to be burned constantly to repay community debt. A true value engine.",
  
  "🤝 You're Not a User. You're a Partner.\nOn Superseed, growth literally benefits the individual. As the chain grows, so does your upside.",
  
  "🔓 100% Unlocked Token Launch\nNo VC lockups here. Our Supersale tokens are fully unlocked from day one. Power to the people. 🙌",
  
  "🚫 No Liquidations (Yes, Really)\nPartners like MarginZero bring non-liquidatable perps to Superseed. That's right—leverage without the rug.",
  
  "🧠 DeFi for Smart LPs\nOur partner Jones brings institutional-grade yield strategies to your fingertips. One-click, passive gains. 🎯",
  
  "🛠️ Supercollateral = Superpowers\nBorrow with insane efficiency, get your loan paid off, and unlock perks for holding governance tokens. What's not to love?",
  
  "🌉 Live on the Superchain\nWe're part of Optimism's Superchain—meaning better security, shared liquidity, and a network that grows together. 🚀",
  
  "🪄 Testnet = Rewards\nJoin the testnet? Get NFTs, Discord roles, XP, and maybe more. (Hint: You really want that \"Superseed Pioneer\" role. 😉)",
  
  "🎨 Culture of Contribution\nMake a meme, write a thread, suggest a feature—get noticed. Our top contributors get real rewards, not just emojis.",
  
  "🧬 A New Financial Primitive\nSupercollateral is not just a feature—it's a new foundation for DeFi. Build on it. Borrow with it. Innovate with it.",
  
  "🥇 No More DeFi Gatekeeping\nForget low float, high FDV launches. Superseed prioritizes you with fair distribution, early access, and zero BS.",
  
  "📈 Options, Perps & LPDfi — On One Chain\nThanks to Stryke, MarginZero, Orange & more, Superseed is your new home for cutting-edge financial products.",
  
  "🤯 Oracle Game-Changer\nChronicle brings ultra-secure, gas-efficient oracles to Superseed. Transparent, verified pricing—like DeFi always promised.",
  
  "🧩 Composable From Day 1\nWith partners like Socket and Dolomite, your assets flow across chains seamlessly. Interop, meet innovation.",
  
  "🧑‍🌾 Harvest Season is Now\nOur Phase 3 testnet is here—and it's packed with dApps, quests, and rare NFTs. Complete it all to lock in launch rewards. 🌾"
];

const SuperSeedFacts = () => {
  const [currentFact, setCurrentFact] = useState("");
  const [isFlashing, setIsFlashing] = useState(false);
  const factsContainerRef = useRef(null);
  
  // Get a random fact
  const getRandomFact = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * FACTS.length);
    return FACTS[randomIndex];
  }, []);
  
  // Change fact every 30 seconds (increased from 10 seconds)
  useEffect(() => {
    setCurrentFact(getRandomFact());
    
    const intervalId = setInterval(() => {
      // Trigger flash effect
      setIsFlashing(true);
      
      // Set new fact
      setCurrentFact(getRandomFact());
      
      // Remove flash effect after animation completes
      setTimeout(() => {
        setIsFlashing(false);
      }, 700); // Animation duration
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [getRandomFact]);
  
  // Format fact text by separating emoji and splitting into paragraphs
  const formatFact = useCallback((fact) => {
    const lines = fact.split('\n');
    if (lines.length < 2) return { title: fact, content: "" };
    
    return {
      title: lines[0],
      content: lines.slice(1).join('\n')
    };
  }, []);
  
  const formattedFact = formatFact(currentFact);
  
  return (
    <div 
      className={`facts-container ${isFlashing ? 'flash-effect' : ''}`}
      ref={factsContainerRef}
    >
      <h3>SuperSeed Facts</h3>
      <div>
        <p className="fact-title">{formattedFact.title}</p>
        <p className="fact-content">{formattedFact.content}</p>
        <div className="facts-footer">
          <a href="https://superseed.xyz" target="_blank" rel="noopener noreferrer">
            Check SuperSeed!
          </a>
          <div className="social-icons">
            <a href="https://x.com/superseedxyz" target="_blank" rel="noopener noreferrer">
              <img src={xLogoBase64} alt="X.com" className="social-icon" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(SuperSeedFacts); 