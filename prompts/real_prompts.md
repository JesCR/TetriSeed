1. I want to create a javascript game that runs on a client browser, the project should use vite + react + js + css, create all the directories and files needed.

The name of the game will be TetriSeed: Clear your Debt

The game is a custom Tetris with the same rules and mechanics as the classic game but the pieces should be formed with the $ symbol or bills (the classic shapes and colors but with bills for example)
When the player complets a line, as usual it disapear, but at the same time a message from a list should be visible in the top of the game screen.
list:  "Debt repayed!", "Enjoy SuperCollateral", "Proof of repayment received!", "LFG SuperSeed!", "Clear your Debt"

The game should have a main section for the game and a side section with a leaderboard with the top 10 scores and the name of the player (so first time a player enters he should be prompted for a name). 
I think that the easy way to hold the scores is with a csv file saved in the backend, but take the best simple way to do that.

The main section should have the start game button but with the text "Ask for a loan"
When the player loses instead of Game Over he will see a "Liquidated" message and the option to star again

If the player enters in the top 10 they should be asked to write a twitt tagging @SuperseedXYZ account with a cool msg about the game and the score and promoting SuperSeed as the best DeFi protocol for loans

The game should have good quality in terms of UI/UX and look like a clasic arcade game
I have two images in the image_resources folder with the logo of SuperSeed, and logo with text. use that as inspiration for typography (check for font style that looks similar) 


2. after press the "ask for a loan" button (start game) screen goes black and nothing happens, i see this error in the console: react-dom_client.js?v=452ab7e4:5587 An error occurred in the <Cell> component. Check all the flow to assure that the game works as expected


3. now the game starts but the arrows / tapping screen / wasd keys don't move the pieces as expected, i want to be able to place the piece left/right as it goes down (like in the Tetris game). Also, after the first piece touch the floor the screen goes black and nothing else happens

4. Tetris.jsx:75 Uncaught ReferenceError: Cannot access 'movePlayer' before initialization
    at Tetris (Tetris.jsx:75:39)
    at react-stack-bottom-frame (react-dom_client.js?v=4cca1b2d:16190:20)
    at renderWithHooks (react-dom_client.js?v=4cca1b2d:4304:24)
    at updateFunctionComponent (react-dom_client.js?v=4cca1b2d:5970:21)
    at beginWork (react-dom_client.js?v=4cca1b2d:7046:20)
    at runWithFiberInDEV (react-dom_client.js?v=4cca1b2d:724:18)
    at performUnitOfWork (react-dom_client.js?v=4cca1b2d:10829:98)
    at workLoopSync (react-dom_client.js?v=4cca1b2d:10690:43)
    at renderRootSync (react-dom_client.js?v=4cca1b2d:10673:13)
    at performWorkOnRoot (react-dom_client.js?v=4cca1b2d:10321:46)
react-dom_client.js?v=4cca1b2d:5587 An error occurred in the <Tetris> component.

5.Now i after i enter the name in the modal the ask for a loan button is missing, and i can't start a game

6.ok, some problems i found. 1. All the shapes (pieces of the same shape) have the same color, i want them to have background colors like in the original tetris. 2. The leaderboard don't show my name after i finish the game in the top 10, laos don't show the score, each completed line should add 10 points to the score.  3. Afer each line completed the game speed should increase la random number between (1% and 20%) and a message should appear in the middle of the game screen with the text "Loan interest rises {%x}" 4. The message after a line is completed should show in the botton of the game area too. 

7. issues: 1. Game speed don't seems to update or rises too low after line complete. Adjutst to be two times faster as it is now. 2. Leader board still don't show name of player, score or date. Fix the leaderboard to display the correct data, check if the vales are saved after the game. 3. There is a weird behaviour when i press the down key to move the piece fast, the "Ask for a loan" button shows up and dissapear. after i release the key. 4. When i close the modal of "congratulations" a new game starts instead of waiting for the user to press the "ask for a loan" button. 5. The game area (where i can move the pieces) is ok, but there is like a lot of free blank space in the game zone, adjust that

