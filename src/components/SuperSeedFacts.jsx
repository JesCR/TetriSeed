import { useState, useEffect, useRef, useCallback, memo } from 'react';

// X.com logo as SVG in base64 format for inline usage
const xLogoBase64 = "../src/assets/images/x.png";

const FACTS = [
  "💸 Loans Repay Themselves\nYep, on Superseed your debt can literally vanish on its own—thanks to Supercollateral and protocol-level repayments. Zero stress, just freedom.",
  
  "⚡️No Interest\nBorrow with no interest when using Supercollateral. It's not a promo, it's how the system actually works. 🧠",
  
  "🔥 Daily Auctions&Rewards\nProof-of-Repayment distributes tokens every day by burning debt with our stablecoin. Real value for real users, providing sustainable rewards daily.",
  
  "🧱 Designed On-Chain\nOur lending system isn't just an app—it's built into the Layer 2 itself. This architecture delivers more power, better security, and truly unstoppable DeFi solutions.",
  
  "🌱 DeFi That Gives Back\nEvery protocol fee—from sequencers, interest, and bridges. Is recycled to repay users' loans. Superseed returns value instead of extracting it.",
  
  "🪙 Stablecoin With Purpose\nSuperseed stablecoin isn't just stable. It's designed to be continuously burned to repay community debt, a Ecosystem value catalyst.",
  
  "🤝 Not a User, a Partner.\nOn Superseed, ecosystem growth directly benefits individual participants. As the chain expands, your potential upside grows proportionally.",
  
  "🔓 100% Unlocked\nNo venture capital lockups here. Our tokens are fully unlocked from day one, giving complete freedom and control to community members from the start.",
  
  "🚫 No Liquidations\nPartners like MarginZero bring non-liquidatable perpetuals to Superseed. Experience leverage trading without the typical liquidation risks!",
  
  "🧠 DeFi for Smart LPs\nOur partner Jones delivers institutional-grade yield strategies accessible with just one click. Enjoy passive gains without complex setup or management.",
  
  "🛠️ Supercollateral is Super\nBorrow with exceptional efficiency, get loans automatically paid off, and unlock special benefits for holding governance tokens. Reimagining collateral.",
  
  "🌉 Live on the Superchain\nWe're integrated with Optimism's Superchain, providing enhanced security, shared liquidity. A collaborative network that grows stronger together.",
  
  "🧬 A New Financial Primitive\nSupercollateral isn't just a feature—it's a foundational building block for the future of DeFi. Use it to borrow, build upon it, or create innovative new applications.",
  
  "🥇 No More DeFi Gatekeeping\nForget low float, high FDV token launches. Superseed prioritizes fair distribution, early access opportunities, and transparent tokenomics for all participants.",
  
  "📈 Options, Perps & LPDfi\nThanks to partners like Stryke, MarginZero, and Orange, Superseed offers a comprehensive suite of cutting-edge financial products for DeFi users.",
  
  "🤯 Oracle Game-Changer\nChronicle delivers ultra-secure, gas-efficient oracles to the Superseed ecosystem. Experience transparent, verifiable pricing that fulfills DeFi's original promise.",
  
  "🧩 Composable From Day 1\nWith integration partners like Socket and Dolomite, assets flow seamlessly across multiple chains. True interoperability meets continuous innovation.",
  
  "🚀 Mainnet Launch Milestone\nSuperSeed Mainnet launched March 31st as part of the Superchain, leveraging the OP Stack to provide Ethereum L2 scalability with enhanced performance.",
  
  "🤝 Launch Partners Ecosystem\nOur initial DeFi ecosystem includes Velodrome, BulletX, MarginZero, Jones, OrangeFi, Stryke, SeedFi, Bebop, Dolomite and more trusted protocol partners.",
  
  "🗺️ Roadmap Sequence\nFollowing our successful Mainnet launch, SuperSeed will release Genesis Passport NFTs, launch Seeds Rewards Program, and conclude with the TGE.",
  
  "🔮 Upcoming Features\nOur development roadmap includes Proof-of-Repayment, Supercollateral, and SuperCDP. Debt = opportunity.",
  
  "🎫 Genesis Passport NFTs\nOn April 2nd, 2025, we'll launch 1,148 Genesis Passport NFTs offering unique benefits exclusively available to participants in our initial Supersale event.",
  
  "🌉 Bridge Options\nUsers can access SuperSeed via the official Canonical Bridge at bridge.superseed.xyz or through trusted third-party bridges including LayerSwap and Relay.",
  
  "🧰 Ecosystem Resources\nSuperSeed provides comprehensive documentation, tools, block explorers and integration guides. Find everything you need at superseed.xyz/ecosystem.",
  
  "🔗 Superchain Benefits\nAs a core member of the Superchain, SuperSeed leverages shared security infrastructure and interoperability between compatible chains."
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
                // Set new fact only after flash effect is complete
                setCurrentFact(getRandomFact());
              }, 150); // Duration of third flash
            }, 150); // Pause between second and third flash
          }, 150); // Duration of second flash
        }, 150); // Pause between first and second flash
      }, 150); // Duration of first flash
      
    }, 6000); // Update every 6 seconds
    
    return () => clearInterval(intervalId);
  }, [getRandomFact]);
  
  const formattedFact = formatFact(currentFact);
  
  return (
    <div 
      ref={factsContainerRef}
      className={`facts-container ${isFlashing ? 'flash-effect' : ''}`}
      style={{ 
        minHeight: isMobile ? '90px' : '160px',
        padding: isMobile ? '4px' : '5px 10px'
      }}
    >
      <h3 style={{ 
        marginBottom: isMobile ? '2px' : '5px',
        fontSize: isMobile ? '0.8rem' : 'inherit'
      }}>SuperSeed Facts</h3>
      <div>
        <p className="fact-title" style={{ 
          marginBottom: isMobile ? '2px' : '3px',
          fontSize: isMobile ? '0.7rem' : 'inherit'
        }}>{formattedFact.title}</p>
        <p className="fact-content" style={{ 
          lineHeight: isMobile ? '1.1' : '1.3',
          fontSize: isMobile ? '0.65rem' : 'inherit'
        }}>{formattedFact.content}</p>
      </div>
    </div>
  );
};

export default memo(SuperSeedFacts); 