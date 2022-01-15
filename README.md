## Near-Tips Validator

Goal of this project is to decentralized validate user oauth2

    This project has following dependencies:
    - Node (version >= 16)

#### Build and start for dev

    - yarn
    - yarn run generatekeys
    - yarn dev

#### Environment variables to be configured

    - NODE_ENV – production | staging | development
    - PORT – server port number
    - ORIGIN – origin from where you will get requests
    - STACK_KEY – key for stackexchangeapi

#### Docker-compose way for local

To run all the deps in docker run the command

    1. Create .env file and set valuae as in .env.example
    2. yarn run generatekeys
    3. yarn run docker:dev

#### Run validator on your server

    1. Create .env file and set valuae as in example .env.example
    2. yarn run generatekeys
    3. yarn run docker:prod

