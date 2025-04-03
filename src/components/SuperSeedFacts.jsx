import { useState, useEffect, useRef, useCallback, memo } from 'react';

// X.com logo as SVG in base64 format for inline usage
const xLogoBase64 = "../src/assets/images/x.png";

const FACTS = [
  "💸 Loans Repay Themselves\nYep, on Superseed your debt can literally vanish on its own—thanks to Supercollateral and protocol-level repayments. Zero stress, just freedom.",
  
  "⚡️No Interest\nBorrow with no interest when using Supercollateral. It's not a promo, it's how the system actually works. 🧠",
  
  "🔥 Daily Auctions&Rewards\nProof-of-Repayment distributes tokens every single day—just by burning debt with our stablecoin. Real value, real users, every day.",
  
  "🧱 Designed On-Chain\nOur lending system isn't an app—it's part of the Layer 2 itself. That means more power, fewer hacks, and unstoppable DeFi. 🛡️",
  
  "🌱 DeFi That Gives Back\nEvery protocol fee—sequencer, interest, bridge—is recycled to repay users' loans. Superseed doesn't take—it returns.",
  
  "🪙 Stablecoin With Purpose\nThe Superseed stablecoin isn't just stable—it's designed to be burned constantly to repay community debt. A true value engine.",
  
  "🤝 Not a User, a Partner.\nOn Superseed, growth literally benefits the individual. As the chain grows, so does your upside.",
  
  "🔓 100% Unlocked\nNo VC lockups here. Our Supersale tokens are fully unlocked from day one. Power to the people. 🙌",
  
  "🚫 No Liquidations\nPartners like MarginZero bring non-liquidatable perps to Superseed. That's right—leverage without the rug.",
  
  "🧠 DeFi for Smart LPs\nOur partner Jones brings institutional-grade yield strategies to your fingertips. One-click, passive gains. 🎯",
  
  "🛠️ Supercollateral = Superpowers\nBorrow with insane efficiency, get your loan paid off, and unlock perks for holding governance tokens. What's not to love?",
  
  "🌉 Live on the Superchain\nWe're part of Optimism's Superchain—meaning better security, shared liquidity, and a network that grows together. 🚀",
  
  "🧬 A New Financial Primitive\nSupercollateral is not just a feature—it's a new foundation for DeFi. Build on it. Borrow with it. Innovate with it.",
  
  "🥇 No More DeFi Gatekeeping\nForget low float, high FDV launches. Superseed prioritizes you with fair distribution, early access, and zero BS.",
  
  "📈 Options, Perps & LPDfi\nThanks to Stryke, MarginZero, Orange & more, Superseed is your new home for cutting-edge financial products.",
  
  "🤯 Oracle Game-Changer\nChronicle brings ultra-secure, gas-efficient oracles to Superseed. Transparent, verified pricing—like DeFi always promised.",
  
  "🧩 Composable From Day 1\nWith partners like Socket and Dolomite, your assets flow across chains seamlessly. Interop, meet innovation.",
  
  "🚀 Mainnet Launch Milestone\nSuperSeed Mainnet officially launched on March 31st, 2025 as part of the Superchain ecosystem, powered by the OP Stack for Ethereum L2 scalability.",
  
  "🤝 Launch Partners Ecosystem\nSuperSeed's initial DeFi ecosystem includes Velodrome, BulletX, MarginZero, Jones, Orange Finance, Stryke, SeedFi, Bebop, Ionic, Dolomite...",
  
  "🗺️ Roadmap Sequence\nFollowing the Mainnet launch, SuperSeed will release Genesis Passport NFTs, launch the Seeds rewards program, and conclude with a TGE.",
  
  "🔮 Upcoming Features\nFuture development includes Proof-of-Repayment, Supercollateral, and the SuperCDP - all designed to turn debt into opportunity.",
  
  "🎫 Genesis Passport NFTs\nOn April 2nd, 2025, SuperSeed will launch 1,148 Genesis Passport NFTs with unique benefits exclusively for Supersale participants.",
  
  "🌉 Bridge Options\nUsers can bridge to SuperSeed using the official Canonical Bridge at bridge.superseed.xyz or third-party bridges like LayerSwap and Relay.",
  
  "🧰 Ecosystem Resources\nSuperSeed provides comprehensive resources including a block explorer, documentation, check: superseed.xyz/ecosystem.",
  
  "🔗 Superchain Benefits\nAs part of the Superchain ecosystem, SuperSeed benefits from shared security, seamless interoperability."
];

const SuperSeedFacts = ({ isMobile }) => {
  const [currentFact, setCurrentFact] = useState("");
  const [isFlashing, setIsFlashing] = useState(false);
  const factsContainerRef = useRef(null);
  
  // Get a random fact
  const getRandomFact = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * FACTS.length);
    return FACTS[randomIndex];
  }, []);
  
  // Format fact text by separating emoji and splitting into paragraphs
  const formatFact = useCallback((fact) => {
    const lines = fact.split('\n');
    if (lines.length < 2) return { title: fact, content: "" };
    
    return {
      title: lines[0],
      content: lines.slice(1).join('\n')
    };
  }, []);
  
  // Change fact every 10 seconds (reduced from 30 seconds)
  useEffect(() => {
    setCurrentFact(getRandomFact());
    
    const intervalId = setInterval(() => {
      // Create triple-flash effect
      setIsFlashing(true);
      setTimeout(() => {
        setIsFlashing(false);
        setTimeout(() => {
          setIsFlashing(true);
          setTimeout(() => {
            setIsFlashing(false);
            setTimeout(() => {
              setIsFlashing(true);
              setTimeout(() => {
                setIsFlashing(false);
              }, 150); // Duration of third flash
            }, 150); // Pause between second and third flash
          }, 150); // Duration of second flash
        }, 150); // Pause between first and second flash
      }, 150); // Duration of first flash
      
      // Set new fact
      setCurrentFact(getRandomFact());
      
    }, 10000); // Update every 10 seconds
    
    return () => clearInterval(intervalId);
  }, [getRandomFact]);
  
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
        {/* Conditionally render footer only on desktop */}
        {!isMobile && (
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
        )}
      </div>
    </div>
  );
};

export default memo(SuperSeedFacts); 