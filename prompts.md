# TetriSeed Development Prompts

This document contains all the prompts used during the development of the TetriSeed game, organized chronologically.

## Initial Issues

> I still see three problems. 1: "Rows Cleared" increase 2 per row completed instead of 1 /// 2: When i press the down arrow or the 's' key to move the piece faster to the floor, the "Ask for a loan" button is visible, it hides again when i release the key "s" or down arrow. /// 3. Leaderboard is not sorted by score after a game ends, it just add a new record, now i have in top 3 a 0 score and high values in top 4 and 5 for example. Leaderboard recors must be sorted/updated when a new one is added. Also the date field in the leaderboard still don't shows complete, reduce font size or increase container width or reduce space bteween fields to assure that all the data is showed.

## CSS Fixes

> fix this css, i want to see all the columns headers with the same font size, also i want a td size like 10%,25%,25%,40% so i can see the complete all the values in the record like "David,180,2025-03-28" and not only "4 Maria 240 20" like now

## Game Logic and UI Issues

> ok, i see some problems. 1. Speed seems like reset or goes slower after i press the down key (when i level up speeds increase, but if i press down key it slows down?) /// 2. Looks like the message when a line is cleared shows up and down it must be showed in the middle of the game screen as the level up message. Also the contect is always the same "DEBT REDUCED!" instead of using a random message from the list DEBT_MESSAGES. When the user clears a row the a random msessage from DEBT_MESSAGES list should be displayed only in the middle of the game area. When the user level up the InterestRateMessage shows instead of the debt_message. ///3. when a user clears a row still count double (i clear 1 row and it shows "Rows Cleared: 2", next time i clear a row it goes to "Rows Cleared: 4" and not 2 as it should be.

## Player Name Input Limit

> Max name size should be 5 chars, don't allow the user to enter more.

## GitHub Repository Creation

> Make a new repository in my github, with name "TetriSeed" and upload all the files

## README Documentation

> Update the Readme file, made a new one with all the documentation needed to run the server and the game, i want it fully detailed, for newies to be able to run it. Also add links for all the dependencies or related stuff that you think may be usefull. go ahead!

## Documentation of Prompts

> Can you summarize all the prompts used in this chat in a file called prompts.md ? 