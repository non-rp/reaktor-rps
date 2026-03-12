# Rock-Paper-Scissors (RPS) Statistic Project 

## Requested Features 

- Viewing the latest RPS match results

- Viewing the RPS match results on a given day

- Viewing match results for a specific player

- Today’s leaderboard of players based on number of wins

- Historical leaderboard based on number of wins, which shows the results for a specific date range

## Initial information 

- protected External API - https://assignments.reaktor.com/

- ExtAPI has /history and /live routes

- /history - Returns a page of game data and a path to the next page of data.

- /live    – Streams live game results as Server-Sent Events (SSE).

- prefered teck stack: modern web technologies (e.g. Typescript, React, Node) (not my main stack)

- duration from 09.03.26 9:00 to 15.03.26 23:59

## Goals

1. Implement all required features
2. Try to build as quality as I can 
3. Deploy result to server
4. Deeply learn JS based techstack, find my weaks,add to list for next practice 

## Technologies 

 - according to recomendation + learning process the main stack for this project will be Node.js, Express, React, TTypescript, PostgresSQL

 - Back-end: Node.js, Express - the project is not so big and complecated, + we are not going to expand it so for MVP stage it's enough
 
 - Front-end: React - i would prefer to split fe and be, in case we are not going to use nothing complex as SSR, ISR and we don't need SEO or robots indexing for this aplication React is more than enough. + I have experience with it more so it's okay solution here 

 - Typescript: it's already a standart for development, types is mast have

 - Postgres: I didn't find any points to use no relative main db here as Mongo, we have clear models structure with a few columns whome will be filled fully with data from api. Relative db is easyly to understand and support. Postgress as a standart, so just use it.

 - We have a huge amount of data, so we can add caching here and use Redis for faster responces. This can be implemented after in case I'll have time

 ## Plan 

1. External API investigation (Postman)

 - Data structure 
 - Filtering and pagination functionality
 - Decide the next steps how to work with it
 - Do we need to pull data to our db or work directly with ExtAPI? - yes we need to have data in normalized type so we need to implement puling(sync) functionality

2. Back-end

 - implementation extAPI data sync to our db(all previous data), extAPI doesn't have rate limiting so we can pull data hard, but retrys should be added anyway.
 - implement cron job, extAPI /history page updates hourly with mathes of previous hour and cursor on prev hour page data
 - save populated pages cursor to our db, so we can control all data is available and sync, if our service down for a some time after start it should check if there is new data and pull it all
 - create a proper db structure with indexes, avoid n+1 problem in future requests
 - Swagger documentation as part for next FE implementation, actually I don't need it, but let's think this project will be supported and extended after with a team.

3. Front-end

 - design: I don't have time to design project in Figma(actually I am not designer so it can take a lots time) I can use free ready-made solutions as Material UI to speed up FE build
 - so the solution here is to build responsive layout with UI lib
 - Components: Header, Footer, Buttons, Select, Table(with paging)

 4. Testing implementation

 - let's try to implement some integration and unit testing only after main features finished

 ## Deployment 

 - Homework Submission form has "Live Application URL (Optional)" so would be greate to deploy app to server. 
 - I have a VPS so spent some time to set up sub-domain, SSL, docker and nginx for next deploy.
 - If I have time CI/CD piplines makes sence for deployment  but for showcasing I can deploy it manually

 ## AI usage

 I use AI every day as my third hand, some time ago I did tha same with Google search and stackoverflow. 

 According to time limits and plans I don't have enough time to write everithing on my own so partly I will delegate code writing to AI.

 In case techstack the project use is not my main but I am in progress of learning all code written by AI mast be reviewed and all unclear part studied or escaleted to learning plan and will be practiced.



 