8. issues: 1: Pieces don't continue falling after pressing down key, also "ask for a loan" shows up and don't goes away (i don't want to see that button while a game is going on, pressing it in the middle of a game causes to start over a new game) 2: leaderboard shows: "1	Unknown	0	Today
2	Unknown	0	Today" instead of names and score. Also the width of the leaderboard container is not big enought to hold that text . 4: The tittle "TetriSeed: Clear your Debt" is too big, should occup the same width as the game area + leaderboard area

9. i still don't see the right info on the leaderboard, also this needs more width as the text not showing like should be

10. leaderboard now don't show any data. Also there is an issue, after the first line completes, with the next block the speeed goes crazy and all the pieces falls almost instantly (check image).

11. issues and fixes: 1/ the InterestMessage is too big, reduce it by 30% 2/ The leaderboard width is not enough 3/ in the code selected (logo and h1) reduce 30% size of the text and increas 25% size of the logo. 4/ The level should increase when the user clears 5 rows instad of 10 like it is now. Also the innerMessasge shoudl show up when the user level up and not in every complete row. When the user clears a row we show the debt-message but now in the place of the InterestMessage (so, every clear debt-message in the middle of the screen, and every level up the interestmessage in the middle of the screen, no message in the botton of the screen)

12. The screen is blank, i see this error in console: Uncaught SyntaxError: The requested module '/src/hooks/useStage.js' does not provide an export named 'createStage' (at Tetris.jsx:8:10) /// Also Ensure that the Leaderboard selected block displays properly, with some space between the text and the button, button should be in the right upper corner of this leaderboard container

13.1./ Ciurrent player block should have the same width as leaderboard 2./ i see that after i setup a new record my user goes to first rank as should be, but the old number one is missed, removed, and should be just in the second place. Check that the leader board is properly sorted and saved when a game ends. 3./ i see a good increment in speed after level up, but at some point (level 4 i guess) the speed remains the same forever

14. Check the picture attached, the date records are cutted. Also let's reduce the leaderboard to 5 records  (top 5 players). Below the Current player container should be another new one same width and the height to fit in the space available until the game area floor. This container, "SuperSeed Factos" should show a random message from this list: "💸 Loans That Repay Themselves?!
Yep, on Superseed your debt can literally vanish on its own—thanks to Supercollateral and protocol-level repayments. Zero stress, just freedom.

⚡️No Interest. Ever.
Borrow with no interest when using Supercollateral. It's not a promo, it's how the system actually works. 🧠

🔥 Daily Auctions, Daily Rewards
Proof-of-Repayment distributes tokens every single day—just by burning debt with our stablecoin. Real value, real users, every day.

🧱 Built Right Into the Chain
Our lending system isn’t an app—it’s part of the Layer 2 itself. That means more power, fewer hacks, and unstoppable DeFi. 🛡️

🌱 DeFi That Gives Back
Every protocol fee—sequencer, interest, bridge—is recycled to repay users’ loans. Superseed doesn’t take—it returns.

🪙 Stablecoin With Purpose
The Superseed stablecoin isn’t just stable—it’s designed to be burned constantly to repay community debt. A true value engine.

🤝 You're Not a User. You're a Partner.
On Superseed, growth literally benefits the individual. As the chain grows, so does your upside.

🔓 100% Unlocked Token Launch
No VC lockups here. Our Supersale tokens are fully unlocked from day one. Power to the people. 🙌

🚫 No Liquidations (Yes, Really)
Partners like MarginZero bring non-liquidatable perps to Superseed. That’s right—leverage without the rug.

🧠 DeFi for Smart LPs
Our partner Jones brings institutional-grade yield strategies to your fingertips. One-click, passive gains. 🎯

🛠️ Supercollateral = Superpowers
Borrow with insane efficiency, get your loan paid off, and unlock perks for holding governance tokens. What’s not to love?

🌉 Live on the Superchain
We’re part of Optimism’s Superchain—meaning better security, shared liquidity, and a network that grows together. 🚀

🪄 Testnet = Rewards
Join the testnet? Get NFTs, Discord roles, XP, and maybe more. (Hint: You really want that "Superseed Pioneer" role. 😉)

🎨 Culture of Contribution
Make a meme, write a thread, suggest a feature—get noticed. Our top contributors get real rewards, not just emojis.

🧬 A New Financial Primitive
Supercollateral is not just a feature—it’s a new foundation for DeFi. Build on it. Borrow with it. Innovate with it.

🥇 No More DeFi Gatekeeping
Forget low float, high FDV launches. Superseed prioritizes you with fair distribution, early access, and zero BS.

📈 Options, Perps & LPDfi — On One Chain
Thanks to Stryke, MarginZero, Orange & more, Superseed is your new home for cutting-edge financial products.

🤯 Oracle Game-Changer
Chronicle brings ultra-secure, gas-efficient oracles to Superseed. Transparent, verified pricing—like DeFi always promised.

🧩 Composable From Day 1
With partners like Socket and Dolomite, your assets flow across chains seamlessly. Interop, meet innovation.

🧑‍🌾 Harvest Season is Now
Our Phase 3 testnet is here—and it’s packed with dApps, quests, and rare NFTs. Complete it all to lock in launch rewards. 🌾"

15. For some reason every line cleared is scoring double? i clear 1 row and display says 2. Also, for the SuperSeed Facts messages, eveery message has like a title and after a break line \n the explanation. i want the tittle centered and the explanation justified and with the text a little smaller

16. At the botton of the SuperSeed Facts container add a line "Check SuperSeed" that is always visible with a link to  "superseed.xyz" that opens in a new window. Also add a x.com logo with a link to .com/superseedxyz, should be like a footer of that container, in one line

17. I still see three problems. 1: "Rows Cleared" increase 2 per row completed instead of 1 /// 2: When i press the down arrow or the 's' key to move the piece faster to the floor, the "Ask for a loan" button is visible, it hides again when i release the key "s" or down arrow. /// 3. Leaderboard is not sorted by score after a game ends, it just add a new record, now i have in top 3 a 0 score and high values in top 4 and 5 for example. Leaderboard recors must be sorted/updated when a new one is added. Also the date field in the leaderboard still don't shows complete

18. I still see three problems. 1: "Rows Cleared" increase 2 per row completed instead of 1 /// 2: When i press the down arrow or the 's' key to move the piece faster to the floor, the "Ask for a loan" button is visible, it hides again when i release the key "s" or down arrow. /// 3. Leaderboard is not sorted by score after a game ends, it just add a new record, now i have in top 3 a 0 score and high values in top 4 and 5 for example. Leaderboard recors must be sorted/updated when a new one is added. Also the date field in the leaderboard still don't shows complete, reduce font size or increase container width or reduce space bteween fields to assure that all the data is showed. 

19. fix this css, i want to see all the columns headers with the same font size, also i want a td size like 10%,25%,25%,40% so i can see the complete all the values in the record like "David,180,2025-03-28" and not only "4	Maria	240	20" like now

20. ok, i see some problems. 1. Speed seems like reset or goes slower after i press the down key (when i level up speeds increase, but if i press down key it slows down?) /// 2. Looks like the message when a line is cleared shows up and down it must be showed in the middle of the game screen as the level up message. Also the contect is always the same "DEBT REDUCED!" instead of using a random message from the list DEBT_MESSAGES. When the user clears a row the a random msessage from DEBT_MESSAGES list should be displayed only in the middle of the game area.
When the user level up the InterestRateMessage shows instead of the debt_message. ///3. when a user clears a row still count double (i clear 1 row and it shows "Rows Cleared: 2", next time i clear a row it goes to "Rows Cleared: 4" and not 2 as it should be.

21. Make a new repository in my github, with name "TetriSeed" and upload all the files

22. Update the Readme file, made a new one with all the documentation needed to run the server and the game, i want it fully detailed, for newies to be able to run it. Also add links for all the dependencies or related stuff that you think may be usefull. go ahead!

23. Can you summarize all the prompts used in this chat in a file called prompts.md ?

24. i want to use the image_resources/logo.ico as the ico of the proyect, the onw showed in the browser tab, add it

25. i think is better to move the ico to the public folder and use it from there

26. add the background.png as background of the game board, adjust to fill all the area

27. 1. Mobile: I need to fix/improve the movements of the pieces (and overall behaviour of the screen) in mobile devices. Maybe adding a touching cursor <-,v,-> under the screen, with move right, left, and down keys to tap will be better. 
2. Mobile: Also i need to be sure that least the score, rows cleare4d, level boxes are displayed in the movile while playing, ensure that maybe you need to reduce the "game area" on mobile and reduce the text size and space used by the text boxes.
3. Mobile: Check that all works as expected in a mobile device like an iphone / samsung galaxy   
4. General: talking about the general game, i want the initial speed to increas 20%, the base speed qhen a new game starts, and then increase when the level up over this base speed.
5. General: i want to add a white flash efect to catch attention of the super seed facto container when the content changes.

28. On mobile the screen still looks weird, textboxes with score etc are not centered below the game area. controls are in position but don't works as expected. 1 Left arrow only moves piece 1 space and them don't do nothing. 2 down control mades the button "Ask for a loan" to shows up, and in the same place of controls and that mades you click it an the game starts again. Check carefully that the buttons do what they must do, avoid to show the "ask for a loan" button if there is a game in play (somehow is connected to the down button / key, this also happens in desktop game). Also be sure that a tap in the game are is like a tap in the rotate control. No other action must occour if the user taps in the game area. Also when the user activates te username textbox the screen does a zoom in the control. Be ser that when te game starts the zooms are out and all the game area / controls are visible

29. right arrow still don't works. taping in game area causes a double rotation and a left movement. right arrow must move the piece one position to the right (only do that when the piece is in the left border of the screen) . tap in the screen (in the game area) must trigger a piece rotation, onlye one rotation and no movement right or left

30. Mobile game issues: 1. Now the right arrow works fine, also the tap on game area screen works fine, but the rotate button makes the piece to do a double rotation. Ensure that the rotate button only rotate the piece one time. 2. Check the image and you see that the score, rows cleared and level textboxes are not taking the same width as the game area, i want that in the mobile version  you change the text "Rows Cleared" to "Rows" and put the 3 textboxes in the same row, taking the same width as the direction buttons.

31. 1. In the desktop version, check the 3 score - rows cleared - level textboxes to have the same width as the game area. 2. in the Mobile version, the "Ask for a loan" button should be center-aligned, now it is aligned to the left 3. The SuperSeed Facts change the message too slow, change the message every 10 seconds. 4. in the mobile version, now the left and right buttons some times mades double moves, i want to move the piece 1 position left, click left and the piece moves twices, like you did fixing the double rotation issue, fix this double movements when pressing left or right.

32. in the mobile verision, i want the container "superSeed Facts" on top of the game area, we must be sured that in the mobile dysplay the user always sees the next sections without the need to scroll down: the logo/title (as it is now), next the superseed facts, next the game area with the textboxes (as they are now, in a centered single line), next the "Ask for a loan" button before the game starts and the game controls when the game is running. Then the user can scroll down to see the rest.

33. in mobile: 1. Reduce the gap between Supep¡rseed facts container and game area to 1/3 of the one we have now. 2. Remove the controls message at the botton :" Controls: ← → ↓ ↑ or WASD" 

34. After enter the username, when the modal dismiss and the keyboard disappear, i still need to scroll up to see the logo / title and top of the superseed container.

35. in my iphone, still don't work, the screen don't move to top after enter the user name...
