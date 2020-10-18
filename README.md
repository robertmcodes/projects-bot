# projects-bot

A Discord bot used for processing project showcase submissions in [The Coding Den](https://discord.gg/code).

**NOTE:** This is an internal tool. As a result, no support will be provided for using this bot outside its intended environment.

## Development notes

### Setting up the development environment

1. Install dependencies: `npm i`
2. Create environment configuration file: `cp .env.example .env`
3. Edit the configuration: `nano .env`
4. Start TSC in watch mode: `npm run watch`
5. Start the bot: `npm start`

### Sending pull requests to this repository

This project uses [JavaScript Standard Style](https://standardjs.com). Please format your code accordingly.

Pull requests are automatically validated by GitHub Actions, and builds are required to pass for merging to be possible. It may pay off to run TSC (`npm run build`) and ESLint (`npm test`) before pushing your commits.
